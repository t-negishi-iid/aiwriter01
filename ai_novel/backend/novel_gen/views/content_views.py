"""
エピソード本文関連のビュー
"""
from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.db import transaction
import re
import json
import logging

from ..models import (
    AIStory, BasicSetting, CharacterDetail, ActDetail,
    EpisodeDetail, EpisodeContent, APIRequestLog
)
from ..serializers import (
    EpisodeContentCreateSerializer, EpisodeContentSerializer,
    EpisodeContentRequestSerializer, EpisodeContentUpdateSerializer
)
from ..dify_streaming_api import DifyStreamingAPI, get_markdown_from_last_chunk
from ..utils import check_and_consume_credit

logger = logging.getLogger(__name__)

class CreateEpisodeContentView(views.APIView):
    """
    エピソード本文生成ビュー（ストリーミングAPI版
    EpisodeDetail（幕の詳細）を指定された文字数で小説本文を生成する。（Dify APIを使用）
    クレジットを消費します。
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        """エピソード本文を生成"""
        story_id = self.kwargs.get('story_id')
        act_number = self.kwargs.get('act_number')
        episode_number = self.kwargs.get('episode_number')

        # ストーリーの検証
        story = get_object_or_404(AIStory, id=story_id, user=request.user)

        # 幕の検証
        act = get_object_or_404(ActDetail, ai_story=story, act_number=act_number)

        # エピソードの検証
        episode = get_object_or_404(EpisodeDetail, act=act, episode_number=episode_number)

        # リクエストの検証
        serializer = EpisodeContentRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # リクエストパラメータの取得
        basic_setting_id = serializer.validated_data['basic_setting_id']
        word_count = serializer.validated_data['word_count']

        # 基本設定の取得
        basic_setting = get_object_or_404(BasicSetting, id=basic_setting_id)

        # 基本設定が同じストーリーに属しているか検証
        if basic_setting.ai_story_id != story.id:
            return Response(
                {'error': '指定された基本設定はこの小説のものではありません。'},
                status=status.HTTP_403_FORBIDDEN
            )

        # キャラクター詳細の取得
        character_details = CharacterDetail.objects.filter(ai_story=story)

        # story_idから全キャラクターのCharacterDetail.raw_contentを取得して配列化
        all_characters_list = [char.raw_content for char in character_details]

        # story_idから全ActのEpisodeDetail.raw_contentを取得して配列化
        all_episode_details = EpisodeDetail.objects.filter(act__ai_story=story)
        all_episode_details_list = [episode_detail.raw_content for episode_detail in all_episode_details]

        # APIログの作成
        api_log = APIRequestLog.objects.create(
            user=request.user,
            request_type='episode_content',
            ai_story=story,
            parameters={
                'story_id': story.id,
                'basic_setting_id': basic_setting_id,
                'act_number': act_number,
                'episode_number': episode_number,
                'word_count': word_count
            },
            credit_cost=4
        )


        try:
            # ストリーミングAPIを初期化
            streaming_api = DifyStreamingAPI()

            # 全チャンクと最終チャンク用の変数
            all_chunks = []
            last_chunk = None

            # ストリーミングAPIを呼び出し、各チャンクを処理
            for chunk in streaming_api.create_episode_content_stream(
                basic_setting=basic_setting.raw_content,
                all_characters_list=all_characters_list,
                all_episode_details_list=all_episode_details_list,
                target_episode_detail=episode.raw_content,
                act_number=act_number,
                episode_number=episode_number,
                word_count=word_count,
                user_id=str(request.user.id)
            ):
                # エラーチェック
                if 'error' in chunk:
                    api_log.is_success = False
                    api_log.response = str(chunk)
                    api_log.save()
                    return Response(
                        {'error': 'エピソード本文の生成に失敗しました', 'details': chunk},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

                # チャンクを保存
                all_chunks.append(chunk)

                # 最終チャンクを更新
                if 'event' in chunk and chunk['event'] == "workflow_finished":
                    # workflow_finished イベントを最優先で検出
                    last_chunk = chunk
                    logger.debug(f"workflow_finished イベントを最終チャンクとして検出しました: {chunk}")
                elif 'done' in chunk and chunk['done']:
                    last_chunk = chunk
                elif 'event' in chunk and chunk['event'] == 'node_finished':
                    last_chunk = chunk

            # 最終チャンクからMarkdownを取得
            raw_content = get_markdown_from_last_chunk(last_chunk, all_chunks)

            # レスポンスの検証
            logger.debug(f"DEBUG - CreateEpisodeDetailView - API response markdown: {raw_content[:500]}...")


            # 取得したcontentからエピソードタイトルと本文を取得
            episode_title = episode.title  # デフォルトはエピソード詳細のタイトル
            episode_content = raw_content

            # タイトルのパターンを検出 (## エピソード数「タイトル」 の形式)
            title_match = re.search(r'##\s+エピソード\d+「([^」]+)」', raw_content)
            if title_match:
                # タイトルが見つかった場合
                episode_title = title_match.group(1)

                # タイトル行を除いた本文を抽出
                content_lines = raw_content.split('\n')
                for i, line in enumerate(content_lines):
                    if '##' in line and 'エピソード' in line:
                        # タイトル行の次から本文が始まる
                        episode_content = '\n'.join(content_lines[i+1:]).strip()
                        break

            # エピソード本文を保存（既存のエピソード本文がある場合は更新する）
            try:
                # 既存のエピソード本文を取得して更新
                episode_content_obj, created = EpisodeContent.objects.update_or_create(
                    episode=episode,
                    defaults={
                        'title': episode_title,
                        'content': episode_content,
                        'word_count': len(episode_content),
                        'raw_content': raw_content
                    }
                )
            except Exception as content_error:
                logger.error(f"エピソード本文の保存中にエラー発生: {content_error}")
                api_log.is_success = False
                api_log.response = f"エピソード本文の保存中にエラー発生: {content_error}"
                api_log.save()
                return Response(
                    {'error': 'エピソード本文の保存に失敗しました', 'details': str(content_error)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # APIログの更新
            api_log.is_success = True
            api_log.response = raw_content
            api_log.save()

            # クレジットの確認と消費
            success, message = check_and_consume_credit(request.user, 'episode_content')
            if not success:
                return Response({'error': message}, status=status.HTTP_402_PAYMENT_REQUIRED)

            # レスポンスを返す
            result_serializer = EpisodeContentSerializer(episode_content_obj)
            return Response(result_serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

        except Exception as e:
            # エラーログ
            api_log.is_success = False
            api_log.response = str(e)
            api_log.save()
            return Response(
                {'error': 'エピソード本文の生成に失敗しました', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class EpisodeContentListView(generics.ListCreateAPIView):
    """
    エピソード本文一覧・新規作成ビュー

    幕に属する全エピソード本文の一覧を取得する、新規作成する
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EpisodeContentSerializer

    def get_queryset(self):
        """幕に属する全エピソード本文の一覧を取得"""
        story_id = self.kwargs.get('story_id')
        act_number = self.kwargs.get('act_number')

        # ストーリーの検証
        story = get_object_or_404(AIStory, id=story_id, user=self.request.user)

        # 幕の検証
        act = get_object_or_404(ActDetail, ai_story=story, act_number=act_number)

        # エピソード詳細の取得
        episode_details = EpisodeDetail.objects.filter(act=act).order_by('episode_number')

        # エピソード詳細に紐づくエピソード本文を取得
        return EpisodeContent.objects.filter(episode__in=episode_details).order_by('episode__episode_number')

    def list(self, request, *args, **kwargs):
        """エピソード本文一覧を取得（データがない場合は204を返す）"""
        queryset = self.filter_queryset(self.get_queryset())

        # クエリセットが空の場合は204 No Contentを返す
        if not queryset.exists():
            return Response(status=status.HTTP_204_NO_CONTENT)

        # 通常の処理（ページネーション含む）
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """エピソード本文を新規作成"""
        story_id = self.kwargs.get('story_id')
        act_number = self.kwargs.get('act_number')

        # ストーリーの検証
        story = get_object_or_404(AIStory, id=story_id, user=request.user)

        # 幕の検証
        act = get_object_or_404(ActDetail, ai_story=story, act_number=act_number)

        # リクエストの検証
        serializer = EpisodeContentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # リクエストパラメータの取得
        title = serializer.validated_data['title']
        content = serializer.validated_data['content']

        # 新しいエピソード番号を取得
        next_episode_number = 1
        last_episode = EpisodeDetail.objects.filter(act=act).order_by('-episode_number').first()
        if last_episode:
            next_episode_number = last_episode.episode_number + 1

        # エピソード詳細の作成
        episode_detail = EpisodeDetail.objects.create(
            act=act,
            title=title,
            content=content,
            episode_number=next_episode_number,
            raw_content=content
        )

        # エピソード本文の作成
        episode_content = EpisodeContent.objects.create(
            episode=episode_detail,
            title=title,
            content=content,
            word_count=len(content),
            raw_content=content
        )

        # レスポンスを返す
        result_serializer = EpisodeContentSerializer(episode_content)
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)


class EpisodeContentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    エピソード本文詳細・更新・削除ビュー

    エピソード本文の取得、更新、削除を行う
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EpisodeContentSerializer

    def get_object(self):
        """指定されたエピソードの本文を取得"""
        story_id = self.kwargs.get('story_id')
        act_number = self.kwargs.get('act_number')
        episode_number = self.kwargs.get('episode_number')

        # ストーリーの検証
        story = get_object_or_404(AIStory, id=story_id, user=self.request.user)

        # 幕の検証
        act = get_object_or_404(ActDetail, ai_story=story, act_number=act_number)

        # エピソード詳細の検証
        episode = get_object_or_404(EpisodeDetail, act=act, episode_number=episode_number)

        # エピソード本文の取得（get_object_or_404の代わりにtry-except使用）
        try:
            return EpisodeContent.objects.get(episode=episode)
        except EpisodeContent.DoesNotExist:
            return None

    def retrieve(self, request, *args, **kwargs):
        """エピソード本文を取得（データがない場合は204を返す）"""
        instance = self.get_object()

        # エピソード本文が存在しない場合は204 No Contentを返す
        if instance is None:
            return Response(status=status.HTTP_204_NO_CONTENT)

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        """エピソード本文を更新"""
        instance = self.get_object()

        # エピソード本文が存在しない場合は204 No Contentを返す
        if instance is None:
            return Response(status=status.HTTP_204_NO_CONTENT)

        # 更新用シリアライザを使用
        serializer = EpisodeContentUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # 検証済みデータを取得
        content = serializer.validated_data['content']

        # タイトルが指定されていれば更新
        if 'title' in serializer.validated_data:
            instance.title = serializer.validated_data['title']

        # エピソードの情報を取得
        episode = instance.episode
        act = episode.act
        story_id = self.kwargs.get('story_id')
        act_number = self.kwargs.get('act_number')
        episode_number = self.kwargs.get('episode_number')

        # エピソードタイトルと本文からMarkdownを生成
        markdown_content = f"# 第{act_number}幕 {act.title}\n"
        markdown_content += f"## エピソード{episode_number}「{instance.title}」\n\n"
        markdown_content += f"{content}"

        # エピソード本文の更新
        instance.content = content
        instance.word_count = len(content)
        instance.raw_content = markdown_content
        instance.is_edited = True  # 編集済みフラグをTrueに設定
        instance.save()

        # レスポンスを返す
        result_serializer = EpisodeContentSerializer(instance)
        return Response(result_serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        """エピソード本文を削除"""
        instance = self.get_object()

        # エピソード本文が存在しない場合は204 No Contentを返す
        if instance is None:
            return Response(status=status.HTTP_204_NO_CONTENT)

        instance.delete()
        return Response({"success": True}, status=status.HTTP_200_OK)
