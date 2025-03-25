"""
キャラクター詳細関連のビュー
"""
from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.db import transaction
import json

from ..models import AIStory, BasicSetting, CharacterDetail, APIRequestLog
from ..serializers import (
    CharacterDetailCreateSerializer, CharacterDetailSerializer,
    CharacterDetailRequestSerializer
)
from ..dify_api import DifyNovelAPI
from ..dify_streaming_api import DifyStreamingAPI, get_markdown_from_last_chunk
from ..utils import check_and_consume_credit


class CharacterDetailListCreateView(generics.ListCreateAPIView):
    """
    キャラクター詳細一覧・作成ビュー

    指定された小説のキャラクター詳細一覧を取得、または新規キャラクター詳細を作成します。
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CharacterDetailSerializer
    pagination_class = None

    def get_queryset(self):
        """指定された小説のキャラクター詳細一覧を取得"""
        story_id = self.kwargs.get('story_id')
        return CharacterDetail.objects.filter(
            ai_story_id=story_id,
            ai_story__user=self.request.user
        ).order_by('id')[:50]

    def perform_create(self, serializer):
        """キャラクター詳細作成時に小説を設定"""
        story_id = self.kwargs.get('story_id')
        story = get_object_or_404(AIStory, id=story_id, user=self.request.user)
        serializer.save(ai_story=story)


class CharacterDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    キャラクター詳細・更新・削除ビュー

    指定された小説のキャラクター詳細を取得、更新、または削除します。
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CharacterDetailSerializer
    lookup_url_kwarg = 'pk'

    def get_queryset(self):
        """指定された小説のキャラクター詳細を取得"""
        story_id = self.kwargs.get('story_id')
        return CharacterDetail.objects.filter(
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


class CreateCharacterDetailView(views.APIView):
    """
    キャラクター詳細生成ビュー

    Dify APを使って基本設定とキャラクター情報を元にキャラクター詳細を生成します。
    クレジットを消費します。
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        """キャラクター詳細を生成"""
        story_id = self.kwargs.get('story_id')

        # リクエストの検証
        serializer = CharacterDetailRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # キャラクターIDの取得
        character_id = serializer.validated_data['character_id']

        # キャラクターの取得とストーリー所属確認
        try:
            character = CharacterDetail.objects.get(id=character_id)
            if character.ai_story.id != story_id:
                return Response(
                    {'error': 'このキャラクターは指定されたストーリーに属していません。'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except CharacterDetail.DoesNotExist:
            return Response(
                {'error': '指定されたキャラクターが存在しません。'},
                status=status.HTTP_404_NOT_FOUND
            )

        # 基本設定の取得
        try:
            basic_setting = BasicSetting.objects.get(ai_story_id=story_id)
        except BasicSetting.DoesNotExist:
            return Response(
                {'error': '基本設定が存在しません。先に基本設定を作成してください。'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # クレジットの確認と消費
        success, message = check_and_consume_credit(request.user, 'character_detail')
        if not success:
            return Response({'error': message}, status=status.HTTP_402_PAYMENT_REQUIRED)

        # APIログの作成
        story = get_object_or_404(AIStory, id=story_id, user=request.user)
        api_log = APIRequestLog.objects.create(
            user=request.user,
            request_type='character_detail',
            ai_story=story,
            parameters={
                "basic_setting": basic_setting.raw_content,
                "character": character.raw_content,
            },
            credit_cost=2
        )

        try:
            # ストリーミングAPIクライアントの初期化
            api = DifyStreamingAPI()
            
            # 最後のチャンクを保持する変数
            last_chunk = None
            
            # ストリーミングAPIリクエストを実行し、すべてのチャンクを内部で処理
            for chunk in api.create_character_detail_stream(
                basic_setting=basic_setting.raw_content,
                character_data=character.raw_content,
                user_id=str(request.user.id)
            ):
                # 最後のチャンクを更新
                last_chunk = chunk
            
            # 最後のチャンクからMarkdownコンテンツを抽出
            if last_chunk:
                content = get_markdown_from_last_chunk(last_chunk)
                
                # キャラクター詳細を更新
                character.appearance = content
                character.personality = content
                character.background = content
                character.motivation = content
                character.relationship = content
                character.development = content
                character.raw_content = content
                character.save()

                # APIログの更新
                api_log.is_success = True
                api_log.response = content
                api_log.save()

                # レスポンスを返す
                result_serializer = CharacterDetailSerializer(character)
                return Response(result_serializer.data, status=status.HTTP_200_OK)
            else:
                # 最後のチャンクが取得できなかった場合
                raise ValueError("有効なレスポンスが取得できませんでした")

        except Exception as e:
            # エラーログ
            api_log.is_success = False
            api_log.response = str(e)
            api_log.save()
            return Response(
                {'error': 'キャラクター詳細の生成に失敗しました', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
