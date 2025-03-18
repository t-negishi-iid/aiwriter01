"""
あらすじ詳細関連のビュー
"""
from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.db import transaction
import logging

from ..models import AIStory, BasicSetting, CharacterDetail, ActDetail, APIRequestLog
from ..serializers import (
    ActDetailCreateSerializer, ActDetailSerializer,
    PlotDetailRequestSerializer
)
from ..dify_api import DifyNovelAPI
from ..utils import check_and_consume_credit

logger = logging.getLogger(__name__)

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

    def update(self, request, *args, **kwargs):
        """幕詳細更新時に編集済みフラグを設定"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        # リクエストデータに編集済みフラグを追加
        data = request.data.copy()
        data['is_edited'] = True

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            # インスタンスのキャッシュを無効化
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)


class CreatePlotDetailView(views.APIView):
    """
    あらすじ詳細生成ビュー

    基本設定とキャラクター詳細を元にあらすじ詳細（3幕分）を生成します。
    クレジットを消費します。
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """あらすじ詳細を生成"""
        # リクエストの検証
        serializer = PlotDetailRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # basic_setting_idを取得
        basic_setting_id = serializer.validated_data.get('basic_setting_id')
        if not basic_setting_id:
            return Response(
                {'error': '作品設定IDが指定されていません。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 基本設定の取得
        try:
            basic_setting = BasicSetting.objects.get(id=basic_setting_id)
        except BasicSetting.DoesNotExist:
            return Response(
                {'error': '指定された作品設定が存在しません。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ストーリーIDの取得と所有権確認
        story = basic_setting.ai_story
        if story.user != request.user:
            return Response(
                {'error': 'この作品設定にアクセスする権限がありません。'},
                status=status.HTTP_403_FORBIDDEN
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

        # キャラクター詳細データの準備（raw_contentの配列）
        all_characters_array = [char.raw_content for char in character_details]
        
        # キャラクター詳細を1つの文字列に連結
        all_characters_with_newlines = []
        for char_content in all_characters_array:
            # 各キャラクター情報が既に改行で終わっていない場合は改行を追加
            if not char_content.endswith('\n'):
                char_content += '\n'
            all_characters_with_newlines.append(char_content)
        
        # 改行で区切られた1つの文字列に連結
        all_characters = '\n'.join(all_characters_with_newlines)

        # APIログの作成
        api_log = APIRequestLog.objects.create(
            user=request.user,
            request_type='plot_detail',
            ai_story=story,
            parameters={},
            credit_cost=2
        )

        try:
            # デバッグ用のログ出力
            logger.error(f"DEBUG - CreatePlotDetailView - basic_setting.raw_content: {basic_setting.raw_content[:200]}")
            logger.error(f"DEBUG - CreatePlotDetailView - all_characters (first 200 chars): {all_characters[:200]}")
            
            # 同期APIリクエスト
            response = api.create_plot_detail(
                basic_setting=basic_setting.raw_content,
                all_characters=all_characters,
                user_id=str(request.user.id),
                blocking=True
            )

            # レスポンスの検証
            logger.error(f"DEBUG - CreatePlotDetailView - API response: {response}")
            
            if 'error' in response:
                api_log.is_success = False
                api_log.response_data = {'error': response['error']}
                api_log.save()
                return Response({'error': 'あらすじ詳細の生成に失敗しました', 'details': response['error']},
                               status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # resultキーがない場合のチェック
            if 'result' not in response:
                logger.error(f"DEBUG - CreatePlotDetailView - 'result' key not found in response: {response}")
                api_log.is_success = False
                api_log.response_data = {'error': 'APIレスポンスに結果が含まれていません'}
                api_log.save()
                return Response(
                    {'error': 'あらすじ詳細の生成に失敗しました', 'details': 'APIレスポンスに結果が含まれていません'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            content = response['result']

            # デバッグ用にコンテンツの先頭部分をログに出力
            logger.error(f"DEBUG - CreatePlotDetailView - content (first 200 chars): {content[:200]}")

            # 3幕に分割するロジック
            import re

            # 「第X幕」という見出しで分割
            act_pattern = r'## 第(\d+)幕'
            
            # 正規表現で「第X幕」を検索
            act_matches = re.finditer(act_pattern, content)
            act_positions = [(int(match.group(1)), match.start()) for match in act_matches]
            
            # 見つからない場合は、デフォルトの3幕構成を作成
            if not act_positions:
                logger.error("DEBUG - CreatePlotDetailView - No act headers found, creating default acts")
                # デフォルトの3幕構成を作成
                act_detail = ActDetail.objects.create(
                    ai_story=story,
                    act_number=1,
                    title='第1幕',
                    content=content,
                    raw_content=content
                )
                act_details = [act_detail]
            else:
                # 各幕の開始位置と終了位置を特定
                act_details = []
                for i, (act_number, start_pos) in enumerate(act_positions):
                    # タイトル部分を抽出（「## 第X幕」の行から次の行まで）
                    title_match = re.search(r'## 第\d+幕\s*\n(?:###\s*([^\n]+))?', content[start_pos:])
                    title = title_match.group(1).strip() if title_match and title_match.group(1) else f'第{act_number}幕'
                    
                    # 内容の開始位置を特定
                    content_start = start_pos
                    if i < len(act_positions) - 1:
                        content_end = act_positions[i+1][1]
                    else:
                        content_end = len(content)
                    
                    act_content = content[content_start:content_end].strip()
                    
                    # ActDetailオブジェクトを作成してデータベースに保存
                    act_detail = ActDetail.objects.create(
                        ai_story=story,
                        act_number=act_number,
                        title=title,
                        content=act_content,
                        raw_content=act_content
                    )
                    act_details.append(act_detail)

            # APIログの更新
            api_log.is_success = True

            # 3幕の情報を含むレスポンスを記録
            act_summaries = []
            for act in act_details:
                act_summaries.append(f"第{act.act_number}幕: {act.title}\n{act.content[:100]}...")

            api_log.response = f"APIレスポンス:\n{content[:200]}...\n\n分割結果:\n" + "\n\n".join(act_summaries)
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
