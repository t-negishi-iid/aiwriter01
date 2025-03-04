"""
AI小説執筆支援のビュー
"""
import json
import logging
from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import (
    AIStory,
    BasicSettingData,
    BasicSetting,
    CharacterDetail,
    PlotDetail,
    EpisodeDetail,
    EpisodeContent,
    Title,
    CreditTransaction
)
from .serializers import (
    AIStorySerializer,
    AIStoryDetailSerializer,
    BasicSettingDataSerializer,
    BasicSettingSerializer,
    CharacterDetailSerializer,
    PlotDetailSerializer,
    PlotDetailWithEpisodesSerializer,
    EpisodeDetailSerializer,
    EpisodeDetailWithContentSerializer,
    EpisodeContentSerializer,
    TitleSerializer,
    CreditTransactionSerializer
)
from .dify_api import DifyNovelAPI

logger = logging.getLogger(__name__)

class AIStoryViewSet(viewsets.ModelViewSet):
    """AI小説のViewSet"""
    queryset = AIStory.objects.all()
    serializer_class = AIStorySerializer

    def get_queryset(self):
        """現在のユーザーの小説のみを返す"""
        return AIStory.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        """詳細表示の場合は詳細シリアライザーを使用"""
        if self.action == 'retrieve':
            return AIStoryDetailSerializer
        return super().get_serializer_class()


