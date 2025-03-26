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

            # 文字列を行に分割
            lines = content.split('\n')
            
            # 現在処理中のセクション
            current_section = None
            current_subsection = None
            section_content = []
            
            # 各セクションの開始行と終了行のインデックスを格納
            section_data = {}
            
            for i, line in enumerate(lines):
                # 主要セクションを検出 (## で始まるもの)
                if line.startswith('## '):
                    # 前のセクションの内容を保存
                    if current_section:
                        section_content_text = '\n'.join(section_content).strip()
                        if current_section in result:
                            result[current_section] = section_content_text
                    
                    # 新しいセクションを設定
                    section_title = line[3:].strip()
                    current_section = self._get_section_key(section_title)
                    current_subsection = None
                    section_content = []
                    continue
                
                # サブセクションを検出 (### で始まるもの)
                elif line.startswith('### '):
                    # 前のサブセクションの内容を保存
                    if current_subsection:
                        section_content_text = '\n'.join(section_content).strip()
                        if current_subsection in result:
                            result[current_subsection] = section_content_text
                    
                    # 新しいサブセクションを設定
                    subsection_title = line[4:].strip()
                    
                    # 各幕の処理
                    if '第1幕' in subsection_title:
                        # タイトルが「第1幕タイトル」の場合
                        if current_section == 'act1_overview':
                            result['act1_title'] = subsection_title.replace('第1幕', '').strip()
                        current_subsection = 'act1_overview'
                    elif '第2幕' in subsection_title:
                        if current_section == 'act2_overview':
                            result['act2_title'] = subsection_title.replace('第2幕', '').strip()
                        current_subsection = 'act2_overview'
                    elif '第3幕' in subsection_title:
                        if current_section == 'act3_overview':
                            result['act3_title'] = subsection_title.replace('第3幕', '').strip()
                        current_subsection = 'act3_overview'
                    
                    # 世界観の詳細
                    elif current_section == 'world_setting':
                        if '基本的な世界観' in subsection_title:
                            current_subsection = 'world_setting_basic'
                        elif '特徴的な要素' in subsection_title:
                            current_subsection = 'world_setting_features'
                        else:
                            current_subsection = current_section
                    
                    # 作風の詳細
                    elif current_section == 'writing_style':
                        if '文体と構造的特徴' in subsection_title:
                            current_subsection = 'writing_style_structure'
                        elif '表現技法' in subsection_title:
                            current_subsection = 'writing_style_expression'
                        elif 'テーマと主題' in subsection_title:
                            current_subsection = 'writing_style_theme'
                        else:
                            current_subsection = current_section
                    
                    # 情緒的要素の詳細
                    elif current_section == 'emotional':
                        if '愛情表現' in subsection_title:
                            current_subsection = 'emotional_love'
                        elif '感情表現' in subsection_title:
                            current_subsection = 'emotional_feelings'
                        elif '雰囲気演出' in subsection_title:
                            current_subsection = 'emotional_atmosphere'
                        elif '官能的表現' in subsection_title:
                            current_subsection = 'emotional_sensuality'
                        else:
                            current_subsection = current_section
                    
                    # テーマの説明
                    elif current_section == 'theme' and 'テーマ（主題）の説明' in subsection_title:
                        current_subsection = 'theme_description'
                    else:
                        current_subsection = current_section
                    
                    section_content = []
                    continue
                
                # 現在のセクションまたはサブセクションにコンテンツを追加
                if current_subsection:
                    section_content.append(line)
                elif current_section:
                    section_content.append(line)
            
            # 最後のセクション/サブセクションの内容を保存
            if current_subsection and section_content:
                section_content_text = '\n'.join(section_content).strip()
                if current_subsection in result:
                    result[current_subsection] = section_content_text
            elif current_section and section_content:
                section_content_text = '\n'.join(section_content).strip()
                if current_section in result:
                    result[current_section] = section_content_text
            
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
            '参考とする作風パターン': 'writing_style',  
            '情緒的・感覚的要素': 'emotional',
            '主な登場人物': 'characters',
            '主な固有名詞': 'key_items',
            '物語の背景となる過去の謎': 'mystery',
            'プロットパターン': 'plot_pattern',  
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
            ai_story = get_object_or_404(AIStory, id=story_id, user=request.user)

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
