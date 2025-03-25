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
from django.http import Http404, StreamingHttpResponse
from django.db import transaction

from ..models import AIStory, BasicSettingData, BasicSetting, APIRequestLog
from ..serializers import (
    BasicSettingCreateSerializer, BasicSettingSerializer,
    BasicSettingRequestSerializer, DifyResponseSerializer
)
from ..dify_api import DifyNovelAPI
from ..dify_streaming_api import DifyStreamingAPI, get_markdown_from_last_chunk
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

    def _parse_basic_setting_content(self, content: str) -> dict:
        """
        Dify APIから返された基本設定コンテンツをパースする

        Args:
            content: APIレスポンスのMarkdownコンテンツ

        Returns:
            dict: パースされた各セクションのデータ
        """
        try:
            # 初期化
            result = {
                'story_setting': '',
                'characters': '',
                'plot_overview': '',
                'act1_overview': '',
                'act2_overview': '',
                'act3_overview': '',
            }

            # 文字列を行に分割
            lines = content.split('\n')

            # セクションの開始と終了位置を特定
            current_section = None
            sections = {}
            section_start = 0

            for i, line in enumerate(lines):
                # 主要セクションを検出
                if line.startswith('## 作品世界と舞台設定') or line.startswith('## 時代と場所'):
                    if current_section:
                        sections[current_section] = (section_start, i)
                    current_section = 'story_setting'
                    section_start = i
                elif line.startswith('## 主な登場人物'):
                    if current_section:
                        sections[current_section] = (section_start, i)
                    current_section = 'characters'
                    section_start = i
                elif line.startswith('## 主な固有名詞') or line.startswith('## 固有名詞'):
                    # 登場人物セクションを終了し、固有名詞セクションは別途処理
                    if current_section and current_section == 'characters':
                        sections[current_section] = (section_start, i)
                    # 固有名詞セクションは現在は無視
                    current_section = None
                elif line.startswith('## あらすじ'):
                    if current_section:
                        sections[current_section] = (section_start, i)
                    current_section = 'plot_overview'
                    section_start = i
                elif line.startswith('### 第1幕'):
                    if current_section != 'act1_overview':
                        if current_section:
                            sections[current_section] = (section_start, i)
                        current_section = 'act1_overview'
                        section_start = i
                elif line.startswith('### 第2幕'):
                    if current_section != 'act2_overview':
                        if current_section:
                            sections[current_section] = (section_start, i)
                        current_section = 'act2_overview'
                        section_start = i
                elif line.startswith('### 第3幕'):
                    if current_section != 'act3_overview':
                        if current_section:
                            sections[current_section] = (section_start, i)
                        current_section = 'act3_overview'
                        section_start = i

            # 最後のセクションを追加
            if current_section:
                sections[current_section] = (section_start, len(lines))

            # 各セクションの内容を抽出
            for section, (start, end) in sections.items():
                if section in result:
                    result[section] = '\n'.join(lines[start:end])

            # あらすじ全体が見つからない場合は、各幕の情報を総合的にあらすじとして使用
            if not result['plot_overview'] and (result['act1_overview'] or result['act2_overview'] or result['act3_overview']):
                combined_acts = []
                if result['act1_overview']:
                    combined_acts.append(result['act1_overview'])
                if result['act2_overview']:
                    combined_acts.append(result['act2_overview'])
                if result['act3_overview']:
                    combined_acts.append(result['act3_overview'])
                result['plot_overview'] = '\n\n'.join(combined_acts)

            return result
        except Exception as e:
            logger.error(f"Error parsing basic setting content: {str(e)}")
            write_to_debug_log(f"Error parsing basic setting content: {str(e)}")
            # エラー時はコンテンツ全体を各フィールドに設定
            return {
                'story_setting': content,
                'characters': content,
                'plot_overview': content,
                'act1_overview': content,
                'act2_overview': content,
                'act3_overview': content,
            }

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

            # 既存の基本設定を確認し、存在する場合は削除
            # 1つの小説には1つの基本設定のみ許可する
            try:
                existing_settings = BasicSetting.objects.filter(ai_story=story)
                if existing_settings.exists():
                    logger.debug(f"Deleting {existing_settings.count()} existing basic settings for story {story.id}")
                    write_to_debug_log(f"Deleting {existing_settings.count()} existing basic settings for story {story.id}")
                    existing_settings.delete()
            except Exception as e:
                logger.error(f"Error deleting existing basic settings: {str(e)}")
                write_to_debug_log(f"Error deleting existing basic settings: {str(e)}")
                # エラーは無視して続行

            # クレジットの確認と消費
            success, message = check_and_consume_credit(request.user, 'basic_setting')
            if not success:
                logger.error(f"Credit check failed: {message}")
                write_to_debug_log(f"Credit check failed: {message}")
                return Response({'error': message}, status=status.HTTP_402_PAYMENT_REQUIRED)

            logger.debug("Credit check successful")
            write_to_debug_log("Credit check successful")

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
                # ストリーミングAPIリクエスト
                logger.debug("Sending streaming API request")
                write_to_debug_log("Sending streaming API request")
                
                # DifyStreamingAPIを初期化
                api = DifyStreamingAPI()
                formatted_content = basic_setting_data.get_formatted_content()
                
                # 最後のチャンクを保持する変数
                last_chunk = None
                
                # ストリーミングAPIリクエストを実行し、すべてのチャンクを内部で処理
                for chunk in api.create_basic_setting_stream(
                    basic_setting_data=formatted_content,
                    user_id=str(request.user.id)
                ):
                    # 最後のチャンクを更新
                    last_chunk = chunk
                    # ログにチャンク情報を記録（デバッグ用）
                    logger.debug(f"Received chunk: {json.dumps(chunk, ensure_ascii=False)[:100]}...")
                
                # 最後のチャンクからMarkdownコンテンツを抽出
                if last_chunk:
                    try:
                        markdown_content = get_markdown_from_last_chunk(last_chunk)
                        
                        # パースしてBasicSettingを作成
                        parsed_content = self._parse_basic_setting_content(markdown_content)
                        
                        # BasicSettingを保存
                        basic_setting = BasicSetting.objects.create(
                            ai_story=story,
                            setting_data=basic_setting_data,
                            story_setting=parsed_content.get('story_setting', ''),
                            characters=parsed_content.get('characters', ''),
                            plot_overview=parsed_content.get('plot_overview', ''),
                            act1_overview=parsed_content.get('act1_overview', ''),
                            act2_overview=parsed_content.get('act2_overview', ''),
                            act3_overview=parsed_content.get('act3_overview', ''),
                            raw_content=markdown_content
                        )
                        
                        # APIログを更新
                        api_log.is_success = True
                        api_log.response = markdown_content
                        api_log.save()
                        
                        logger.debug(f"Basic setting created: {basic_setting.id}")
                        write_to_debug_log(f"Basic setting created: {basic_setting.id}")
                        
                        # レスポンスを返す（従来の形式を維持）
                        result_serializer = BasicSettingSerializer(basic_setting)
                        logger.debug("Returning successful response")
                        write_to_debug_log("Returning successful response")
                        return Response(result_serializer.data, status=status.HTTP_201_CREATED)
                    except Exception as e:
                        error_msg = f"Error processing final chunk: {str(e)}"
                        logger.error(error_msg)
                        write_to_debug_log(error_msg)
                        api_log.is_success = False
                        api_log.response = f"Error: {str(e)}"
                        api_log.save()
                        return Response(
                            {'error': '基本設定の生成に失敗しました', 'details': str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                else:
                    logger.error("No response chunks received from API")
                    write_to_debug_log("No response chunks received from API")
                    api_log.is_success = False
                    api_log.response = "No response chunks received"
                    api_log.save()
                    return Response(
                        {'error': '基本設定の生成に失敗しました', 'details': 'APIからのレスポンスがありませんでした'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
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

    def retrieve(self, request, *args, **kwargs):
        """
        オブジェクトを取得するメソッド

        データが存在しない場合は204 No Contentを返します。
        """
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Http404:
            # データが存在しない場合は204 No Contentを返す
            return Response(status=status.HTTP_204_NO_CONTENT)


class LatestBasicSettingView(views.APIView):
    """
    最新の基本設定取得ビュー

    指定された小説の最新の基本設定を取得します。
    基本設定が存在しない場合は204 No Contentを返します。
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """最新の基本設定を取得"""
        story_id = self.kwargs.get('story_id')
        logger.debug(f"LatestBasicSettingView.get called for story_id: {story_id}")

        try:
            # ストーリーの存在確認
            story = get_object_or_404(AIStory, id=story_id, user=request.user)

            # 最新の基本設定を取得
            basic_setting = BasicSetting.objects.filter(
                ai_story_id=story_id
            ).order_by('-created_at').first()

            if not basic_setting:
                logger.debug(f"No basic setting found for story_id: {story_id}")
                return Response(status=status.HTTP_204_NO_CONTENT)

            serializer = BasicSettingSerializer(basic_setting)
            return Response(serializer.data)

        except Exception as e:
            logger.error(f"Error retrieving latest basic setting: {str(e)}")
            return Response(
                {'error': f'基本設定の取得中にエラーが発生しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BasicSettingActUpdateView(views.APIView):
    """
    基本設定の特定の幕あらすじ更新ビュー

    指定された小説の基本設定の特定の幕のあらすじを更新します。
    URLパラメータのact_numberに基づいて、対応するフィールドを更新します。
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        """基本設定の特定の幕のあらすじを更新"""
        story_id = self.kwargs.get('story_id')
        act_number = self.kwargs.get('act_number')
        content = request.data.get('content')

        if not content:
            return Response(
                {'error': 'あらすじ内容が指定されていません'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # ストーリーの存在確認
            story = get_object_or_404(AIStory, id=story_id, user=request.user)

            # 最新の基本設定を取得
            basic_setting = BasicSetting.objects.filter(
                ai_story_id=story_id
            ).order_by('-created_at').first()

            if not basic_setting:
                return Response(
                    {'error': '基本設定が見つかりません'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # 幕番号に応じたフィールドを更新
            if act_number == 1:
                basic_setting.act1_overview = content
            elif act_number == 2:
                basic_setting.act2_overview = content
            elif act_number == 3:
                basic_setting.act3_overview = content
            else:
                return Response(
                    {'error': '無効な幕番号です (1-3の値を指定してください)'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 変更を保存
            basic_setting.save()

            serializer = BasicSettingSerializer(basic_setting)
            return Response(serializer.data)

        except Exception as e:
            logger.error(f"Error updating basic setting act: {str(e)}")
            return Response(
                {'error': f'基本設定の更新中にエラーが発生しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
