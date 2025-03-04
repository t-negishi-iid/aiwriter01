"""
基本設定関連のビュー
"""
from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.db import transaction

from ..models import AIStory, BasicSettingData, BasicSetting, APIRequestLog
from ..serializers import (
    BasicSettingCreateSerializer, BasicSettingSerializer,
    BasicSettingRequestSerializer, DifyResponseSerializer
)
from ..dify_api import DifyNovelAPI
from ..utils import check_and_consume_credit


class BasicSettingCreateView(views.APIView):
    """
    基本設定作成ビュー

    基本設定作成用データを元に基本設定を生成します。
    クレジットを消費します。
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        """基本設定を生成"""
        story_id = self.kwargs.get('story_id')
        story = get_object_or_404(AIStory, id=story_id, user=request.user)

        # リクエストの検証
        serializer = BasicSettingRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # 基本設定作成用データの取得
        basic_setting_data_id = serializer.validated_data['basic_setting_data_id']
        basic_setting_data = get_object_or_404(
            BasicSettingData,
            id=basic_setting_data_id,
            ai_story=story
        )

        # クレジットの確認と消費
        success, message = check_and_consume_credit(request.user, 'basic_setting')
        if not success:
            return Response({'error': message}, status=status.HTTP_402_PAYMENT_REQUIRED)

        # APIリクエスト
        api = DifyNovelAPI()
        formatted_content = basic_setting_data.get_formatted_content()

        # APIログの作成
        api_log = APIRequestLog.objects.create(
            user=request.user,
            request_type='basic_setting',
            ai_story=story,
            parameters={'basic_setting_data_id': basic_setting_data_id},
            credit_cost=1
        )

        try:
            # 同期APIリクエスト
            response = api.create_basic_setting(
                basic_setting_data=formatted_content,
                user_id=str(request.user.id),
                blocking=True
            )

            # レスポンスの検証
            if 'error' in response:
                api_log.is_success = False
                api_log.response = str(response)
                api_log.save()
                return Response(
                    {'error': '基本設定の生成に失敗しました', 'details': response},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            content = response['answer']

            # パースして保存（実際の実装では内容を解析して分割する）
            # この例では単純化のため、全文を各フィールドに入れています
            basic_setting = BasicSetting.objects.create(
                ai_story=story,
                story_setting=content,
                characters=content,
                plot_overview=content,
                act1_overview=content,
                act2_overview=content,
                act3_overview=content,
                raw_content=content
            )

            # APIログの更新
            api_log.is_success = True
            api_log.response = content
            api_log.save()

            # レスポンスを返す
            result_serializer = BasicSettingSerializer(basic_setting)
            return Response(result_serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            # エラーログ
            api_log.is_success = False
            api_log.response = str(e)
            api_log.save()
            return Response(
                {'error': '基本設定の生成に失敗しました', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BasicSettingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    基本設定詳細・更新・削除ビュー

    指定された小説の基本設定を取得、更新、または削除します。
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BasicSettingSerializer
    lookup_url_kwarg = 'pk'

    def get_queryset(self):
        """指定された小説の基本設定を取得"""
        story_id = self.kwargs.get('story_id')
        return BasicSetting.objects.filter(
            ai_story_id=story_id,
            ai_story__user=self.request.user
        )
