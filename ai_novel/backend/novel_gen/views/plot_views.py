"""
あらすじ詳細関連のビュー
"""
from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.db import transaction

from ..models import AIStory, BasicSetting, CharacterDetail, ActDetail, APIRequestLog
from ..serializers import (
    ActDetailCreateSerializer, ActDetailSerializer,
    PlotDetailRequestSerializer
)
from ..dify_api import DifyNovelAPI
from ..utils import check_and_consume_credit


class ActDetailListView(generics.ListCreateAPIView):
    """
    幕詳細一覧・作成ビュー

    指定された小説の幕詳細一覧を取得、または新規幕詳細を作成します。
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ActDetailSerializer

    def get_queryset(self):
        """指定された小説の幕詳細一覧を取得"""
        story_id = self.kwargs.get('story_id')
        return ActDetail.objects.filter(
            ai_story_id=story_id,
            ai_story__user=self.request.user
        ).order_by('act_number')

    def perform_create(self, serializer):
        """幕詳細作成時に小説を設定"""
        story_id = self.kwargs.get('story_id')
        story = get_object_or_404(AIStory, id=story_id, user=self.request.user)
        serializer.save(ai_story=story)


class ActDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    幕詳細・更新・削除ビュー

    指定された小説の幕詳細を取得、更新、または削除します。
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ActDetailSerializer
    lookup_url_kwarg = 'pk'

    def get_queryset(self):
        """指定された小説の幕詳細を取得"""
        story_id = self.kwargs.get('story_id')
        return ActDetail.objects.filter(
            ai_story_id=story_id,
            ai_story__user=self.request.user
        )


class CreatePlotDetailView(views.APIView):
    """
    あらすじ詳細生成ビュー

    基本設定とキャラクター詳細を元にあらすじ詳細（3幕分）を生成します。
    クレジットを消費します。
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        """あらすじ詳細を生成"""
        story_id = self.kwargs.get('story_id')
        story = get_object_or_404(AIStory, id=story_id, user=request.user)

        # リクエストの検証
        serializer = PlotDetailRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

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

        # クレジットの確認と消費
        success, message = check_and_consume_credit(request.user, 'plot_detail')
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

        # APIログの作成
        api_log = APIRequestLog.objects.create(
            user=request.user,
            request_type='plot_detail',
            ai_story=story,
            parameters={},
            credit_cost=2
        )

        try:
            # 同期APIリクエスト
            response = api.create_plot_detail(
                basic_setting=basic_setting.raw_content,
                character_details=character_details_data,
                user_id=str(request.user.id),
                blocking=True
            )

            # レスポンスの検証
            if 'error' in response:
                api_log.is_success = False
                api_log.response = str(response)
                api_log.save()
                return Response(
                    {'error': 'あらすじ詳細の生成に失敗しました', 'details': response},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            content = response['answer']

            # パースして3幕に分割（実際の実装では内容を解析して分割する）
            # この例では単純化のため、同じ内容を3幕に分けています
            act_details = []
            for act_number in range(1, 4):
                act_title = f"第{act_number}幕"
                act_detail = ActDetail.objects.create(
                    ai_story=story,
                    act_number=act_number,
                    title=act_title,
                    content=content,
                    raw_content=content
                )
                act_details.append(act_detail)

            # APIログの更新
            api_log.is_success = True
            api_log.response = content
            api_log.save()

            # レスポンスを返す
            result_serializer = ActDetailSerializer(act_details, many=True)
            return Response(result_serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            # エラーログ
            api_log.is_success = False
            api_log.response = str(e)
            api_log.save()
            return Response(
                {'error': 'あらすじ詳細の生成に失敗しました', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
