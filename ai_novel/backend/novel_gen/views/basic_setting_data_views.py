"""
基本設定作成用データ関連のビュー
"""
import json
import logging
from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.db import transaction

from ..models import AIStory, BasicSettingData
from ..serializers import (
    BasicSettingDataSerializer, BasicSettingDataCreateSerializer,
    BasicSettingDataRequestSerializer, DifyResponseSerializer
)
from ..dify_api import DifyNovelAPI
from ..utils import check_and_consume_credit

# ロガーの設定
logger = logging.getLogger('novel_gen')

class OptionsView(views.APIView):
    """
    基本設定作成用データのオプション取得ビュー

    基本設定作成用データの作成に必要なオプション（ジャンル、テーマなど）を取得します。
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """オプションを取得"""
        # 実際の実装ではデータベースやAPIから取得する
        options = {
            'genres': [
                {'id': 'fantasy', 'name': 'ファンタジー'},
                {'id': 'scifi', 'name': 'SF'},
                {'id': 'mystery', 'name': 'ミステリー'},
                {'id': 'romance', 'name': 'ロマンス'},
                {'id': 'horror', 'name': 'ホラー'},
                {'id': 'adventure', 'name': 'アドベンチャー'},
                {'id': 'historical', 'name': '歴史'},
                {'id': 'comedy', 'name': 'コメディ'},
                {'id': 'drama', 'name': 'ドラマ'},
                {'id': 'action', 'name': 'アクション'},
            ],
            'themes': [
                {'id': 'love', 'name': '愛'},
                {'id': 'friendship', 'name': '友情'},
                {'id': 'growth', 'name': '成長'},
                {'id': 'revenge', 'name': '復讐'},
                {'id': 'justice', 'name': '正義'},
                {'id': 'betrayal', 'name': '裏切り'},
                {'id': 'survival', 'name': '生存'},
                {'id': 'discovery', 'name': '発見'},
                {'id': 'sacrifice', 'name': '犠牲'},
                {'id': 'redemption', 'name': '贖罪'},
            ],
            'settings': [
                {'id': 'urban', 'name': '都市'},
                {'id': 'rural', 'name': '田舎'},
                {'id': 'space', 'name': '宇宙'},
                {'id': 'underwater', 'name': '海中'},
                {'id': 'desert', 'name': '砂漠'},
                {'id': 'forest', 'name': '森林'},
                {'id': 'mountain', 'name': '山岳'},
                {'id': 'island', 'name': '島'},
                {'id': 'school', 'name': '学校'},
                {'id': 'workplace', 'name': '職場'},
            ],
            'eras': [
                {'id': 'ancient', 'name': '古代'},
                {'id': 'medieval', 'name': '中世'},
                {'id': 'renaissance', 'name': 'ルネサンス'},
                {'id': 'industrial', 'name': '産業革命'},
                {'id': 'modern', 'name': '現代'},
                {'id': 'future', 'name': '未来'},
                {'id': 'postapocalyptic', 'name': 'ポストアポカリプス'},
                {'id': 'alternate', 'name': '異世界'},
                {'id': 'prehistoric', 'name': '先史時代'},
                {'id': 'victorian', 'name': 'ビクトリア朝'},
            ],
            'emotions': [
                {'id': 'happy', 'name': '幸せ'},
                {'id': 'sad', 'name': '悲しみ'},
                {'id': 'angry', 'name': '怒り'},
                {'id': 'fear', 'name': '恐怖'},
                {'id': 'surprise', 'name': '驚き'},
                {'id': 'disgust', 'name': '嫌悪'},
                {'id': 'anticipation', 'name': '期待'},
                {'id': 'trust', 'name': '信頼'},
                {'id': 'joy', 'name': '喜び'},
                {'id': 'sorrow', 'name': '悲哀'},
            ],
        }

        # シリアライザの期待する形式に合わせてキーを変換
        response_data = {
            'themes': options['themes'],
            'time_and_places': options['settings'],  # settingsをtime_and_placesに変換
            'world_settings': options['settings'],  # settingsをworld_settingsにも使用
            'plot_patterns': options['themes'],  # テーマをプロットパターンにも使用
            'love_expressions': options['emotions'],  # 感情表現を愛情表現にも使用
            'emotional_expressions': options['emotions'],
            'atmosphere': options['emotions'],  # 感情表現を雰囲気演出にも使用
            'sensual_expressions': options['emotions'],
            'mental_elements': options['emotions'],
            'social_elements': options['themes'],
            'past_mysteries': options['themes'],
        }
        return Response(response_data)
        return Response(options)


class PreviewBasicSettingDataView(views.APIView):
    """
    基本設定作成用データのプレビュー生成ビュー

    基本設定作成用データのプレビューを生成します。
    クレジットは消費しません。
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """プレビューを生成"""
        story_id = self.kwargs.get('story_id')
        story = get_object_or_404(AIStory, id=story_id, user=request.user)

        # リクエストの検証
        serializer = BasicSettingDataRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # プレビュー生成（実際の実装ではAPIを呼び出す）
        # この例では単純化のため、入力をそのまま返しています
        preview = {
            'theme': serializer.validated_data.get('theme', ''),
            'time_and_place': serializer.validated_data.get('time_and_place', ''),
            'world_setting': serializer.validated_data.get('world_setting', ''),
            'plot_pattern': serializer.validated_data.get('plot_pattern', ''),
            'emotional_expressions': serializer.validated_data.get('emotional_expressions', []),
            'love_expressions': serializer.validated_data.get('love_expressions', []),
            'atmosphere': serializer.validated_data.get('atmosphere', []),
            'sensual_expressions': serializer.validated_data.get('sensual_expressions', []),
            'mental_elements': serializer.validated_data.get('mental_elements', []),
            'social_elements': serializer.validated_data.get('social_elements', []),
            'past_mysteries': serializer.validated_data.get('past_mysteries', []),
            'raw_content': json.dumps(serializer.validated_data)
        }

        return Response(preview)