class BasicSettingDataViewSet(viewsets.ModelViewSet):
    """基本設定作成用データのViewSet"""
    queryset = BasicSettingData.objects.all()
    serializer_class = BasicSettingDataSerializer

    def get_queryset(self):
        """現在のユーザーの小説に関連するデータのみを返す"""
        return BasicSettingData.objects.filter(ai_story__user=self.request.user)

    @extend_schema(
        description="基本設定作成用データをプレビューする",
        request=BasicSettingDataSerializer,
        responses={200: {"type": "object", "properties": {"preview": {"type": "string"}}}}
    )
    @action(detail=False, methods=['post'])
    def preview(self, request):
        """基本設定作成用データのプレビューを生成する"""
        data = request.data

        try:
            # テンプレートに埋め込む (実際はテンプレートファイルを読み込む処理が必要)
            template = """
# 基本設定作成用データ

## テーマ
{theme}

## 時代と場所
{time_and_place}

## 作品世界と舞台設定
{world_setting}

## プロットパターン
{plot_pattern}

## 表現と要素
- 愛情表現: {love_expressions}
- 感情表現: {emotional_expressions}
- 雰囲気演出: {atmosphere}
- 官能表現: {sensual_expressions}
- 精神的要素: {mental_elements}
- 社会的要素: {social_elements}
- 過去の謎: {past_mysteries}
"""

            # 複数選択項目を処理
            love_expressions = ', '.join(data.get('love_expressions', []))
            emotional_expressions = ', '.join(data.get('emotional_expressions', []))
            atmosphere = ', '.join(data.get('atmosphere', []))
            sensual_expressions = ', '.join(data.get('sensual_expressions', []))
            mental_elements = ', '.join(data.get('mental_elements', []))
            social_elements = ', '.join(data.get('social_elements', []))
            past_mysteries = ', '.join(data.get('past_mysteries', []))

            filled_template = template.format(
                theme=data.get('theme', ''),
                time_and_place=data.get('time_and_place', ''),
                world_setting=data.get('world_setting', ''),
                plot_pattern=data.get('plot_pattern', ''),
                love_expressions=love_expressions,
                emotional_expressions=emotional_expressions,
                atmosphere=atmosphere,
                sensual_expressions=sensual_expressions,
                mental_elements=mental_elements,
                social_elements=social_elements,
                past_mysteries=past_mysteries
            )

            return Response({'preview': filled_template})
        except Exception as e:
            logger.error(f"Failed to generate preview: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BasicSettingViewSet(viewsets.ModelViewSet):
    """基本設定のViewSet"""
    queryset = BasicSetting.objects.all()
    serializer_class = BasicSettingSerializer

    def get_queryset(self):
        """現在のユーザーの小説に関連するデータのみを返す"""
        return BasicSetting.objects.filter(ai_story__user=self.request.user)

    @extend_schema(
        description="Dify APIを使用して基本設定を生成する",
        request={"type": "object", "properties": {
            "ai_story_id": {"type": "integer"},
            "setting_data_id": {"type": "integer"}
        }},
        responses={200: BasicSettingSerializer}
    )
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Dify APIを使用して基本設定を生成する"""
        ai_story_id = request.data.get('ai_story_id')
        setting_data_id = request.data.get('setting_data_id')

        if not ai_story_id or not setting_data_id:
            return Response(
                {'error': 'ai_story_id と setting_data_id は必須です'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            ai_story = AIStory.objects.get(id=ai_story_id, user=request.user)
            setting_data = BasicSettingData.objects.get(id=setting_data_id)

            # クレジットのチェック
            # TODO: 実際のクレジットチェックと消費処理を実装する

            # Dify APIを使用して基本設定を生成
            dify_api = DifyNovelAPI()

            # フォーマット済みコンテンツを取得
            formatted_content = setting_data.formatted_content
            if not formatted_content:
                # TODO: 実際はテンプレートファイル処理が必要
                formatted_content = f"""
# 基本設定作成用データ
テーマ: {setting_data.theme}
時代と場所: {setting_data.time_and_place}
作品世界と舞台設定: {setting_data.world_setting}
プロットパターン: {setting_data.plot_pattern}
愛情表現: {', '.join(setting_data.love_expressions)}
感情表現: {', '.join(setting_data.emotional_expressions)}
雰囲気演出: {', '.join(setting_data.atmosphere)}
官能表現: {', '.join(setting_data.sensual_expressions)}
精神的要素: {', '.join(setting_data.mental_elements)}
社会的要素: {', '.join(setting_data.social_elements)}
過去の謎: {', '.join(setting_data.past_mysteries)}
                """

            # APIリクエスト
            response = dify_api.create_basic_setting(
                formatted_content,
                user_id=str(request.user.id)
            )

            if 'answer' not in response:
                return Response(
                    {'error': 'API応答に問題があります'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # 基本設定を保存
            basic_setting_data = {
                'ai_story': ai_story,
                'setting_data': setting_data,
                'content': response['answer'],
                'work_setting': '',  # 解析が必要
                'plot_summary': '',  # 解析が必要
                'character_summary': []  # 解析が必要
            }

            # すでに存在する場合は更新、なければ作成
            basic_setting, created = BasicSetting.objects.update_or_create(
                ai_story=ai_story,
                defaults=basic_setting_data
            )

            # TODO: クレジット消費処理

            serializer = BasicSettingSerializer(basic_setting)
            return Response(serializer.data)

        except AIStory.DoesNotExist:
            return Response(
                {'error': '指定された小説が見つかりません'},
                status=status.HTTP_404_NOT_FOUND
            )
        except BasicSettingData.DoesNotExist:
            return Response(
                {'error': '指定された基本設定作成用データが見つかりません'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Failed to generate basic setting: {str(e)}")
            return Response(
                {'error': f'基本設定の生成に失敗しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CharacterDetailViewSet(viewsets.ModelViewSet):
    """キャラクター詳細のViewSet"""
    queryset = CharacterDetail.objects.all()
    serializer_class = CharacterDetailSerializer

    def get_queryset(self):
        """現在のユーザーの小説に関連するデータのみを返す"""
        return CharacterDetail.objects.filter(ai_story__user=self.request.user)

    @extend_schema(
        description="Dify APIを使用してキャラクター詳細を生成する",
        request={"type": "object", "properties": {
            "ai_story_id": {"type": "integer"},
            "character_summary": {"type": "object"}
        }},
        responses={200: CharacterDetailSerializer}
    )
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Dify APIを使用してキャラクター詳細を生成する"""
        ai_story_id = request.data.get('ai_story_id')
        character_summary = request.data.get('character_summary')

        if not ai_story_id or not character_summary:
            return Response(
                {'error': 'ai_story_id と character_summary は必須です'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            ai_story = AIStory.objects.get(id=ai_story_id, user=request.user)

            # 基本設定を取得
            try:
                basic_setting = BasicSetting.objects.get(ai_story=ai_story)
            except BasicSetting.DoesNotExist:
                return Response(
                    {'error': '基本設定が見つかりません。先に基本設定を生成してください。'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # クレジットのチェック
            # TODO: 実際のクレジットチェックと消費処理を実装する

            # Dify APIを使用してキャラクター詳細を生成
            dify_api = DifyNovelAPI()
            response = dify_api.create_character_detail(
                basic_setting.content,
                character_summary,
                user_id=str(request.user.id)
            )

            if 'answer' not in response:
                return Response(
                    {'error': 'API応答に問題があります'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # キャラクター情報を抽出
            content = response['answer']
            name = character_summary.get('name', '')
            role = character_summary.get('role', '')

            # キャラクター詳細を保存
            character_detail_data = {
                'ai_story': ai_story,
                'name': name,
                'role': role,
                'age': '',  # 解析が必要
                'gender': '',  # 解析が必要
                'appearance': '',  # 解析が必要
                'personality': '',  # 解析が必要
                'background': '',  # 解析が必要
                'motivation': '',  # 解析が必要
                'abilities': '',  # 解析が必要
                'relationships': {},  # 解析が必要
                'content': content
            }

            # 既存のキャラクターを探す
            existing = CharacterDetail.objects.filter(ai_story=ai_story, name=name).first()
            if existing:
                # 更新
                for key, value in character_detail_data.items():
                    setattr(existing, key, value)
                existing.save()
                character_detail = existing
            else:
                # 新規作成
                character_detail = CharacterDetail.objects.create(**character_detail_data)

            # TODO: クレジット消費処理

            serializer = CharacterDetailSerializer(character_detail)
            return Response(serializer.data)

        except AIStory.DoesNotExist:
            return Response(
                {'error': '指定された小説が見つかりません'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Failed to generate character detail: {str(e)}")
            return Response(
                {'error': f'キャラクター詳細の生成に失敗しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PlotDetailViewSet(viewsets.ModelViewSet):
    """あらすじ詳細のViewSet"""
    queryset = PlotDetail.objects.all()
    serializer_class = PlotDetailSerializer

    def get_queryset(self):
        """現在のユーザーの小説に関連するデータのみを返す"""
        return PlotDetail.objects.filter(ai_story__user=self.request.user)

    def get_serializer_class(self):
        """詳細表示の場合はエピソード詳細付きシリアライザーを使用"""
        if self.action == 'retrieve':
            return PlotDetailWithEpisodesSerializer
        return super().get_serializer_class()

    @extend_schema(
        description="Dify APIを使用してあらすじ詳細を生成する",
        request={"type": "object", "properties": {
            "ai_story_id": {"type": "integer"}
        }},
        responses={200: {"type": "array", "items": {"type": "object"}}}
    )
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Dify APIを使用してあらすじ詳細を生成する"""
        ai_story_id = request.data.get('ai_story_id')

        if not ai_story_id:
            return Response(
                {'error': 'ai_story_id は必須です'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            ai_story = AIStory.objects.get(id=ai_story_id, user=request.user)

            # 基本設定とキャラクター詳細を取得
            try:
                basic_setting = BasicSetting.objects.get(ai_story=ai_story)
                character_details = CharacterDetail.objects.filter(ai_story=ai_story)

                if not character_details.exists():
                    return Response(
                        {'error': 'キャラクター詳細が見つかりません。先にキャラクター詳細を作成してください。'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            except BasicSetting.DoesNotExist:
                return Response(
                    {'error': '基本設定が見つかりません。先に基本設定を生成してください。'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # クレジットのチェック
            # TODO: 実際のクレジットチェックと消費処理を実装する

            # キャラクター詳細をJSON形式に変換
            character_detail_list = []
            for detail in character_details:
                character_detail_list.append({
                    'name': detail.name,
                    'role': detail.role,
                    'content': detail.content
                })

            # Dify APIを使用してあらすじ詳細を生成
            dify_api = DifyNovelAPI()
            response = dify_api.create_plot_detail(
                basic_setting.content,
                character_detail_list,
                user_id=str(request.user.id)
            )

            if 'answer' not in response:
                return Response(
                    {'error': 'API応答に問題があります'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # 応答を3つの幕に分割
            content = response['answer']

            # 簡易的な分割方法（実際はより複雑な解析が必要）
            acts = []
            if '# 第1幕' in content and '# 第2幕' in content and '# 第3幕' in content:
                parts = content.split('# 第')
                # 最初の空のパートをスキップ
                for i, part in enumerate(parts[1:4], 1):
                    title = part.split('\n')[0].strip()
                    if title.startswith(f'{i}幕'):
                        title = title[2:].strip()  # "N幕" を削除

                    content = '\n'.join(part.split('\n')[1:]).strip()
                    acts.append({
                        'act_number': i,
                        'title': title,
                        'content': content
                    })
            else:
                # 分割できない場合はそのまま3幕に分ける
                total_lines = content.count('\n')
                lines_per_act = total_lines // 3
                lines = content.split('\n')

                for i in range(3):
                    start = i * lines_per_act
                    end = (i + 1) * lines_per_act if i < 2 else None
                    act_content = '\n'.join(lines[start:end])
                    acts.append({
                        'act_number': i + 1,
                        'title': f'第{i+1}幕',
                        'content': act_content
                    })

            # 保存したPlotDetailのリスト
            saved_plots = []

            # 各幕を保存
            for act in acts:
                plot_detail, created = PlotDetail.objects.update_or_create(
                    ai_story=ai_story,
                    act_number=act['act_number'],
                    defaults={
                        'title': act['title'],
                        'content': act['content'],
                        'summary': '',  # 要約は別途生成
                        'key_points': []
                    }
                )
                saved_plots.append(PlotDetailSerializer(plot_detail).data)

            # TODO: クレジット消費処理

            return Response(saved_plots)

        except AIStory.DoesNotExist:
            return Response(
                {'error': '指定された小説が見つかりません'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Failed to generate plot detail: {str(e)}")
            return Response(
                {'error': f'あらすじ詳細の生成に失敗しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EpisodeDetailViewSet(viewsets.ModelViewSet):
    """エピソード詳細のViewSet"""
    queryset = EpisodeDetail.objects.all()
    serializer_class = EpisodeDetailSerializer

    def get_queryset(self):
        """現在のユーザーの小説に関連するデータのみを返す"""
        return EpisodeDetail.objects.filter(ai_story__user=self.request.user)

    def get_serializer_class(self):
        """詳細表示の場合はエピソード本文付きシリアライザーを使用"""
        if self.action == 'retrieve':
            return EpisodeDetailWithContentSerializer
        return super().get_serializer_class()

    @extend_schema(
        description="Dify APIを使用してエピソード詳細を生成する",
        request={"type": "object", "properties": {
            "ai_story_id": {"type": "integer"},
            "plot_detail_id": {"type": "integer"},
            "episode_count": {"type": "integer"}
        }},
        responses={200: {"type": "array", "items": {"type": "object"}}}
    )
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Dify APIを使用してエピソード詳細を生成する"""
        ai_story_id = request.data.get('ai_story_id')
        plot_detail_id = request.data.get('plot_detail_id')
        episode_count = request.data.get('episode_count', 3)  # デフォルト3エピソード

        if not ai_story_id or not plot_detail_id:
            return Response(
                {'error': 'ai_story_id と plot_detail_id は必須です'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            ai_story = AIStory.objects.get(id=ai_story_id, user=request.user)
            plot_detail = PlotDetail.objects.get(id=plot_detail_id, ai_story=ai_story)

            # 基本設定とキャラクター詳細、全幕のあらすじを取得
            basic_setting = BasicSetting.objects.get(ai_story=ai_story)
            character_details = CharacterDetail.objects.filter(ai_story=ai_story)
            plot_details = PlotDetail.objects.filter(ai_story=ai_story)

            if not character_details.exists():
                return Response(
                    {'error': 'キャラクター詳細が見つかりません。先にキャラクター詳細を作成してください。'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if plot_details.count() < 3:
                return Response(
                    {'error': '全ての幕のあらすじ詳細が必要です。先にあらすじ詳細を生成してください。'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # クレジットのチェック
            # TODO: 実際のクレジットチェックと消費処理を実装する

            # データをJSON形式に変換
            character_detail_list = []
            for detail in character_details:
                character_detail_list.append({
                    'name': detail.name,
                    'role': detail.role,
                    'content': detail.content
                })

            plot_detail_list = []
            for detail in plot_details:
                plot_detail_list.append({
                    'act_number': detail.act_number,
                    'title': detail.title,
                    'content': detail.content
                })

            target_plot = {
                'act_number': plot_detail.act_number,
                'title': plot_detail.title,
                'content': plot_detail.content
            }

            # Dify APIを使用してエピソード詳細を生成
            dify_api = DifyNovelAPI()
            response = dify_api.create_episode_details(
                basic_setting.content,
                character_detail_list,
                plot_detail_list,
                target_plot,
                episode_count,
                user_id=str(request.user.id)
            )

            if 'answer' not in response:
                return Response(
                    {'error': 'API応答に問題があります'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # 応答をエピソードごとに分割
            content = response['answer']

            # エピソードの分割（実際はより複雑な解析が必要）
            episodes = []
            if all(f'# エピソード{i+1}' in content for i in range(episode_count)):
                parts = content.split('# エピソード')
                # 最初の空のパートをスキップ
                for i, part in enumerate(parts[1:episode_count+1], 1):
                    title_line = part.split('\n')[0].strip()
                    title = title_line[1:].strip() if title_line.startswith(f'{i}') else title_line

                    content = '\n'.join(part.split('\n')[1:]).strip()
                    episodes.append({
                        'episode_number': i,
                        'title': title,
                        'content': content
                    })
            else:
                # 分割できない場合は均等に分ける
                total_lines = content.count('\n')
                lines_per_episode = total_lines // episode_count
                lines = content.split('\n')

                for i in range(episode_count):
                    start = i * lines_per_episode
                    end = (i + 1) * lines_per_episode if i < episode_count - 1 else None
                    episode_content = '\n'.join(lines[start:end])
                    episodes.append({
                        'episode_number': i + 1,
                        'title': f'エピソード{i+1}',
                        'content': episode_content
                    })

            # 保存したEpisodeDetailのリスト
            saved_episodes = []

            # 各エピソードを保存
            for episode in episodes:
                episode_detail, created = EpisodeDetail.objects.update_or_create(
                    ai_story=ai_story,
                    plot_detail=plot_detail,
                    episode_number=episode['episode_number'],
                    defaults={
                        'title': episode['title'],
                        'content': episode['content'],
                        'summary': ''  # 要約は別途生成
                    }
                )

                # キャラクターの関連付け
                # TODO: より高度な解析で出現キャラクターを特定
                for character in character_details:
                    if character.name.lower() in episode['content'].lower():
                        episode_detail.characters.add(character)

                saved_episodes.append(EpisodeDetailSerializer(episode_detail).data)

            # TODO: クレジット消費処理

            return Response(saved_episodes)

        except AIStory.DoesNotExist:
            return Response(
                {'error': '指定された小説が見つかりません'},
                status=status.HTTP_404_NOT_FOUND
            )
        except PlotDetail.DoesNotExist:
            return Response(
                {'error': '指定されたあらすじ詳細が見つかりません'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Failed to generate episode detail: {str(e)}")
            return Response(
                {'error': f'エピソード詳細の生成に失敗しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EpisodeContentViewSet(viewsets.ModelViewSet):
    """エピソード本文のViewSet"""
    queryset = EpisodeContent.objects.all()
    serializer_class = EpisodeContentSerializer

    def get_queryset(self):
        """現在のユーザーの小説に関連するデータのみを返す"""
        return EpisodeContent.objects.filter(episode_detail__ai_story__user=self.request.user)

    @extend_schema(
        description="Dify APIを使用してエピソード本文を生成する",
        request={"type": "object", "properties": {
            "episode_detail_id": {"type": "integer"},
            "word_count": {"type": "integer"}
        }},
        responses={200: EpisodeContentSerializer}
    )
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Dify APIを使用してエピソード本文を生成する"""
        episode_detail_id = request.data.get('episode_detail_id')
        word_count = request.data.get('word_count', 2000)  # デフォルト2000文字

        if not episode_detail_id:
            return Response(
                {'error': 'episode_detail_id は必須です'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            episode_detail = EpisodeDetail.objects.get(
                id=episode_detail_id,
                ai_story__user=request.user
            )
            ai_story = episode_detail.ai_story

            # 基本設定とキャラクター詳細、全幕のあらすじを取得
            basic_setting = BasicSetting.objects.get(ai_story=ai_story)
            character_details = CharacterDetail.objects.filter(ai_story=ai_story)
            plot_details = PlotDetail.objects.filter(ai_story=ai_story)

            # クレジットのチェック
            # TODO: 実際のクレジットチェックと消費処理を実装する

            # データをJSON形式に変換
            character_detail_list = []
            for detail in character_details:
                character_detail_list.append({
                    'name': detail.name,
                    'role': detail.role,
                    'content': detail.content
                })

            plot_detail_list = []
            for detail in plot_details:
                plot_detail_list.append({
                    'act_number': detail.act_number,
                    'title': detail.title,
                    'content': detail.content
                })

            target_episode = {
                'episode_number': episode_detail.episode_number,
                'title': episode_detail.title,
                'content': episode_detail.content
            }

            # Dify APIを使用してエピソード本文を生成
            dify_api = DifyNovelAPI()
            response = dify_api.create_episode_content(
                basic_setting.content,
                character_detail_list,
                plot_detail_list,
                target_episode,
                word_count,
                user_id=str(request.user.id)
            )

            if 'answer' not in response:
                return Response(
                    {'error': 'API応答に問題があります'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            content = response['answer']

            # エピソード本文を保存
            episode_content, created = EpisodeContent.objects.update_or_create(
                episode_detail=episode_detail,
                defaults={
                    'content': content,
                    'word_count': len(content)
                }
            )

            # TODO: クレジット消費処理

            serializer = EpisodeContentSerializer(episode_content)
            return Response(serializer.data)

        except EpisodeDetail.DoesNotExist:
            return Response(
                {'error': '指定されたエピソード詳細が見つかりません'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Failed to generate episode content: {str(e)}")
            return Response(
                {'error': f'エピソード本文の生成に失敗しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TitleViewSet(viewsets.ModelViewSet):
    """タイトルのViewSet"""
    queryset = Title.objects.all()
    serializer_class = TitleSerializer

    def get_queryset(self):
        """現在のユーザーの小説に関連するデータのみを返す"""
        return Title.objects.filter(ai_story__user=self.request.user)

    @extend_schema(
        description="Dify APIを使用してタイトルを生成する",
        request={"type": "object", "properties": {
            "ai_story_id": {"type": "integer"},
            "title_type": {"type": "string", "enum": ["episode", "act", "novel"]},
            "target_object_id": {"type": "integer"},
            "target_content": {"type": "string"}
        }},
        responses={200: TitleSerializer}
    )
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Dify APIを使用してタイトルを生成する"""
        ai_story_id = request.data.get('ai_story_id')
        title_type = request.data.get('title_type')
        target_object_id = request.data.get('target_object_id')
        target_content = request.data.get('target_content')

        if not ai_story_id or not title_type or not target_content:
            return Response(
                {'error': 'ai_story_id、title_type、target_content は必須です'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if title_type not in ['episode', 'act', 'novel']:
            return Response(
                {'error': 'title_type は episode, act, novel のいずれかである必要があります'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            ai_story = AIStory.objects.get(id=ai_story_id, user=request.user)

            # 基本設定とキャラクター詳細、全幕のあらすじを取得
            basic_setting = BasicSetting.objects.get(ai_story=ai_story)
            character_details = CharacterDetail.objects.filter(ai_story=ai_story)
            plot_details = PlotDetail.objects.filter(ai_story=ai_story)

            # クレジットのチェック
            # TODO: 実際のクレジットチェックと消費処理を実装する

            # データをJSON形式に変換
            character_detail_list = []
            for detail in character_details:
                character_detail_list.append({
                    'name': detail.name,
                    'role': detail.role,
                    'content': detail.content
                })

            plot_detail_list = []
            for detail in plot_details:
                plot_detail_list.append({
                    'act_number': detail.act_number,
                    'title': detail.title,
                    'content': detail.content
                })

            # Dify APIを使用してタイトルを生成
            dify_api = DifyNovelAPI()
            response = dify_api.create_title(
                basic_setting.content,
                character_detail_list,
                plot_detail_list,
                target_content,
                title_type,
                user_id=str(request.user.id)
            )

            if 'answer' not in response:
                return Response(
                    {'error': 'API応答に問題があります'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # タイトルとして使える形に整形
            title_content = response['answer'].strip()

            # 文章形式で返ってきた場合は最初の一文を使用
            if len(title_content.split('\n')) > 1 or len(title_content) > 50:
                sentences = title_content.split('。')
                title_content = sentences[0].strip()
                if not title_content:
                    title_content = response['answer'][:50]  # 50文字以内に制限

            # タイトルを保存
            title = Title.objects.create(
                ai_story=ai_story,
                title_type=title_type,
                target_object_id=target_object_id,
                content=title_content,
                is_selected=False
            )

            # TODO: クレジット消費処理

            serializer = TitleSerializer(title)
            return Response(serializer.data)

        except AIStory.DoesNotExist:
            return Response(
                {'error': '指定された小説が見つかりません'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Failed to generate title: {str(e)}")
            return Response(
                {'error': f'タイトルの生成に失敗しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        description="生成したタイトルを選択して適用する",
        request={"type": "object", "properties": {
            "title_id": {"type": "integer"}
        }},
        responses={200: {"type": "object", "properties": {"success": {"type": "boolean"}}}}
    )
    @action(detail=False, methods=['post'], url_path='select')
    def select_title(self, request):
        """生成したタイトルを選択して適用する"""
        title_id = request.data.get('title_id')

        if not title_id:
            return Response(
                {'error': 'title_id は必須です'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            title = Title.objects.get(id=title_id, ai_story__user=request.user)
            ai_story = title.ai_story

            # 同じタイプの他のタイトルの選択を解除
            Title.objects.filter(
                ai_story=ai_story,
                title_type=title.title_type,
                target_object_id=title.target_object_id
            ).update(is_selected=False)

            # このタイトルを選択
            title.is_selected = True
            title.save()

            # タイトルの適用
            if title.title_type == 'novel':
                # 小説タイトル
                ai_story.title = title.content
                ai_story.save()
            elif title.title_type == 'act':
                # 幕タイトル
                if title.target_object_id:
                    try:
                        plot = PlotDetail.objects.get(id=title.target_object_id)
                        plot.title = title.content
                        plot.save()
                    except PlotDetail.DoesNotExist:
                        pass
            elif title.title_type == 'episode':
                # エピソードタイトル
                if title.target_object_id:
                    try:
                        episode = EpisodeDetail.objects.get(id=title.target_object_id)
                        episode.title = title.content
                        episode.save()
                    except EpisodeDetail.DoesNotExist:
                        pass

            return Response({'success': True})

        except Title.DoesNotExist:
            return Response(
                {'error': '指定されたタイトルが見つかりません'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Failed to select title: {str(e)}")
            return Response(
                {'error': f'タイトルの選択に失敗しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CreditTransactionViewSet(viewsets.ModelViewSet):
    """クレジット取引のViewSet"""
    queryset = CreditTransaction.objects.all()
    serializer_class = CreditTransactionSerializer

    def get_queryset(self):
        """現在のユーザーの取引のみを返す"""
        return CreditTransaction.objects.filter(user=self.request.user)


class BasicSettingOptionsAPIView(views.APIView):
    """基本設定作成用データの選択肢を提供するAPI"""

    @extend_schema(
        responses={200: {"type": "object", "properties": {
            "themes": {"type": "array", "items": {"type": "string"}},
            "timeAndPlaces": {"type": "array", "items": {"type": "string"}},
            "worldSettings": {"type": "array", "items": {"type": "string"}},
            "plotPatterns": {"type": "array", "items": {"type": "string"}},
            "loveExpressions": {"type": "array", "items": {"type": "string"}},
            "emotionalExpressions": {"type": "array", "items": {"type": "string"}},
            "atmosphere": {"type": "array", "items": {"type": "string"}},
            "sensualExpressions": {"type": "array", "items": {"type": "string"}},
            "mentalElements": {"type": "array", "items": {"type": "string"}},
            "socialElements": {"type": "array", "items": {"type": "string"}},
            "pastMysteries": {"type": "array", "items": {"type": "string"}}
        }}}
    )
    def get(self, request, format=None):
        """基本設定作成用データの選択肢を返す"""
        # TODO: 実際のデータはDBから取得するか、テンプレートファイルから読み込む
        options = {
            'themes': [
                '自己成長・成長物語',
                '恋愛成就',
                '復讐譚',
                '英雄の旅',
                '救済物語',
                '悲劇的転落',
                '自己発見'
            ],
            'timeAndPlaces': [
                '現代日本・都市部',
                '中世ヨーロッパ風ファンタジー世界',
                '近未来日本',
                '幕末・明治時代の日本',
                '江戸時代の日本',
                '平安時代の日本',
                '戦国時代の日本',
                '古代ローマ帝国',
                '古代エジプト',
                '中世ヨーロッパ',
                'ルネサンス期のイタリア',
                '西部開拓時代のアメリカ',
                '1920年代のアメリカ',
                '第二次世界大戦後の日本',
                '宇宙コロニー',
                '異世界（剣と魔法の世界）',
                '異世界（現代技術＋魔法）',
                'ポストアポカリプス世界',
                'サイバーパンク世界',
                'スチームパンク世界'
            ],
            'worldSettings': [
                'リアリズム（現実世界）',
                'ローファンタジー（現実＋少量の非現実要素）',
                'ハイファンタジー（魔法や魔物が存在する世界）',
                'SF（科学技術発展世界）',
                'ディストピア（管理社会）',
                'ポストアポカリプス（文明崩壊後）',
                'パラレルワールド（並行世界）',
                'ミステリー（謎解き中心）',
                'ミリタリー（軍事中心）',
                'ホラー（恐怖要素）',
                'サイバーパンク（ハイテク＋貧困）',
                'スチームパンク（蒸気機関技術発展）',
                'バイオパンク（生体工学）',
                'アーバンファンタジー（都市部の幻想）',
                'マジカルリアリズム（日常に潜む魔法）',
                'クラシックファンタジー（伝統的な魔法世界）',
                'ダークファンタジー（暗く残酷な幻想世界）',
                'コズミックホラー（宇宙的恐怖）',
                '歴史改変（実在の歴史を変えた世界）',
                'スクールライフ（学園生活）',
                'スポーツ（競技中心）',
                '医療（病院・医療従事者）',
                'アイドル（芸能界）',
                'クッキング（料理中心）',
                'ビジネス（企業・経済活動）'
            ],
            'plotPatterns': [
                '成長物語',
                '恋愛',
                '復讐',
                '英雄の旅',
                '救済',
                '悲劇',
                '追求',
                '出会いと別れ',
                '転生',
                '謎解き',
                '発見と啓示',
                '誘惑',
                '変身',
                '成熟',
                '犠牲',
                '昇天と没落',
                '競争',
                '人質',
                '蘇生',
                '対立',
                '禁断の愛',
                '裏切り',
                '冒険',
                '追跡',
                '生存'
            ],
            'loveExpressions': [
                '友情',
                '恋愛',
                '家族愛',
                'プラトニックな愛',
                '献身的な愛',
                '片思い',
                '失恋',
                '禁断の恋',
                '相思相愛',
                '三角関係',
                '運命の出会い',
                '決断の恋',
                '懐かしい恋',
                '復活する恋',
                '諦める恋',
                '一目惚れ',
                '偽りの恋',
                '報われない恋',
                '愛と憎しみ',
                '結ばれる恋'
            ],
            'emotionalExpressions': [
                '喜び',
                '悲しみ',
                '怒り',
                '恐怖',
                '嫌悪',
                '驚き',
                '期待',
                '絶望',
                '後悔',
                '羨望',
                '嫉妬',
                '誇り',
                '恥じらい',
                '罪悪感',
                '無力感',
                '孤独',
                '不安',
                '安らぎ',
                '憧れ',
                '希望'
            ],
            'atmosphere': [
                '明るい',
                '暗い',
                '緊張感',
                '哀愁',
                '神秘的',
                '童話的',
                '幻想的',
                '恐怖',
                '悲壮感',
                '荘厳',
                '親密感',
                '疎外感',
                '郷愁',
                '現実感',
                '非現実感',
                '高揚感',
                '絶望感',
                '希望',
                '未来志向',
                '懐古趣味'
            ],
            'sensualExpressions': [
                '控えめな表現',
                '暗示的な表現',
                '情熱的な表現',
                '赤裸々な表現',
                '官能的な描写'
            ],
            'mentalElements': [
                'トラウマ',
                '精神的成長',
                '葛藤',
                '狂気',
                '幻覚',
                '記憶喪失',
                '二重人格',
                '洞察',
                '直感',
                '悟り',
                '啓示',
                '妄想',
                '幻想',
                '夢と現実の境界',
                '自己実現',
                '自己変容',
                '自己否定',
                '恐怖症',
                '強迫観念',
                '心の傷'
            ],
            'socialElements': [
                '階級対立',
                'ジェンダー問題',
                '人種問題',
                '政治的対立',
                '世代間ギャップ',
                '地域間対立',
                '宗教対立',
                '異文化交流',
                '伝統と革新',
                '権力闘争',
                '貧富の差',
                '環境問題',
                '科学技術の影響',
                '戦争と平和',
                '組織と個人',
                '教育問題',
                '家族制度',
                '社会規範',
                'メディア影響',
                'グローバリズム'
            ],
            'pastMysteries': [
                '忘れられた記憶',
                '隠された出自',
                '故郷の秘密',
                '封印された力',
                '過去の罪',
                '失われた恋人',
                '家族の秘密',
                '謎の事件',
                '前世の記憶',
                '忘れられた約束',
                '歴史的陰謀',
                '封印された魔法',
                '予言の謎',
                '呪いの起源',
                '古代の遺物',
                '失われた文明',
                '王朝の秘宝',
                '秘密の組織',
                '伝説の真実',
                '未解決事件'
            ]
        }

        return Response(options)
