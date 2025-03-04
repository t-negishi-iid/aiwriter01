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


class EpisodeContentView(generics.RetrieveUpdateDestroyAPIView):
    """
    エピソード本文詳細・更新・削除ビュー

    指定されたエピソードの本文を取得、更新、または削除します。
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EpisodeContentSerializer
    lookup_field = 'episode_id'

    def get_object(self):
        """指定されたエピソードの本文を取得"""
        episode_id = self.kwargs.get('episode_id')
        episode = get_object_or_404(
            EpisodeDetail,
            id=episode_id,
            act__ai_story__user=self.request.user
        )

        # コンテンツが存在しない場合はNoneを返す
        try:
            return EpisodeContent.objects.get(episode=episode)
        except EpisodeContent.DoesNotExist:
            return None


class CreateEpisodeContentView(views.APIView):
    """
    エピソード本文生成ビュー

    基本設定、キャラクター詳細、あらすじ詳細、エピソード詳細を元にエピソード本文を生成します。
    クレジットを消費します。
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        """エピソード本文を生成"""
        story_id = self.kwargs.get('story_id')
        story = get_object_or_404(AIStory, id=story_id, user=request.user)

        # リクエストの検証
        serializer = EpisodeContentRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # リクエストパラメータの取得
        episode_id = serializer.validated_data['episode_id']
        word_count = serializer.validated_data['word_count']

        # 基本設定の取得
        try:
            basic_setting = BasicSetting.objects.get(ai_story=story)
        except BasicSetting.DoesNotExist:
            return Response(
                {'error': '基本設定が存在しません。先に基本設定を作成してください。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # キャラクター詳細の取得
        character_details = CharacterDetail.objects.filter(ai_story=story)
        if not character_details.exists():
            return Response(
                {'error': 'キャラクター詳細が存在しません。先にキャラクター詳細を作成してください。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # あらすじ詳細（幕）の取得
        all_acts = ActDetail.objects.filter(ai_story=story).order_by('act_number')
        if not all_acts.exists():
            return Response(
                {'error': 'あらすじ詳細が存在しません。先にあらすじ詳細を作成してください。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 指定されたエピソードの取得
        try:
            episode = EpisodeDetail.objects.get(id=episode_id)
            if episode.act.ai_story_id != story.id:
                return Response(
                    {'error': '指定されたエピソードはこの小説のものではありません。'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except EpisodeDetail.DoesNotExist:
            return Response(
                {'error': '指定されたエピソードが存在しません。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 既にコンテンツがあるかチェック
        if EpisodeContent.objects.filter(episode=episode).exists():
            return Response(
                {'error': '既にこのエピソードのコンテンツが存在します。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # クレジットの確認と消費
        success, message = check_and_consume_credit(request.user, 'episode_content')
        if not success:
            return Response({'error': message}, status=status.HTTP_402_PAYMENT_REQUIRED)

        # APIリクエスト
        api = DifyNovelAPI()

        # キャラクター詳細データの準備
        character_details_data = [
            {
                'name': char.name,
                'role': char.role,
                'appearance': char.appearance,
                'personality': char.personality,
                'background': char.background,
                'motivation': char.motivation,
                'relationship': char.relationship,
                'development': char.development
            }
            for char in character_details
        ]

        # 幕詳細データの準備
        all_acts_data = [
            {
                'act_number': act.act_number,
                'title': act.title,
                'content': act.content
            }
            for act in all_acts
        ]

        # APIログの作成
        api_log = APIRequestLog.objects.create(
            user=request.user,
            request_type='episode_content',
            ai_story=story,
            parameters={
                'episode_id': episode_id,
                'word_count': word_count
            },
            credit_cost=4
        )

        try:
            # 同期APIリクエスト
            response = api.create_episode_content(
                basic_setting=basic_setting.raw_content,
                character_details=character_details_data,
                plot_details=all_acts_data,
                episode_detail=episode.raw_content,
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

            content = response['answer']

            # エピソード本文を保存
            episode_content = EpisodeContent.objects.create(
                episode=episode,
                title=episode.title,  # 初期値としてエピソード詳細のタイトルを使用
                content=content,
                word_count=len(content),  # 簡易的な文字数カウント
                raw_content=content
            )

            # APIログの更新
            api_log.is_success = True
            api_log.response = content
            api_log.save()

            # レスポンスを返す
            result_serializer = EpisodeContentSerializer(episode_content)
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
