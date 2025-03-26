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
            # 文字列を行に分割
            lines = content.split('\n')

            # セクション処理用の変数
            current_section = None
            section_content = []
            sections = {}

            result = {}

            # 処理1：メインセクション（##）の分割
            for line in lines:
                # 新しいセクションの開始を検出
                if line.startswith('## '):
                    # 前のセクションの内容を保存
                    if current_section and section_content:
                        sections[current_section] = '\n'.join(section_content).strip()

                    # 新しいセクションの開始
                    section_title = line[3:].strip()
                    current_section = self._get_section_key(section_title)
                    section_content = []
                else:
                    # セクションコンテンツに追加
                    if current_section and line != '---' and line != '--':  # "---"と"--"の行は無視
                        section_content.append(line)

            # 最後のセクションの内容を保存
            if current_section and section_content:
                sections[current_section] = '\n'.join(section_content).strip()

            # セクション内容を結果辞書にコピー
            for key, content in sections.items():
                if key != 'plot':  # あらすじセクション以外をそのまま保存
                    result[key] = content

            # 処理2：あらすじセクションのサブセクション（###）処理
            if 'plot' in sections:
                content = sections['plot']
                lines = content.split('\n')

                current_section = None
                section_content = []

                # プロット文の処理と同じ流れでサブセクションを処理
                for line in lines:
                    # 新しいセクションの開始を検出
                    if line.startswith('### '):
                        # 前のセクションの内容を保存
                        if current_section and section_content:
                            sections[current_section] = '\n'.join(section_content).strip()

                        # 新しいセクションの開始
                        section_title = line[4:].strip()
                        current_section = self._get_section_key(section_title)
                        section_content = []
                    else:
                        # セクションコンテンツに追加
                        if current_section and line != '---' and line != '--':  # "---"と"--"の行は無視
                            section_content.append(line)

            # 最後のセクションの内容を保存
            if current_section and section_content:
                sections[current_section] = '\n'.join(section_content).strip()

            # セクション内容を結果辞書にコピー
            for key, content in sections.items():
                result[key] = content

            return result
        except Exception as e:
            logger.error(f"Error parsing basic setting content: {str(e)}")
            write_to_debug_log(f"Error parsing basic setting content: {str(e)}")
            # エラー時は空の結果を返す
            return {
                'title': '',
                'summary': '',
                'theme': '',
                'theme_description': '',
                'time_place': '',
                'world_setting': '',
                'world_setting_basic': '',
                'world_setting_features': '',
                'writing_style': '',
                'writing_style_structure': '',
                'writing_style_expression': '',
                'writing_style_theme': '',
                'emotional': '',
                'emotional_love': '',
                'emotional_feelings': '',
                'emotional_atmosphere': '',
                'emotional_sensuality': '',
                'characters': '',
                'key_items': '',
                'mystery': '',
                'plot_pattern': '',
                'act1_title': '',
                'act1_overview': '',
                'act2_title': '',
                'act2_overview': '',
                'act3_title': '',
                'act3_overview': '',
            }

    def _get_section_key(self, section_title):
        """セクションタイトルからモデルフィールド名に変換"""
        mapping = {
            'タイトル': 'title',
            'サマリー': 'summary',
            'テーマ（主題）': 'theme',
            '時代と場所': 'time_place',
            '作品世界と舞台設定': 'world_setting',
            '参考とする作風': 'writing_style',
            '情緒的・感覚的要素': 'emotional',
            '主な登場人物': 'characters',
            '主な固有名詞': 'key_items',
            '物語の背景となる過去の謎': 'mystery',
            'プロットパターン': 'plot_pattern',
            'あらすじ': 'plot', # パース時の一時的なバッファ
            '第1幕': 'act1_overview',
            '第2幕': 'act2_overview',
            '第3幕': 'act3_overview',
        }
        return mapping.get(section_title, 'unknown')

    def get(self, request, *args, **kwargs):
        """基本設定を取得"""
        print("=== BasicSettingCreateView.get called ===")
        write_to_debug_log("=== BasicSettingCreateView.get called ===")
        write_to_debug_log(f"Request method: {request.method}")
        write_to_debug_log(f"Request headers: {dict(request.headers)}")

        logger.debug("=== BasicSettingCreateView.get called ===")
        logger.debug(f"Request method: {request.method}")
        logger.debug(f"Request headers: {dict(request.headers)}")

        story_id = kwargs.get('story_id')
        logger.debug(f"AIStory ID: {story_id}")
        write_to_debug_log(f"AIStory ID: {story_id}")

        try:
            # ユーザーの小説を取得
            ai_story = get_object_or_404(AIStory, id=story_id, user=request.user)
            logger.debug(f"Found AIStory: {ai_story.id} - {ai_story.title}")
            write_to_debug_log(f"Found AIStory: {ai_story.id} - {ai_story.title}")

            # 基本設定を取得
            try:
                basic_setting = BasicSetting.objects.get(ai_story=ai_story)
                logger.debug(f"Found basic setting: {basic_setting.id}")
                write_to_debug_log(f"Found basic setting: {basic_setting.id}")

                # シリアライズして返す
                serializer = BasicSettingSerializer(basic_setting)
                logger.debug("Returning basic setting")
                write_to_debug_log("Returning basic setting")
                return Response(serializer.data)
            except BasicSetting.DoesNotExist:
                logger.error(f"Basic setting not found for AIStory: {ai_story.id}")
                write_to_debug_log(f"Basic setting not found for AIStory: {ai_story.id}")
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

        story_id = kwargs.get('story_id')
        logger.debug(f"AIStory ID: {story_id}")
        write_to_debug_log(f"AIStory ID: {story_id}")

        try:
            ai_story = get_object_or_404(AIStory, id=story_id, user=request.user)
            logger.debug(f"Found AIStory: {ai_story.id} - {ai_story.title}")
            write_to_debug_log(f"Found AIStory: {ai_story.id} - {ai_story.title}")

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
                    ai_story=ai_story
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
                existing_settings = BasicSetting.objects.filter(ai_story=ai_story)
                if existing_settings.exists():
                    logger.debug(f"Deleting {existing_settings.count()} existing basic settings for AIStory {ai_story.id}")
                    write_to_debug_log(f"Deleting {existing_settings.count()} existing basic settings for AIStory {ai_story.id}")
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
                ai_story=ai_story,
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
                            ai_story=ai_story,
                            setting_data=basic_setting_data,
                            title=parsed_content.get('title', ''),
                            summary=parsed_content.get('summary', ''),
                            theme=parsed_content.get('theme', ''),
                            theme_description=parsed_content.get('theme_description', ''),
                            time_place=parsed_content.get('time_place', ''),
                            world_setting=parsed_content.get('world_setting', ''),
                            world_setting_basic=parsed_content.get('world_setting_basic', ''),
                            world_setting_features=parsed_content.get('world_setting_features', ''),
                            writing_style=parsed_content.get('writing_style', ''),
                            writing_style_structure=parsed_content.get('writing_style_structure', ''),
                            writing_style_expression=parsed_content.get('writing_style_expression', ''),
                            writing_style_theme=parsed_content.get('writing_style_theme', ''),
                            emotional=parsed_content.get('emotional', ''),
                            emotional_love=parsed_content.get('emotional_love', ''),
                            emotional_feelings=parsed_content.get('emotional_feelings', ''),
                            emotional_atmosphere=parsed_content.get('emotional_atmosphere', ''),
                            emotional_sensuality=parsed_content.get('emotional_sensuality', ''),
                            characters=parsed_content.get('characters', ''),
                            key_items=parsed_content.get('key_items', ''),
                            mystery=parsed_content.get('mystery', ''),
                            plot_pattern=parsed_content.get('plot_pattern', ''),
                            act1_title=parsed_content.get('act1_title', ''),
                            act1_overview=parsed_content.get('act1_overview', ''),
                            act2_title=parsed_content.get('act2_title', ''),
                            act2_overview=parsed_content.get('act2_overview', ''),
                            act3_title=parsed_content.get('act3_title', ''),
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
        特定の幕(act)のみの取得もサポートしています。
        """
        try:
            instance = self.get_object()

            # act番号が指定されている場合、対応するフィールドのみを返す
            act_number = request.query_params.get('act')
            if act_number in ['1', '2', '3']:
                act_num = int(act_number)
                field_name = f'act{act_num}_overview'

                return Response({
                    'id': instance.id,
                    field_name: getattr(instance, field_name, '')
                })

            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Http404:
            # データが存在しない場合は204 No Contentを返す
            return Response(status=status.HTTP_204_NO_CONTENT)

    def update(self, request, *args, **kwargs):
        """
        オブジェクトを更新するメソッド

        更新後、全フィールドをMarkdown形式で連結してraw_contentを生成します。
        特定の幕(act)のみの更新もサポートしています。
        幕のタイトルフィールドにはデフォルトで空文字を設定します。
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        # act番号が指定されている場合、対応するフィールドのみを更新
        act_number = request.query_params.get('act')
        if act_number in ['1', '2', '3']:
            act_num = int(act_number)
            field_name = f'act{act_num}_overview'
            title_field = f'act{act_num}_title'

            if field_name in request.data:
                # 該当する幕のフィールドのみを更新
                setattr(instance, field_name, request.data[field_name])
                # タイトルフィールドに空文字を設定
                setattr(instance, title_field, '')
                instance.save()

                # Markdownフォーマットでraw_contentを更新
                raw_content = self._generate_raw_content(instance)
                instance.raw_content = raw_content
                instance.save()

                return Response({
                    'id': instance.id,
                    field_name: getattr(instance, field_name)
                })

        # タイトルフィールドに空文字を設定
        data = request.data.copy()
        if 'act1_title' not in data:
            data['act1_title'] = ''
        if 'act2_title' not in data:
            data['act2_title'] = ''
        if 'act3_title' not in data:
            data['act3_title'] = ''

        # 通常の更新処理
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # 更新後のインスタンスを取得
        updated_instance = self.get_object()

        # Markdownフォーマットでraw_contentを生成
        raw_content = self._generate_raw_content(updated_instance)

        # raw_contentを更新して保存
        updated_instance.raw_content = raw_content
        updated_instance.save()

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    def _generate_raw_content(self, instance):
        """オブジェクトの各フィールドからMarkdown形式のraw_contentを生成"""

        # セクションタイトルのマッピング（_get_section_keyの逆マッピング）
        section_titles = {
            'title': 'タイトル',
            'summary': 'サマリー',
            'theme': 'テーマ（主題）',
            'time_place': '時代と場所',
            'world_setting': '作品世界と舞台設定',
            'writing_style': '参考とする作風',
            'emotional': '情緒的・感覚的要素',
            'characters': '主な登場人物',
            'key_items': '主な固有名詞',
            'mystery': '物語の背景となる過去の謎',
            'plot_pattern': 'プロットパターン',
        }

        # 生成するMarkdownテキスト
        content_parts = ["# 作品設定\n"]

        # 通常のセクションを処理
        for field, title in section_titles.items():
            field_value = getattr(instance, field, '')
            if field_value:
                content_parts.append(f"## {title}\n{field_value}\n")

        # あらすじセクションの特別処理
        plot_parts = []
        for act_num in [1, 2, 3]:
            act_content = getattr(instance, f'act{act_num}_overview', '')
            if act_content:
                plot_parts.append(f"### 第{act_num}幕\n{act_content}")

        # あらすじセクションがあれば追加
        if plot_parts:
            content_parts.append("## あらすじ\n" + "\n\n".join(plot_parts) + "\n")

        # すべてのパーツを結合
        return "\n".join(content_parts)


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
            ai_story = get_object_or_404(AIStory, id=story_id, user=request.user)

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
