"""
ビュー定義
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db import transaction

from .models import (
    UserProfile, Credit, CreditTransaction, AIStory,
    BasicSettingData, BasicSetting, CharacterDetail,
    PlotDetail, EpisodeDetail, EpisodeContent, ApiUsageLog
)
from .serializers import (
    UserSerializer, UserProfileSerializer, CreditSerializer,
    CreditTransactionSerializer, AIStorySerializer, AIStoryDetailSerializer,
    BasicSettingDataSerializer, BasicSettingSerializer,
    CharacterDetailSerializer, PlotDetailSerializer,
    EpisodeDetailSerializer, EpisodeDetailWithContentSerializer,
    EpisodeContentSerializer
)
from novel_gen.dify_api import DifyNovelAPI


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """ユーザーAPI（読み取り専用）"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['get'])
    def profile(self, request, pk=None):
        """ユーザープロフィールを取得"""
        user = self.get_object()
        profile = get_object_or_404(UserProfile, user=user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def credit(self, request, pk=None):
        """ユーザークレジットを取得"""
        user = self.get_object()
        credit = get_object_or_404(Credit, user=user)
        serializer = CreditSerializer(credit)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def credit_transactions(self, request, pk=None):
        """ユーザーのクレジット取引履歴を取得"""
        user = self.get_object()
        transactions = CreditTransaction.objects.filter(user=user)
        page = self.paginate_queryset(transactions)
        if page is not None:
            serializer = CreditTransactionSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = CreditTransactionSerializer(transactions, many=True)
        return Response(serializer.data)


class AIStoryViewSet(viewsets.ModelViewSet):
    """AI小説API"""
    serializer_class = AIStorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """ユーザーに紐づく小説のみ取得"""
        return AIStory.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        """アクションに応じてシリアライザを切り替え"""
        if self.action == 'retrieve':
            return AIStoryDetailSerializer
        return self.serializer_class

    def perform_create(self, serializer):
        """作成時にユーザーを自動設定"""
        serializer.save(user=self.request.user)


class BasicSettingDataViewSet(viewsets.ModelViewSet):
    """基本設定作成用データAPI"""
    serializer_class = BasicSettingDataSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """ユーザーに紐づく基本設定作成用データのみ取得"""
        return BasicSettingData.objects.filter(ai_story__user=self.request.user)

    @action(detail=True, methods=['post'])
    def generate_basic_setting(self, request, pk=None):
        """
        基本設定作成用データから基本設定を自動生成
        """
        basic_setting_data = self.get_object()
        user = request.user

        # クレジットチェック
        if not user.credit.has_sufficient_credit(1):
            return Response(
                {"error": "クレジットが不足しています"},
                status=status.HTTP_402_PAYMENT_REQUIRED
            )

        # APIクライアント初期化
        dify_api = DifyNovelAPI()

        try:
            with transaction.atomic():
                # APIリクエスト
                formatted_content = basic_setting_data.get_formatted_content()
                result = dify_api.create_basic_setting(formatted_content)

                # 基本設定の保存
                basic_setting, created = BasicSetting.objects.update_or_create(
                    ai_story=basic_setting_data.ai_story,
                    defaults={
                        'setting_data': basic_setting_data,
                        'content': result.get('answer', ''),
                        'is_edited': False
                    }
                )

                # クレジット消費
                user.credit.use_credit(1)

                # ログ記録
                ApiUsageLog.objects.create(
                    user=user,
                    ai_story=basic_setting_data.ai_story,
                    api_type='basic_setting',
                    credit_used=1,
                    request_data=formatted_content,
                    response_data=result.get('answer', ''),
                    is_success=True
                )

                # レスポンス
                serializer = BasicSettingSerializer(basic_setting)
                return Response(serializer.data)

        except Exception as e:
            return Response(
                {"error": f"API呼び出しに失敗しました: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BasicSettingViewSet(viewsets.ModelViewSet):
    """基本設定API"""
    serializer_class = BasicSettingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """ユーザーに紐づく基本設定のみ取得"""
        return BasicSetting.objects.filter(ai_story__user=self.request.user)

    @action(detail=True, methods=['post'])
    def extract_characters(self, request, pk=None):
        """基本設定から登場人物を抽出"""
        basic_setting = self.get_object()

        # 実際の実装では、内容から登場人物を抽出するロジックを追加
        characters = []

        # 仮実装：登場人物抽出（実際は正規表現やAIを使って抽出）
        for i in range(1, 4):  # 例として3人の登場人物を作成
            character = CharacterDetail.objects.create(
                ai_story=basic_setting.ai_story,
                name=f"キャラクター{i}",
                role="主人公" if i == 1 else "サブキャラクター",
                summary=f"キャラクター{i}の概要",
                is_edited=False
            )
            characters.append(character)

        serializer = CharacterDetailSerializer(characters, many=True)
        return Response(serializer.data)


class CharacterDetailViewSet(viewsets.ModelViewSet):
    """キャラクター詳細API"""
    serializer_class = CharacterDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """ユーザーに紐づくキャラクター詳細のみ取得"""
        return CharacterDetail.objects.filter(ai_story__user=self.request.user)

    @action(detail=True, methods=['post'])
    def generate_character_detail(self, request, pk=None):
        """
        キャラクター詳細を生成
        """
        character = self.get_object()
        user = request.user
        ai_story = character.ai_story

        # クレジットチェック
        if not user.credit.has_sufficient_credit(2):
            return Response(
                {"error": "クレジットが不足しています"},
                status=status.HTTP_402_PAYMENT_REQUIRED
            )

        # 基本設定が存在するか確認
        try:
            basic_setting = BasicSetting.objects.get(ai_story=ai_story)
        except BasicSetting.DoesNotExist:
            return Response(
                {"error": "基本設定が存在しません"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # APIクライアント初期化
        dify_api = DifyNovelAPI()

        try:
            with transaction.atomic():
                # APIリクエスト用データ準備
                basic_setting_content = basic_setting.content
                character_summary = {
                    "名前": character.name,
                    "役割": character.role,
                    "概要": character.summary
                }

                # APIリクエスト
                result = dify_api.create_character_detail(basic_setting_content, character_summary)

                # キャラクター詳細の更新
                character.detail = result.get('answer', '')
                character.is_edited = False
                character.save()

                # クレジット消費
                user.credit.use_credit(2)

                # ログ記録
                ApiUsageLog.objects.create(
                    user=user,
                    ai_story=ai_story,
                    api_type='character_detail',
                    credit_used=2,
                    request_data=str(character_summary),
                    response_data=result.get('answer', ''),
                    is_success=True
                )

                # レスポンス
                serializer = CharacterDetailSerializer(character)
                return Response(serializer.data)

        except Exception as e:
            return Response(
                {"error": f"API呼び出しに失敗しました: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PlotDetailViewSet(viewsets.ModelViewSet):
    """あらすじ詳細API"""
    serializer_class = PlotDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """ユーザーに紐づくあらすじ詳細のみ取得"""
        return PlotDetail.objects.filter(ai_story__user=self.request.user)

    @action(detail=False, methods=['post'])
    def generate_plot_details(self, request):
        """
        あらすじ詳細を生成
        """
        ai_story_id = request.data.get('ai_story')
        if not ai_story_id:
            return Response(
                {"error": "ai_storyパラメータが必要です"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            ai_story = AIStory.objects.get(id=ai_story_id, user=request.user)
        except AIStory.DoesNotExist:
            return Response(
                {"error": "指定されたAI小説が見つかりません"},
                status=status.HTTP_404_NOT_FOUND
            )

        user = request.user

        # クレジットチェック
        if not user.credit.has_sufficient_credit(2):
            return Response(
                {"error": "クレジットが不足しています"},
                status=status.HTTP_402_PAYMENT_REQUIRED
            )

        # 基本設定とキャラクター詳細が存在するか確認
        try:
            basic_setting = BasicSetting.objects.get(ai_story=ai_story)
            characters = CharacterDetail.objects.filter(ai_story=ai_story)
            if not characters.exists():
                return Response(
                    {"error": "キャラクター詳細が存在しません"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except BasicSetting.DoesNotExist:
            return Response(
                {"error": "基本設定が存在しません"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # APIクライアント初期化
        dify_api = DifyNovelAPI()

        try:
            with transaction.atomic():
                # APIリクエスト用データ準備
                basic_setting_content = basic_setting.content
                character_details = [
                    {
                        "名前": char.name,
                        "役割": char.role,
                        "詳細": char.detail
                    }
                    for char in characters
                ]

                # APIリクエスト
                result = dify_api.create_plot_detail(basic_setting_content, character_details)

                # レスポンスの内容を3幕に分割（実際の実装ではAIの返答形式に合わせて調整）
                plot_sections = result.get('answer', '').split('## 第')
                if len(plot_sections) >= 4:  # 最初の部分と3幕
                    plot_sections = plot_sections[1:]  # 最初の部分を除外
                else:
                    # 3幕に分割できない場合はダミーデータを作成
                    plot_sections = [
                        "1幕\n導入部分です。",
                        "2幕\n展開部分です。",
                        "3幕\n結末部分です。"
                    ]

                # 既存のプロットを削除
                PlotDetail.objects.filter(ai_story=ai_story).delete()

                # あらすじ詳細の保存
                plots = []
                for i, content in enumerate(plot_sections[:3], 1):
                    title = f"第{i}幕"
                    if ":" in content.split("\n")[0]:
                        title_part = content.split("\n")[0].split(":", 1)[1].strip()
                        if title_part:
                            title = title_part

                    plots.append(PlotDetail.objects.create(
                        ai_story=ai_story,
                        act=i,
                        title=title,
                        content=content,
                        is_edited=False
                    ))

                # クレジット消費
                user.credit.use_credit(2)

                # ログ記録
                ApiUsageLog.objects.create(
                    user=user,
                    ai_story=ai_story,
                    api_type='plot_detail',
                    credit_used=2,
                    request_data=str({
                        "basic_setting": basic_setting_content,
                        "characters": character_details
                    }),
                    response_data=result.get('answer', ''),
                    is_success=True
                )

                # レスポンス
                serializer = PlotDetailSerializer(plots, many=True)
                return Response(serializer.data)

        except Exception as e:
            return Response(
                {"error": f"API呼び出しに失敗しました: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EpisodeDetailViewSet(viewsets.ModelViewSet):
    """エピソード詳細API"""
    serializer_class = EpisodeDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """ユーザーに紐づくエピソード詳細のみ取得"""
        return EpisodeDetail.objects.filter(plot__ai_story__user=self.request.user)

    def get_serializer_class(self):
        """アクションに応じてシリアライザを切り替え"""
        if self.action in ['create', 'update', 'partial_update']:
            return EpisodeDetailWithContentSerializer
        return self.serializer_class

    @action(detail=False, methods=['post'])
    def generate_episode_details(self, request):
        """
        エピソード詳細を生成
        """
        plot_id = request.data.get('plot')
        episode_count = request.data.get('episode_count', 3)

        if not plot_id:
            return Response(
                {"error": "plotパラメータが必要です"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            episode_count = int(episode_count)
            if episode_count < 1:
                raise ValueError("エピソード数は1以上である必要があります")
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            plot = PlotDetail.objects.get(id=plot_id, ai_story__user=request.user)
        except PlotDetail.DoesNotExist:
            return Response(
                {"error": "指定されたあらすじ詳細が見つかりません"},
                status=status.HTTP_404_NOT_FOUND
            )

        user = request.user
        ai_story = plot.ai_story

        # クレジットチェック
        if not user.credit.has_sufficient_credit(3):
            return Response(
                {"error": "クレジットが不足しています"},
                status=status.HTTP_402_PAYMENT_REQUIRED
            )

        # 基本設定とキャラクター詳細、あらすじ詳細が存在するか確認
        try:
            basic_setting = BasicSetting.objects.get(ai_story=ai_story)
            characters = CharacterDetail.objects.filter(ai_story=ai_story)
            plots = PlotDetail.objects.filter(ai_story=ai_story)

            if not characters.exists():
                return Response(
                    {"error": "キャラクター詳細が存在しません"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if plots.count() < 3:
                return Response(
                    {"error": "3つのあらすじ詳細が必要です"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except BasicSetting.DoesNotExist:
            return Response(
                {"error": "基本設定が存在しません"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # APIクライアント初期化
        dify_api = DifyNovelAPI()

        try:
            with transaction.atomic():
                # APIリクエスト用データ準備
                basic_setting_content = basic_setting.content
                character_details = [
                    {
                        "名前": char.name,
                        "役割": char.role,
                        "詳細": char.detail
                    }
                    for char in characters
                ]
                plot_details = [
                    {
                        "幕": p.get_act_display(),
                        "タイトル": p.title,
                        "内容": p.content
                    }
                    for p in plots
                ]

                # 詳細化するプロットの内容
                target_plot = {
                    "幕": plot.get_act_display(),
                    "タイトル": plot.title,
                    "内容": plot.content
                }

                # APIリクエスト
                result = dify_api.create_episode_details(
                    basic_setting_content,
                    character_details,
                    plot_details,
                    target_plot,
                    episode_count
                )

                # 既存のエピソードを削除
                EpisodeDetail.objects.filter(plot=plot).delete()

                # レスポンスからエピソードに分割
                episode_sections = result.get('answer', '').split('## エピソード')
                if len(episode_sections) > 1:
                    episode_sections = episode_sections[1:]  # 最初の部分を除外
                else:
                    # エピソードに分割できない場合はダミーデータを作成
                    episode_sections = [f"{i}: ダミーエピソード{i}の内容です。" for i in range(1, episode_count + 1)]

                # エピソード詳細の保存
                episodes = []
                for i, content in enumerate(episode_sections[:episode_count], 1):
                    title = f"エピソード{i}"
                    if ":" in content.split("\n")[0]:
                        title_part = content.split("\n")[0].split(":", 1)[1].strip()
                        if title_part:
                            title = title_part

                    episodes.append(EpisodeDetail.objects.create(
                        plot=plot,
                        number=i,
                        title=title,
                        content=content,
                        is_edited=False
                    ))

                # クレジット消費
                user.credit.use_credit(3)

                # ログ記録
                ApiUsageLog.objects.create(
                    user=user,
                    ai_story=ai_story,
                    api_type='episode_detail',
                    credit_used=3,
                    request_data=str({
                        "basic_setting": basic_setting_content,
                        "characters": character_details,
                        "plots": plot_details,
                        "target_plot": target_plot,
                        "episode_count": episode_count
                    }),
                    response_data=result.get('answer', ''),
                    is_success=True
                )

                # レスポンス
                serializer = EpisodeDetailSerializer(episodes, many=True)
                return Response(serializer.data)

        except Exception as e:
            return Response(
                {"error": f"API呼び出しに失敗しました: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EpisodeContentViewSet(viewsets.ModelViewSet):
    """エピソード本文API"""
    serializer_class = EpisodeContentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """ユーザーに紐づくエピソード本文のみ取得"""
        return EpisodeContent.objects.filter(episode__plot__ai_story__user=self.request.user)

    @action(detail=False, methods=['post'])
    def generate_episode_content(self, request):
        """
        エピソード本文を生成
        """
        episode_id = request.data.get('episode')
        word_count = request.data.get('word_count', 2000)

        if not episode_id:
            return Response(
                {"error": "episodeパラメータが必要です"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            word_count = int(word_count)
            if word_count < 500 or word_count > 10000:
                raise ValueError("文字数は500～10000の範囲で指定してください")
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            episode = EpisodeDetail.objects.get(id=episode_id, plot__ai_story__user=request.user)
        except EpisodeDetail.DoesNotExist:
            return Response(
                {"error": "指定されたエピソード詳細が見つかりません"},
                status=status.HTTP_404_NOT_FOUND
            )

        user = request.user
        ai_story = episode.plot.ai_story

        # クレジットチェック
        if not user.credit.has_sufficient_credit(4):
            return Response(
                {"error": "クレジットが不足しています"},
                status=status.HTTP_402_PAYMENT_REQUIRED
            )

        # 基本設定とキャラクター詳細、あらすじ詳細が存在するか確認
        try:
            basic_setting = BasicSetting.objects.get(ai_story=ai_story)
            characters = CharacterDetail.objects.filter(ai_story=ai_story)
            plots = PlotDetail.objects.filter(ai_story=ai_story)

            if not characters.exists():
                return Response(
                    {"error": "キャラクター詳細が存在しません"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if plots.count() < 3:
                return Response(
                    {"error": "3つのあらすじ詳細が必要です"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except BasicSetting.DoesNotExist:
            return Response(
                {"error": "基本設定が存在しません"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # APIクライアント初期化
        dify_api = DifyNovelAPI()

        try:
            with transaction.atomic():
                # APIリクエスト用データ準備
                basic_setting_content = basic_setting.content
                character_details = [
                    {
                        "名前": char.name,
                        "役割": char.role,
                        "詳細": char.detail
                    }
                    for char in characters
                ]
                plot_details = [
                    {
                        "幕": p.get_act_display(),
                        "タイトル": p.title,
                        "内容": p.content
                    }
                    for p in plots
                ]

                # 対象エピソードの内容
                target_episode = {
                    "幕": episode.plot.get_act_display(),
                    "エピソード番号": episode.number,
                    "タイトル": episode.title,
                    "内容": episode.content
                }

                # APIリクエスト
                result = dify_api.create_episode_content(
                    basic_setting_content,
                    character_details,
                    plot_details,
                    target_episode,
                    word_count
                )

                # エピソード本文の保存
                content, created = EpisodeContent.objects.update_or_create(
                    episode=episode,
                    defaults={
                        'content': result.get('answer', ''),
                        'is_edited': False
                    }
                )

                # クレジット消費
                user.credit.use_credit(4)

                # ログ記録
                ApiUsageLog.objects.create(
                    user=user,
                    ai_story=ai_story,
                    api_type='episode_content',
                    credit_used=4,
                    request_data=str({
                        "basic_setting": basic_setting_content,
                        "characters": character_details,
                        "plots": plot_details,
                        "target_episode": target_episode,
                        "word_count": word_count
                    }),
                    response_data=result.get('answer', ''),
                    is_success=True
                )

                # レスポンス
                serializer = EpisodeContentSerializer(content)
                return Response(serializer.data)

        except Exception as e:
            return Response(
                {"error": f"API呼び出しに失敗しました: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
