"""
基本設定関連のビュー
"""
import json
import logging
import traceback
import os
from datetime import datetime
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

# ロガーの設定
logger = logging.getLogger('novel_gen')

# 直接ファイルに書き込む関数
def write_to_debug_log(message):
    try:
        # Dockerコンテナ内のパスを使用
        log_dir = '/app/logs'
        os.makedirs(log_dir, exist_ok=True)
        log_file = os.path.join(log_dir, 'direct_debug.log')
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(f"[{timestamp}] {message}\n")
        print(f"Wrote to debug log: {message[:50]}...")
    except Exception as e:
        print(f"Error writing to debug log: {e}")

class BasicSettingCreateView(views.APIView):
    """
    基本設定作成ビュー

    基本設定作成用データを元に基本設定を生成します。
    クレジットを消費します。
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """基本設定を取得"""
        print("=== BasicSettingCreateView.get called ===")
        write_to_debug_log("=== BasicSettingCreateView.get called ===")
        write_to_debug_log(f"Request method: {request.method}")
        write_to_debug_log(f"Request headers: {dict(request.headers)}")

        logger.debug("=== BasicSettingCreateView.get called ===")
        logger.debug(f"Request method: {request.method}")
        logger.debug(f"Request headers: {dict(request.headers)}")

        story_id = self.kwargs.get('story_id')
        logger.debug(f"Story ID: {story_id}")
        write_to_debug_log(f"Story ID: {story_id}")

        try:
            # ユーザーの小説を取得
            story = get_object_or_404(AIStory, id=story_id, user=request.user)
            logger.debug(f"Found story: {story.id} - {story.title}")
            write_to_debug_log(f"Found story: {story.id} - {story.title}")

            # 基本設定を取得
            try:
                basic_setting = BasicSetting.objects.get(ai_story=story)
                logger.debug(f"Found basic setting: {basic_setting.id}")
                write_to_debug_log(f"Found basic setting: {basic_setting.id}")

                # シリアライズして返す
                serializer = BasicSettingSerializer(basic_setting)
                logger.debug("Returning basic setting")
                write_to_debug_log("Returning basic setting")
                return Response(serializer.data)
            except BasicSetting.DoesNotExist:
                logger.error(f"Basic setting not found for story: {story.id}")
                write_to_debug_log(f"Basic setting not found for story: {story.id}")
                return Response(
                    {'error': '基本設定が見つかりません'},
                    status=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            error_msg = f"Unhandled exception in get: {str(e)}"
            trace_msg = f"Traceback: {traceback.format_exc()}"
            logger.exception(error_msg)
            logger.error(trace_msg)
            write_to_debug_log(error_msg)
            write_to_debug_log(trace_msg)
            return Response(
                {'error': f'予期せぬエラーが発生しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        """基本設定を生成"""
        print("=== BasicSettingCreateView.post called ===")
        write_to_debug_log("=== BasicSettingCreateView.post called ===")
        write_to_debug_log(f"Request data: {json.dumps(request.data, ensure_ascii=False, indent=2)}")
        write_to_debug_log(f"Request method: {request.method}")
        write_to_debug_log(f"Request headers: {dict(request.headers)}")

        logger.debug("=== BasicSettingCreateView.post called ===")
        logger.debug(f"Request data: {json.dumps(request.data, ensure_ascii=False, indent=2)}")
        logger.debug(f"Request method: {request.method}")
        logger.debug(f"Request headers: {dict(request.headers)}")

        story_id = self.kwargs.get('story_id')
        logger.debug(f"Story ID: {story_id}")
        write_to_debug_log(f"Story ID: {story_id}")

        try:
            story = get_object_or_404(AIStory, id=story_id, user=request.user)
            logger.debug(f"Found story: {story.id} - {story.title}")
            write_to_debug_log(f"Found story: {story.id} - {story.title}")

            # リクエストの検証
            logger.debug("Validating request data")
            write_to_debug_log("Validating request data")
            serializer = BasicSettingRequestSerializer(data=request.data)

            if not serializer.is_valid():
                logger.error(f"Request validation failed: {serializer.errors}")
                write_to_debug_log(f"Request validation failed: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            logger.debug("Request validation successful")
            write_to_debug_log("Request validation successful")

            # 基本設定作成用データの取得
            basic_setting_data_id = serializer.validated_data.get('basic_setting_data_id')
            logger.debug(f"Basic setting data ID: {basic_setting_data_id}")
            write_to_debug_log(f"Basic setting data ID: {basic_setting_data_id}")

            if not basic_setting_data_id:
                logger.error("No basic_setting_data_id provided")
                write_to_debug_log("No basic_setting_data_id provided")
                return Response(
                    {'error': 'basic_setting_data_idは必須です'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                basic_setting_data = BasicSettingData.objects.get(
                    id=basic_setting_data_id,
                    ai_story=story
                )
                logger.debug(f"Found basic setting data: {basic_setting_data.id}")
                write_to_debug_log(f"Found basic setting data: {basic_setting_data.id}")
            except BasicSettingData.DoesNotExist:
                logger.error(f"Basic setting data not found: {basic_setting_data_id}")
                write_to_debug_log(f"Basic setting data not found: {basic_setting_data_id}")
                return Response(
                    {'error': '指定された基本設定作成用データが見つかりません'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # クレジットの確認と消費
            success, message = check_and_consume_credit(request.user, 'basic_setting')
            if not success:
                logger.error(f"Credit check failed: {message}")
                write_to_debug_log(f"Credit check failed: {message}")
                return Response({'error': message}, status=status.HTTP_402_PAYMENT_REQUIRED)

            logger.debug("Credit check successful")
            write_to_debug_log("Credit check successful")

            # APIリクエスト
            api = DifyNovelAPI()
            formatted_content = basic_setting_data.get_formatted_content()
            logger.debug(f"Formatted content: {formatted_content[:100]}...")
            write_to_debug_log(f"Formatted content: {formatted_content[:100]}...")

            # APIログの作成
            api_log = APIRequestLog.objects.create(
                user=request.user,
                request_type='basic_setting',
                ai_story=story,
                parameters={'basic_setting_data_id': basic_setting_data_id},
                credit_cost=1
            )
            logger.debug(f"Created API log: {api_log.id}")
            write_to_debug_log(f"Created API log: {api_log.id}")

            try:
                # 同期APIリクエスト
                logger.debug("Sending API request")
                write_to_debug_log("Sending API request")
                response = api.create_basic_setting(
                    basic_setting_data=formatted_content,
                    user_id=str(request.user.id),
                    blocking=True
                )
                logger.debug(f"API response received: {str(response)[:100]}...")
                write_to_debug_log(f"API response received: {str(response)[:100]}...")

                # レスポンスの検証
                if 'error' in response:
                    logger.error(f"API error: {response.get('error')}")
                    write_to_debug_log(f"API error: {response.get('error')}")
                    api_log.is_success = False
                    api_log.response = str(response)
                    api_log.save()
                    return Response(
                        {'error': '基本設定の生成に失敗しました', 'details': response},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

                content = response['answer']
                logger.debug(f"API content received: {content[:100]}...")
                write_to_debug_log(f"API content received: {content[:100]}...")

                # パースして保存（実際の実装では内容を解析して分割する）
                # この例では単純化のため、全文を各フィールドに入れています
                logger.debug("Creating basic setting")
                write_to_debug_log("Creating basic setting")
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
                logger.debug(f"Basic setting created: {basic_setting.id}")
                write_to_debug_log(f"Basic setting created: {basic_setting.id}")

                # APIログの更新
                api_log.is_success = True
                api_log.response = content
                api_log.save()
                logger.debug("API log updated")
                write_to_debug_log("API log updated")

                # レスポンスを返す
                result_serializer = BasicSettingSerializer(basic_setting)
                logger.debug("Returning successful response")
                write_to_debug_log("Returning successful response")
                return Response(result_serializer.data, status=status.HTTP_201_CREATED)

            except Exception as e:
                # エラーログ
                error_msg = f"Exception in API request: {str(e)}"
                trace_msg = f"Traceback: {traceback.format_exc()}"
                logger.exception(error_msg)
                logger.error(trace_msg)
                write_to_debug_log(error_msg)
                write_to_debug_log(trace_msg)
                api_log.is_success = False
                api_log.response = str(e)
                api_log.save()
                return Response(
                    {'error': '基本設定の生成に失敗しました', 'details': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except Exception as e:
            error_msg = f"Unhandled exception: {str(e)}"
            trace_msg = f"Traceback: {traceback.format_exc()}"
            logger.exception(error_msg)
            logger.error(trace_msg)
            write_to_debug_log(error_msg)
            write_to_debug_log(trace_msg)
            return Response(
                {'error': f'予期せぬエラーが発生しました: {str(e)}'},
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
