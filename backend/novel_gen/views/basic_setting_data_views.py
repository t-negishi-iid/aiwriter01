import json
import logging
from django.db import transaction
from rest_framework import views, status
from rest_framework.response import Response
from novel_gen.models import AIStory, BasicSettingData
from novel_gen.serializers import BasicSettingDataCreateSerializer
from novel_gen.dify_api import DifyNovelAPI

# ロガーの設定
logger = logging.getLogger('novel_gen')

class BasicSettingDataCreateView(views.APIView):
    """基本設定作成用データ作成ビュー"""

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        """基本設定作成用データを作成"""
        logger.debug("BasicSettingDataCreateView.post called")
        logger.debug(f"Request data: {json.dumps(request.data, ensure_ascii=False, indent=2)}")

        # リクエストデータの詳細なログ
        for key, value in request.data.items():
            logger.debug(f"Parameter '{key}': {type(value)} = {value}")

        try:
            # ストーリーIDの取得
            story_id = kwargs.get('story_id')
            logger.debug(f"Story ID: {story_id}")

            # ストーリーの存在確認
            try:
                story = AIStory.objects.get(id=story_id, user=request.user)
                logger.debug(f"Found story: {story.id} - {story.title}")
            except AIStory.DoesNotExist:
                logger.error(f"Story not found: {story_id}")
                return Response(
                    {'error': 'ストーリーが見つかりません'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # リクエストデータのコピー
            data = request.data.copy()
            logger.debug(f"Copied request data: {json.dumps(data, ensure_ascii=False, indent=2)}")

            # raw_contentフィールドの処理
            if 'raw_content' in data:
                logger.debug(f"Raw content found in request: {type(data['raw_content'])}")
                # JSONオブジェクトの場合は文字列に変換
                if isinstance(data['raw_content'], dict):
                    data['raw_content'] = json.dumps(data['raw_content'], ensure_ascii=False)
                    logger.debug("Converted raw_content dict to JSON string")
            else:
                logger.debug("No raw_content in request, creating from data")
                # raw_contentがない場合は、リクエストデータ全体をJSONとして保存
                data['raw_content'] = json.dumps(request.data, ensure_ascii=False)

            # ストーリーIDの設定
            data['ai_story'] = story.id
            logger.debug(f"Final data for serializer: {json.dumps(data, ensure_ascii=False, indent=2)}")

            # シリアライザの作成と検証
            serializer = BasicSettingDataCreateSerializer(data=data)
            if serializer.is_valid():
                logger.debug("Serializer is valid")
                # データの保存
                serializer.save()
                logger.debug(f"BasicSettingData created: {serializer.data}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                logger.error(f"Serializer validation failed: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception(f"Exception in BasicSettingDataCreateView.post: {str(e)}")
            return Response(
                {'error': f'基本設定作成用データの作成に失敗しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
