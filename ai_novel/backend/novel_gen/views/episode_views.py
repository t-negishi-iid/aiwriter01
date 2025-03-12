"""
エピソード詳細関連のビュー
"""
from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.db import transaction

from ..models import (
    AIStory, BasicSetting, CharacterDetail, ActDetail,
    EpisodeDetail, APIRequestLog
)
from ..serializers import (
    EpisodeDetailCreateSerializer, EpisodeDetailSerializer,
    EpisodeDetailRequestSerializer
)
from ..dify_api import DifyNovelAPI
from ..utils import check_and_consume_credit


class StoryEpisodesListView(generics.ListAPIView):
    """
    ストーリーのエピソード一覧ビュー

    指定されたストーリーに関連するすべてのエピソードを取得します。
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EpisodeDetailSerializer

    def get_queryset(self):
        """指定されたストーリーのすべてのエピソードを取得"""
        story_id = self.kwargs.get('story_id')
        return EpisodeDetail.objects.filter(
            act__ai_story_id=story_id,
            act__ai_story__user=self.request.user
        ).order_by('act__act_number', 'episode_number')


class EpisodeDetailListView(generics.ListCreateAPIView):
    """
    エピソード詳細一覧・作成ビュー

    指定された幕のエピソード詳細一覧を取得、または新規エピソード詳細を作成します。
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EpisodeDetailSerializer

    def get_queryset(self):
        """指定された幕のエピソード詳細一覧を取得"""
        act_id = self.kwargs.get('act_id')
        return EpisodeDetail.objects.filter(
            act_id=act_id,
            act__ai_story__user=self.request.user
        ).order_by('episode_number')

    def perform_create(self, serializer):
        """エピソード詳細作成時に幕を設定"""
        act_id = self.kwargs.get('act_id')
        act = get_object_or_404(
            ActDetail,
            id=act_id,
            ai_story__user=self.request.user
        )
        serializer.save(act=act)


class EpisodeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    エピソード詳細・更新・削除ビュー

    指定された幕のエピソード詳細を取得、更新、または削除します。
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EpisodeDetailSerializer
    lookup_url_kwarg = 'pk'

    def get_queryset(self):
        """指定された幕のエピソード詳細を取得"""
        act_id = self.kwargs.get('act_id')
        return EpisodeDetail.objects.filter(
            act_id=act_id,
            act__ai_story__user=self.request.user
        )


class CreateEpisodeDetailsView(views.APIView):
    """
    エピソード詳細生成ビュー

    基本設定、キャラクター詳細、あらすじ詳細を元にエピソード詳細を生成します。
    クレジットを消費します。
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        """エピソード詳細を生成"""
        story_id = self.kwargs.get('story_id')
        story = get_object_or_404(AIStory, id=story_id, user=request.user)

        # リクエストの検証
        serializer = EpisodeDetailRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # リクエストパラメータの取得
        act_id = serializer.validated_data['act_id']
        episode_count = serializer.validated_data['episode_count']

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

        # 指定された幕の取得
        try:
            target_act = ActDetail.objects.get(id=act_id, ai_story=story)
        except ActDetail.DoesNotExist:
            return Response(
                {'error': '指定された幕が存在しません。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # クレジットの確認と消費
        success, message = check_and_consume_credit(request.user, 'episode_detail')
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

        # 対象幕データの準備
        target_act_data = {
            'act_number': target_act.act_number,
            'title': target_act.title,
            'content': target_act.content
        }

        # APIログの作成
        api_log = APIRequestLog.objects.create(
            user=request.user,
            request_type='episode_detail',
            ai_story=story,
            parameters={
                'act_id': act_id,
                'episode_count': episode_count
            },
            credit_cost=3
        )

        try:
            # 同期APIリクエスト
            response = api.create_episode_details(
                basic_setting=basic_setting.raw_content,
                character_details=character_details_data,
                plot_details=all_acts_data,
                target_plot=target_act_data,
                episode_count=episode_count,
                user_id=str(request.user.id),
                blocking=True
            )

            # レスポンスの検証
            if 'error' in response:
                api_log.is_success = False
                api_log.response = str(response)
                api_log.save()
                return Response(
                    {'error': 'エピソード詳細の生成に失敗しました', 'details': response},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            content = response['answer']

            # パースして複数のエピソードに分割（実際の実装では内容を解析して分割する）
            # この例では単純化のため、同じ内容を指定された数のエピソードに分けています
            episode_details = []
            for episode_number in range(1, episode_count + 1):
                episode_title = f"エピソード{episode_number}"
                episode_detail = EpisodeDetail.objects.create(
                    act=target_act,
                    episode_number=episode_number,
                    title=episode_title,
                    content=content,
                    raw_content=content
                )
                episode_details.append(episode_detail)

            # APIログの更新
            api_log.is_success = True
            api_log.response = content
            api_log.save()

            # レスポンスを返す
            result_serializer = EpisodeDetailSerializer(episode_details, many=True)
            return Response(result_serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            # エラーログ
            api_log.is_success = False
            api_log.response = str(e)
            api_log.save()
            return Response(
                {'error': 'エピソード詳細の生成に失敗しました', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
