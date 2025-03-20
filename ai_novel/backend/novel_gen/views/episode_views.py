"""
エピソード詳細関連のビュー
"""
from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.db import transaction, models

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


class ActEpisodesListView(generics.ListAPIView):
    """
    幕に属する全エピソードの一覧を取得するビュー

    URL: /api/stories/{story_id}/acts/{act_id}/episodes/
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EpisodeDetailSerializer

    def get_queryset(self):
        story_id = self.kwargs.get('story_id')
        act_id = self.kwargs.get('act_id')

        # 権限チェック
        story = get_object_or_404(AIStory, id=story_id, user=self.request.user)
        act = get_object_or_404(ActDetail, id=act_id, ai_story=story)

        return EpisodeDetail.objects.filter(act=act).order_by('episode_number')


class CreateEpisodesView(views.APIView):
    """
    ActDetailから分割されたエピソード群を生成するビュー

    URL: /api/stories/{story_id}/acts/{act_id}/create-episodes/
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        story_id = self.kwargs.get('story_id')
        act_id = self.kwargs.get('act_id')

        # 権限チェック
        story = get_object_or_404(AIStory, id=story_id, user=request.user)
        act = get_object_or_404(ActDetail, id=act_id, ai_story=story)

        # リクエストパラメータの検証
        serializer = EpisodeDetailRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        episode_count = serializer.validated_data['episode_count']

        # 基本設定の取得
        try:
            basic_setting = BasicSetting.objects.get(ai_story=story)
        except BasicSetting.DoesNotExist:
            return Response(
                {'error': '基本設定が存在しません。先に基本設定を作成してください。'},
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

        # APIリクエスト
        api = DifyNovelAPI()

        # 3. act_idからActDetail.raw_contentを取得
        act_raw_content = act.raw_content

        # 4. story_idからBasicSetting.raw_contentを取得（既に取得済み）
        basic_setting_raw_content = basic_setting.raw_content

        # 5. story_idから全キャラクターのCharacterDetail.raw_contentを取得して配列化
        character_details_raw_content = [char.raw_content for char in character_details]

        # APIログの作成
        api_log = APIRequestLog.objects.create(
            user=request.user,
            request_type='episode_detail',
            ai_story=story,
            parameters={
                'story_id': story_id,
                'act_id': act_id,
                'episode_count': episode_count
            },
            credit_cost=3
        )

        try:
            # 6. 3、4、5とエピソード数を渡してDify APIを呼び出す
            response = api.create_episode_details(
                basic_setting=basic_setting_raw_content,
                character_details=character_details_raw_content,
                act_detail=act_raw_content,
                episode_count=episode_count,
                user_id=str(request.user.id),
                blocking=True
            )

            # レスポンスの検証
            if 'error' in response:
                api_log.is_success = False
                api_log.response = str(response)
                api_log.save()
                return Response(
                    {'error': 'エピソード詳細の生成に失敗しました', 'details': response},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            episodes_data = response['episodes']

            # 既存のエピソードを削除
            EpisodeDetail.objects.filter(act=act).delete()

            # 新しいエピソードを作成
            created_episodes = []
            for index, episode_data in enumerate(episodes_data, 1):
                episode = EpisodeDetail.objects.create(
                    act=act,
                    episode_number=index,
                    title=episode_data['title'],
                    content=episode_data['content'],
                    raw_content=episode_data
                )
                created_episodes.append(episode)

            # APIログの更新
            api_log.is_success = True
            api_log.response = str(episodes_data)
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

    URL: /api/stories/{story_id}/acts/{act_id}/episodes/{episode_id}/
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EpisodeDetailSerializer

    def get_object(self):
        story_id = self.kwargs.get('story_id')
        act_id = self.kwargs.get('act_id')
        episode_id = self.kwargs.get('pk')

        # 権限チェック
        story = get_object_or_404(AIStory, id=story_id, user=self.request.user)
        act = get_object_or_404(ActDetail, id=act_id, ai_story=story)

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
        act_id = self.kwargs.get('act_id')

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

        # 上に移動する場合（current_position > target_position）
        if current_position > target_position:
            # PostgreSQLのbulk update
            EpisodeDetail.objects.filter(
                act_id=act_id,
                episode_number__gte=target_position,
                episode_number__lt=current_position
            ).update(
                episode_number=models.F('episode_number') + 1
            )

        # 下に移動する場合（current_position < target_position）
        elif current_position < target_position:
            # PostgreSQLのbulk update
            EpisodeDetail.objects.filter(
                act_id=act_id,
                episode_number__gt=current_position,
                episode_number__lte=target_position
            ).update(
                episode_number=models.F('episode_number') - 1
            )

        # 対象エピソードを更新
        source_episode.episode_number = target_position
        source_episode.save()

        # 更新されたエピソード一覧を取得
        episodes = EpisodeDetail.objects.filter(act_id=act_id).order_by('episode_number')

        # レスポンスを返す
        return Response({
            'count': episodes.count(),
            'next': None,
            'previous': None,
            'results': EpisodeDetailSerializer(episodes, many=True).data,
            'status': 'success'
        })


class CreateEpisodeView(views.APIView):
    """
    エピソードの新規作成ビュー

    URL: /api/stories/{story_id}/acts/{act_id}/episodes/new/
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        story_id = self.kwargs.get('story_id')
        act_id = self.kwargs.get('act_id')

        # 権限チェック
        story = get_object_or_404(AIStory, id=story_id, user=request.user)
        act = get_object_or_404(ActDetail, id=act_id, ai_story=story)

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
