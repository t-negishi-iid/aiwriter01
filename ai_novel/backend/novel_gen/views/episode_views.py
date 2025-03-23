"""
エピソード詳細関連のビュー
"""
from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.db import transaction, models
import logging

logger = logging.getLogger(__name__)

from ..models import (
    AIStory, BasicSetting, CharacterDetail, ActDetail,
    EpisodeDetail, APIRequestLog
)
from ..serializers import (
    EpisodeDetailSerializer, EpisodeDetailRequestSerializer,
    EpisodeNumberUpdateSerializer, EpisodeCreateSerializer
)
from ..dify_api import DifyNovelAPI
from ..utils import check_and_consume_credit


class ActEpisodesListView(generics.ListCreateAPIView):
    """
    幕に属する全エピソードの一覧を取得、または新規エピソードを作成します。

    URL: /api/stories/{story_id}/acts/{act_number}/episodes/
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EpisodeDetailSerializer

    def get_queryset(self):
        story_id = self.kwargs.get('story_id')
        act_number = self.kwargs.get('act_number')

        # 権限チェック
        story = get_object_or_404(AIStory, id=story_id, user=self.request.user)
        act = get_object_or_404(ActDetail, ai_story=story, act_number=act_number)

        return EpisodeDetail.objects.filter(act=act).order_by('episode_number')

    def create(self, request, *args, **kwargs):
        story_id = self.kwargs.get('story_id')
        act_number = self.kwargs.get('act_number')

        # 権限チェック
        story = get_object_or_404(AIStory, id=story_id, user=request.user)
        act = get_object_or_404(ActDetail, ai_story=story, act_number=act_number)

        # リクエストデータの検証
        serializer = EpisodeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # 最後のエピソード番号を取得
        last_episode = EpisodeDetail.objects.filter(act=act).order_by('-episode_number').first()
        next_episode_number = 1 if last_episode is None else last_episode.episode_number + 1

        # 新しいエピソードを作成
        episode = EpisodeDetail.objects.create(
            act=act,
            episode_number=next_episode_number,
            title=serializer.validated_data['title'],
            content=serializer.validated_data['content']
        )

        # レスポンスを返す
        result_serializer = EpisodeDetailSerializer(episode)
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)


class CreateEpisodesView(views.APIView):
    """
    Dify APIでActDetailから分割されたエピソード群を生成するビュー

    URL: /api/stories/{story_id}/acts/{act_number}/episodes/create/
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        story_id = self.kwargs.get('story_id')
        act_number = self.kwargs.get('act_number')

        # 権限チェック
        story = get_object_or_404(AIStory, id=story_id, user=request.user)
        act = get_object_or_404(ActDetail, ai_story=story, act_number=act_number)

        # リクエストパラメータの検証
        serializer = EpisodeDetailRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        episode_count = serializer.validated_data['episode_count']

        # basic_setting_idを取得
        basic_setting_id = serializer.validated_data.get('basic_setting_id')
        if not basic_setting_id:
            return Response(
                {'error': '作品設定IDが指定されていません。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 作品設定の取得
        try:
            basic_setting = BasicSetting.objects.get(id=basic_setting_id)
        except BasicSetting.DoesNotExist:
            return Response(
                {'error': '指定された作品設定が存在しません。'},
                status=status.HTTP_400_BAD_REQUEST
            )


        # キャラクター詳細の取得
        character_details = CharacterDetail.objects.filter(ai_story=story)
        if not character_details.exists():
            return Response(
                {'error': 'キャラクター詳細が存在しません。先にキャラクター詳細を作成してください。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # クレジットの確認と消費
        success, message = check_and_consume_credit(request.user, 'episode_detail')
        if not success:
            return Response({'error': message}, status=status.HTTP_402_PAYMENT_REQUIRED)

        # story_idから全キャラクターのCharacterDetail.raw_contentを取得して配列化
        character_details_raw_content = [char.raw_content for char in character_details]

        # story_idから全ActのActDetail.raw_contentを取得して配列化
        act_details = ActDetail.objects.filter(ai_story=story)
        all_act_raw_content = [act.raw_content for act in act_details]

        # APIリクエスト
        api = DifyNovelAPI()

        # APIログの作成
        api_log = APIRequestLog.objects.create(
            user=request.user,
            request_type='episode_detail',
            ai_story=story,
            parameters={
                'story_id': story_id,
                'act_number': act_number,
                'episode_count': episode_count
            },
            credit_cost=3
        )

        try:
            # 6. 3、4、5とエピソード数を渡してDify APIを呼び出す
            response = api.create_episode_details(
                basic_setting=basic_setting.raw_content,
                all_characters_list=character_details_raw_content,
                all_act_details_list=all_act_raw_content,
                target_act_detail=act.raw_content,
                episode_count=episode_count,
                user_id=str(request.user.id),
                blocking=True
            )

            # レスポンスの検証
            logger.debug(f"DEBUG - CreateEpisodeDetailView - API response: {response}")

            # レスポンスの検証
            if 'error' in response:
                api_log.is_success = False
                api_log.response = str(response)
                api_log.save()
                return Response(
                    {'error': 'エピソード詳細の生成に失敗しました', 'details': response},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # レスポンスを各エピソードにパースする
            import re

            # エピソードのパターンを定義
            episode_pattern = r'### エピソード(\d+)「([^」]+)」\s+(.*?)(?=---|$)'

            # 生のテキストデータ
            raw_text = response['result']

            # 正規表現でエピソードを抽出
            episodes_matches = list(re.finditer(episode_pattern, raw_text, re.DOTALL))

            # 抽出されたエピソードが存在しない場合はエラーを返す
            if not episodes_matches:
                api_log.is_success = False
                api_log.response = "エピソードのパースに失敗しました"
                api_log.save()
                return Response(
                    {'error': 'エピソードの抽出に失敗しました', 'details': 'APIレスポンスからエピソードを抽出できませんでした。', 'raw_text': raw_text[:500]},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # エピソードが正常に抽出できた場合のみ、この幕（act）の既存のエピソードを削除
            # act_idを明示的に指定して削除する
            logger.debug(f"DEBUG - CreateEpisodesView - 幕ID {act.id} のエピソードを削除します")
            deleted_count = EpisodeDetail.objects.filter(act=act).delete()[0]
            logger.debug(f"DEBUG - CreateEpisodesView - 幕ID {act.id} のエピソード {deleted_count} 件を削除しました")

            # 新しいエピソードを作成
            created_episodes = []
            for match in episodes_matches:
                episode_number = int(match.group(1))
                title = match.group(2)
                content = match.group(3).strip()

                # エピソードデータをJSON形式で保存
                episode_data = {
                    'episode_number': episode_number,
                    'title': title,
                    'content': content
                }

                episode = EpisodeDetail.objects.create(
                    act=act,
                    episode_number=episode_number,
                    title=title,
                    content=content,
                    raw_content=episode_data
                )
                created_episodes.append(episode)

            # APIログの更新
            api_log.is_success = True
            api_log.response = str(episodes_matches)
            api_log.save()

            # レスポンスを返す
            serializer = EpisodeDetailSerializer(created_episodes, many=True)
            return Response({
                'count': len(created_episodes),
                'next': None,
                'previous': None,
                'results': serializer.data,
                'status': 'success'
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            # エラーログ
            api_log.is_success = False
            api_log.response = str(e)
            api_log.save()
            return Response(
                {'error': 'エピソード詳細の生成に失敗しました', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EpisodeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    エピソードの取得・更新・削除ビュー

    URL: /api/stories/{story_id}/acts/{act_number}/episodes/{episode_id}/
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EpisodeDetailSerializer

    def get_object(self):
        story_id = self.kwargs.get('story_id')
        act_number = self.kwargs.get('act_number')
        episode_id = self.kwargs.get('pk')

        # 権限チェック
        story = get_object_or_404(AIStory, id=story_id, user=self.request.user)
        act = get_object_or_404(ActDetail, ai_story=story, act_number=act_number)

        return get_object_or_404(EpisodeDetail, id=episode_id, act=act)

    def update(self, request, *args, **kwargs):
        if 'episode_number' in request.data:
            # episode_numberの更新は特別な処理を行う
            return self.update_episode_number(request, *args, **kwargs)
        else:
            # 通常の更新処理
            return super().update(request, *args, **kwargs)

    @transaction.atomic
    def update_episode_number(self, request, *args, **kwargs):
        """エピソードの並び順を入れ替える"""
        story_id = self.kwargs.get('story_id')
        act_number = self.kwargs.get('act_number')

        # 権限チェック
        story = get_object_or_404(AIStory, id=story_id, user=request.user)
        act = get_object_or_404(ActDetail, ai_story=story, act_number=act_number)

        # シリアライザーでリクエストデータを検証
        serializer = EpisodeNumberUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target_position = serializer.validated_data['episode_number']

        # 対象のエピソードを取得
        source_episode = self.get_object()
        current_position = source_episode.episode_number

        # 同じ位置なら何もしない
        if current_position == target_position:
            result_serializer = EpisodeDetailSerializer(source_episode)
            return Response(result_serializer.data)

        # 一時的に負の値を使用して一意制約に違反しないようにする
        # 最大エピソード番号を取得して、それより小さい負の値を使用
        max_episode_number = EpisodeDetail.objects.filter(act=act).aggregate(
            max_num=models.Max('episode_number'))['max_num'] or 0
        temp_number = -1 * (max_episode_number + 1000)  # 十分に小さい負の値

        # まず対象エピソードを一時的な負の番号に変更
        source_episode.episode_number = temp_number
        source_episode.save()

        # 上に移動する場合（current_position > target_position）
        if current_position > target_position:
            # エピソードの位置を調整
            EpisodeDetail.objects.filter(
                act=act,
                episode_number__gte=target_position,
                episode_number__lt=current_position
            ).update(
                episode_number=models.F('episode_number') + 1
            )

        # 下に移動する場合（current_position < target_position）
        elif current_position < target_position:
            # エピソードの位置を調整
            EpisodeDetail.objects.filter(
                act=act,
                episode_number__gt=current_position,
                episode_number__lte=target_position
            ).update(
                episode_number=models.F('episode_number') - 1
            )

        # 最後に対象エピソードを目的の位置に更新
        source_episode.episode_number = target_position
        source_episode.save()

        # 更新されたエピソード一覧を取得
        episodes = EpisodeDetail.objects.filter(act=act).order_by('episode_number')

        # レスポンスを返す
        return Response({
            'count': episodes.count(),
            'next': None,
            'previous': None,
            'results': EpisodeDetailSerializer(episodes, many=True).data,
            'status': 'success'
        })
