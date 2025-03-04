"""
基本設定作成用データ関連のビュー
"""
from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction

from ..models import AIStory, BasicSettingData
from ..serializers import (
    BasicSettingDataCreateSerializer, BasicSettingDataSerializer,
    BasicSettingDataRequestSerializer, BasicSettingDataPreviewSerializer,
    OptionsResponseSerializer
)
from ..utils import get_basic_setting_options, format_basic_setting_data


class OptionsView(views.APIView):
    """
    基本設定作成用データの選択肢を取得するビュー
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """選択肢を取得"""
        options = get_basic_setting_options()
        serializer = OptionsResponseSerializer(data=options)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)


class BasicSettingDataCreateView(generics.CreateAPIView):
    """
    基本設定作成用データ作成ビュー

    指定された小説の基本設定作成用データを作成します。
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BasicSettingDataCreateSerializer

    def perform_create(self, serializer):
        """基本設定作成用データ作成時に小説を設定"""
        story_id = self.kwargs.get('story_id')
        story = get_object_or_404(AIStory, id=story_id, user=self.request.user)

        # リクエストデータをJSONとして保存
        original_data = self.request.data.copy()

        # スネークケースからキャメルケースへの変換
        field_mapping = {
            'theme': 'theme',
            'time_and_place': 'timeAndPlace',
            'world_setting': 'worldSetting',
            'plot_pattern': 'plotPattern',
            'love_expressions': 'loveExpressions',
            'emotional_expressions': 'emotionalExpressions',
            'atmosphere': 'atmosphere',
            'sensual_expressions': 'sensualExpressions',
            'mental_elements': 'mentalElements',
            'social_elements': 'socialElements',
            'past_mysteries': 'pastMysteries'
        }

        # JSONコンテンツを作成
        json_content = {}
        for snake_case, camel_case in field_mapping.items():
            if camel_case in original_data:
                json_content[camel_case] = original_data[camel_case]

        serializer.save(
            ai_story=story,
            json_content=json_content
        )


class BasicSettingDataDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    基本設定作成用データ詳細・更新・削除ビュー

    指定された小説の基本設定作成用データを取得、更新、または削除します。
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BasicSettingDataSerializer
    lookup_url_kwarg = 'pk'

    def get_queryset(self):
        """指定された小説の基本設定作成用データを取得"""
        story_id = self.kwargs.get('story_id')
        return BasicSettingData.objects.filter(
            ai_story_id=story_id,
            ai_story__user=self.request.user
        )


class PreviewBasicSettingDataView(views.APIView):
    """
    基本設定作成用データプレビュービュー

    基本設定作成用データのプレビューを生成します。
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """プレビューを生成"""
        serializer = BasicSettingDataRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # データをフォーマット
        formatted_text = format_basic_setting_data(serializer.validated_data)

        # レスポンスを返す
        response_serializer = BasicSettingDataPreviewSerializer(
            data={'preview': formatted_text}
        )
        response_serializer.is_valid(raise_exception=True)
        return Response(response_serializer.validated_data)
