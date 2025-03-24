"""
エピソード本文関連のビュー
"""
from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.db import transaction

from ..models import (
    AIStory, BasicSetting, CharacterDetail, ActDetail,
    EpisodeDetail, EpisodeContent, APIRequestLog
)
from ..serializers import (
    EpisodeContentCreateSerializer, EpisodeContentSerializer,
    EpisodeContentRequestSerializer
)
from ..dify_api import DifyNovelAPI
from ..utils import check_and_consume_credit


class CreateEpisodeContentView(views.APIView):
    """
    エピソード本文生成ビュー

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
                'episode_id': episode.id,
                'word_count': word_count
            },
            credit_cost=4
        )

        # APIを呼び出す
        dify_api = DifyNovelAPI(timeout=1200)  # タイムアウトを10分に設定
        try:
            response = dify_api.create_episode_content(
                basic_setting=basic_setting.raw_content,
                all_characters_list=all_characters_list,
                all_episode_details_list=all_episode_details_list,
                target_episode_detail=episode.raw_content,
                act_number=act_number,
                episode_number=episode_number,
                word_count=word_count,
                user_id=str(request.user.id),
                blocking=True
            )

            # レスポンスの検証
            if 'error' in response:
                api_log.is_success = False
                api_log.response = str(response)
                api_log.save()
                return Response(
                    {'error': 'エピソード本文の生成に失敗しました', 'details': response},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )


            content = response['result']

            # 取得したcontentからエピソードタイトルと本文を取得
            episode_title = episode.title  # デフォルトはエピソード詳細のタイトル
            episode_content = content

            # タイトルのパターンを検出 (## エピソード数「タイトル」 の形式)
            import re
            title_match = re.search(r'##\s+エピソード\d+「([^」]+)」', content)
            if title_match:
                # タイトルが見つかった場合
                episode_title = title_match.group(1)

                # タイトル行を除いた本文を抽出
                content_lines = content.split('\n')
                for i, line in enumerate(content_lines):
                    if '##' in line and 'エピソード' in line:
                        # タイトル行の次から本文が始まる
                        episode_content = '\n'.join(content_lines[i+1:]).strip()
                        break

            # エピソード本文を保存
            episode_content_obj = EpisodeContent.objects.create(
                episode=episode,
                title=episode_title,  # パースしたタイトルを使用
                content=episode_content,  # パースした本文を使用
                word_count=len(episode_content),  # 簡易的な文字数カウント
                raw_content=content  # 元の内容をそのまま保存
            )

            # APIログの更新
            api_log.is_success = True
            api_log.response = content
            api_log.save()

            # クレジットの確認と消費
            success, message = check_and_consume_credit(request.user, 'episode_content')
            if not success:
                return Response({'error': message}, status=status.HTTP_402_PAYMENT_REQUIRED)

            # レスポンスを返す
            result_serializer = EpisodeContentSerializer(episode_content_obj)
            return Response(result_serializer.data, status=status.HTTP_201_CREATED)

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

        # エピソード本文の取得
        return get_object_or_404(EpisodeContent, episode=episode)

    def update(self, request, *args, **kwargs):
        """エピソード本文を更新"""
        instance = self.get_object()

        # リクエストの検証
        serializer = EpisodeContentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # リクエストパラメータの取得
        content = serializer.validated_data['content']
        raw_content = serializer.validated_data.get('raw_content', content)
        
        # オプショナルパラメータ（titleは必須ではない）
        if 'title' in request.data:
            instance.title = request.data['title']

        # エピソード本文の更新
        instance.content = content
        instance.word_count = len(content)
        instance.raw_content = raw_content
        instance.save()

        # レスポンスを返す
        result_serializer = EpisodeContentSerializer(instance)
        return Response(result_serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        """エピソード本文を削除"""
        instance = self.get_object()
        instance.delete()
        return Response({"success": True}, status=status.HTTP_200_OK)