class BasicSettingDataCreateView(views.APIView):
    """
    基本設定作成用データ作成ビュー

    基本設定作成用データを作成します。
    クレジットは消費しません。
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        """基本設定作成用データを作成"""
        logger.debug("BasicSettingDataCreateView.post called")
        logger.debug(f"Request data: {json.dumps(request.data, ensure_ascii=False, indent=2)}")
        logger.debug(f"Request method: {request.method}")
        logger.debug(f"Request headers: {dict(request.headers)}")

        story_id = self.kwargs.get('story_id')
        logger.debug(f"Story ID: {story_id}")

        try:
            story = get_object_or_404(AIStory, id=story_id, user=request.user)
            logger.debug(f"Found story: {story.id} - {story.title}")

            # リクエストの検証
            logger.debug("Validating request data")
            serializer = BasicSettingDataRequestSerializer(data=request.data)

            if not serializer.is_valid():
                logger.error(f"Request validation failed: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            logger.debug("Request validation successful")

            # 基本設定作成用データの作成
            logger.debug("Creating basic setting data")
            json_content = serializer.validated_data
            logger.debug(f"JSON content: {json.dumps(json_content, ensure_ascii=False, indent=2)}")

            # スネークケースのフィールド名を使用して直接マッピング
            basic_setting_data = BasicSettingData.objects.create(
                ai_story=story,
                theme=json_content.get('theme', ''),
                time_and_place=json_content.get('time_and_place', ''),
                world_setting=json_content.get('world_setting', ''),
                plot_pattern=json_content.get('plot_pattern', ''),
                emotional_expressions=json_content.get('emotional_expressions', []),
                love_expressions=json_content.get('love_expressions', []),
                atmosphere=json_content.get('atmosphere', []),
                sensual_expressions=json_content.get('sensual_expressions', []),
                mental_elements=json_content.get('mental_elements', []),
                social_elements=json_content.get('social_elements', []),
                past_mysteries=json_content.get('past_mysteries', []),
                raw_content=json_content
            )
            logger.debug(f"Basic setting data created: {basic_setting_data.id}")

            # レスポンスを返す
            result_serializer = BasicSettingDataSerializer(basic_setting_data)
            logger.debug("Returning successful response")
            return Response(result_serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.exception(f"Unhandled exception: {str(e)}")
            return Response(
                {'error': f'予期せぬエラーが発生しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_create(self, serializer):
        """基本設定作成用データを保存"""
        story_id = self.kwargs.get('story_id')
        story = get_object_or_404(AIStory, id=story_id, user=self.request.user)
        json_content = self.request.data
        serializer.save(
            ai_story=story,
            raw_content=json_content
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
