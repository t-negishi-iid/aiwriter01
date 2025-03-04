"""
タイトル生成関連のビュー
"""
from rest_framework import views, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction

from ..models import (
    AIStory, BasicSetting, CharacterDetail, ActDetail,
    EpisodeDetail, EpisodeContent, APIRequestLog
)
from ..serializers import TitleRequestSerializer
from ..dify_api import DifyNovelAPI
from ..utils import check_and_consume_credit


class GenerateTitleView(views.APIView):
    """
    タイトル生成ビュー

    エピソード、幕、または小説のタイトルを生成します。
    クレジットを消費します。
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        """タイトルを生成"""
        story_id = self.kwargs.get('story_id')
        story = get_object_or_404(AIStory, id=story_id, user=request.user)

        # リクエストの検証
        serializer = TitleRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # リクエストパラメータの取得
        target_type = serializer.validated_data['target_type']
        target_id = serializer.validated_data['target_id']

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

        # あらすじ詳細（幕）の取得
        acts = ActDetail.objects.filter(ai_story=story).order_by('act_number')
        if not acts.exists():
            return Response(
                {'error': 'あらすじ詳細が存在しません。先にあらすじ詳細を作成してください。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ターゲットとなるコンテンツを取得
        target_content = ""
        target_object = None
        api_type = ""

        if target_type == 'episode':
            # エピソードのタイトル生成
            try:
                episode = EpisodeDetail.objects.get(id=target_id)
                if episode.act.ai_story_id != story.id:
                    return Response(
                        {'error': '指定されたエピソードはこの小説のものではありません。'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                # エピソードの本文があれば、それを使用
                try:
                    episode_content = EpisodeContent.objects.get(episode=episode)
                    target_content = episode_content.content
                except EpisodeContent.DoesNotExist:
                    # 本文がなければ、エピソード詳細を使用
                    target_content = episode.content
                target_object = episode
                api_type = 'title_episode'
            except EpisodeDetail.DoesNotExist:
                return Response(
                    {'error': '指定されたエピソードが存在しません。'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        elif target_type == 'act':
            # 幕のタイトル生成
            try:
                act = ActDetail.objects.get(id=target_id, ai_story=story)
                target_content = act.content
                target_object = act
                api_type = 'title_act'
            except ActDetail.DoesNotExist:
                return Response(
                    {'error': '指定された幕が存在しません。'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        elif target_type == 'novel':
            # 小説のタイトル生成
            # すべてのエピソード本文を結合
            episode_contents = EpisodeContent.objects.filter(
                episode__act__ai_story=story
            )
            if not episode_contents.exists():
                return Response(
                    {'error': 'エピソード本文が存在しません。先にエピソード本文を作成してください。'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            combined_content = "\n\n".join([ec.content for ec in episode_contents])
            target_content = combined_content
            target_object = story
            api_type = 'title_novel'

        else:
            return Response(
                {'error': '無効なターゲットタイプです。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # クレジットの確認と消費
        success, message = check_and_consume_credit(request.user, api_type)
        if not success:
            return Response({'error': message}, status=status.HTTP_402_PAYMENT_REQUIRED)

        # APIリクエスト
        api = DifyNovelAPI()

        # キャラクター詳細データの準備
        character_details_data = [
            {
                'name': char.name,
                'role': char.role,
                'appearance': char.appearance,
                'personality': char.personality,
                'background': char.background,
                'motivation': char.motivation,
                'relationship': char.relationship,
                'development': char.development
            }
            for char in character_details
        ]

        # 幕詳細データの準備
        acts_data = [
            {
                'act_number': act.act_number,
                'title': act.title,
                'content': act.content
            }
            for act in acts
        ]

        # APIログの作成
        credit_cost = 1 if target_type in ['episode', 'act'] else 3
        api_log = APIRequestLog.objects.create(
            user=request.user,
            request_type=api_type,
            ai_story=story,
            parameters={
                'target_type': target_type,
                'target_id': target_id
            },
            credit_cost=credit_cost
        )

        try:
            # 同期APIリクエスト
            response = api.generate_title(
                basic_setting=basic_setting.raw_content,
                character_details=character_details_data,
                plot_details=acts_data,
                target_content=target_content,
                target_type=target_type,
                user_id=str(request.user.id),
                blocking=True
            )

            # レスポンスの検証
            if 'error' in response:
                api_log.is_success = False
                api_log.response = str(response)
                api_log.save()
                return Response(
                    {'error': 'タイトルの生成に失敗しました', 'details': response},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            title = response['answer']

            # タイトルを更新
            if target_type == 'episode':
                # エピソードのタイトル更新
                target_object.title = title
                target_object.save()
                # エピソード本文があれば、それも更新
                try:
                    episode_content = EpisodeContent.objects.get(episode=target_object)
                    episode_content.title = title
                    episode_content.save()
                except EpisodeContent.DoesNotExist:
                    pass
            elif target_type == 'act':
                # 幕のタイトル更新
                target_object.title = title
                target_object.save()
            elif target_type == 'novel':
                # 小説のタイトル更新
                target_object.title = title
                target_object.save()

            # APIログの更新
            api_log.is_success = True
            api_log.response = title
            api_log.save()

            # レスポンスを返す
            return Response({
                'title': title,
                'target_type': target_type,
                'target_id': target_id
            }, status=status.HTTP_200_OK)

        except Exception as e:
            # エラーログ
            api_log.is_success = False
            api_log.response = str(e)
            api_log.save()
            return Response(
                {'error': 'タイトルの生成に失敗しました', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
