"""
AI小説執筆支援システムのシリアライザ
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile, CreditHistory, AIStory, BasicSettingData,
    BasicSetting, CharacterDetail, ActDetail, EpisodeDetail,
    EpisodeContent, APIRequestLog
)


class UserSerializer(serializers.ModelSerializer):
    """ユーザーシリアライザ"""
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
        read_only_fields = ('id',)


class UserProfileSerializer(serializers.ModelSerializer):
    """ユーザープロファイルシリアライザ"""
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = ('id', 'user', 'credit', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'credit')


class CreditHistorySerializer(serializers.ModelSerializer):
    """クレジット履歴シリアライザ"""
    user = UserSerializer(read_only=True)

    class Meta:
        model = CreditHistory
        fields = ('id', 'user', 'amount', 'balance', 'action_type',
                 'description', 'created_at')
        read_only_fields = ('id', 'user', 'amount', 'balance',
                           'action_type', 'created_at')


class AIStorySerializer(serializers.ModelSerializer):
    """AI小説シリアライザ"""
    user = UserSerializer(read_only=True)

    class Meta:
        model = AIStory
        fields = ('id', 'title', 'user', 'status', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user')


class BasicSettingDataCreateSerializer(serializers.ModelSerializer):
    """基本設定作成用データ作成シリアライザ"""
    theme = serializers.CharField(required=True)
    time_and_place = serializers.CharField(required=True)
    world_setting = serializers.CharField(required=True)
    plot_pattern = serializers.CharField(required=True)
    love_expressions = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )
    emotional_expressions = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )
    atmosphere = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )
    sensual_expressions = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )
    mental_elements = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )
    social_elements = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )
    past_mysteries = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )

    class Meta:
        model = BasicSettingData
        fields = ('id', 'ai_story', 'theme', 'time_and_place', 'world_setting',
                 'plot_pattern', 'love_expressions', 'emotional_expressions',
                 'atmosphere', 'sensual_expressions', 'mental_elements',
                 'social_elements', 'past_mysteries', 'json_content',
                 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at', 'json_content')


class BasicSettingDataSerializer(serializers.ModelSerializer):
    """基本設定作成用データシリアライザ"""
    ai_story = AIStorySerializer(read_only=True)
    formatted_content = serializers.SerializerMethodField()

    class Meta:
        model = BasicSettingData
        fields = ('id', 'ai_story', 'theme', 'time_and_place', 'world_setting',
                 'plot_pattern', 'love_expressions', 'emotional_expressions',
                 'atmosphere', 'sensual_expressions', 'mental_elements',
                 'social_elements', 'past_mysteries', 'json_content',
                 'formatted_content', 'created_at', 'updated_at')
        read_only_fields = ('id', 'ai_story', 'created_at', 'updated_at')

    def get_formatted_content(self, obj):
        """フォーマット済みコンテンツを取得"""
        return obj.get_formatted_content()


class BasicSettingCreateSerializer(serializers.ModelSerializer):
    """基本設定作成シリアライザ"""
    class Meta:
        model = BasicSetting
        fields = ('id', 'ai_story', 'story_setting', 'characters', 'plot_overview',
                 'act1_overview', 'act2_overview', 'act3_overview', 'raw_content',
                 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class BasicSettingSerializer(serializers.ModelSerializer):
    """基本設定シリアライザ"""
    ai_story = AIStorySerializer(read_only=True)

    class Meta:
        model = BasicSetting
        fields = ('id', 'ai_story', 'story_setting', 'characters', 'plot_overview',
                 'act1_overview', 'act2_overview', 'act3_overview', 'raw_content',
                 'created_at', 'updated_at')
        read_only_fields = ('id', 'ai_story', 'created_at', 'updated_at')


class CharacterDetailCreateSerializer(serializers.ModelSerializer):
    """キャラクター詳細作成シリアライザ"""
    class Meta:
        model = CharacterDetail
        fields = ('id', 'ai_story', 'name', 'role', 'age', 'gender', 'appearance',
                 'personality', 'background', 'motivation', 'relationship',
                 'development', 'raw_content', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class CharacterDetailSerializer(serializers.ModelSerializer):
    """キャラクター詳細シリアライザ"""
    ai_story = AIStorySerializer(read_only=True)

    class Meta:
        model = CharacterDetail
        fields = ('id', 'ai_story', 'name', 'role', 'age', 'gender', 'appearance',
                 'personality', 'background', 'motivation', 'relationship',
                 'development', 'raw_content', 'created_at', 'updated_at')
        read_only_fields = ('id', 'ai_story', 'created_at', 'updated_at')


class ActDetailCreateSerializer(serializers.ModelSerializer):
    """幕詳細作成シリアライザ"""
    class Meta:
        model = ActDetail
        fields = ('id', 'ai_story', 'act_number', 'title', 'content', 'raw_content',
                 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class ActDetailSerializer(serializers.ModelSerializer):
    """幕詳細シリアライザ"""
    ai_story = AIStorySerializer(read_only=True)

    class Meta:
        model = ActDetail
        fields = ('id', 'ai_story', 'act_number', 'title', 'content', 'raw_content',
                 'created_at', 'updated_at')
        read_only_fields = ('id', 'ai_story', 'created_at', 'updated_at')


class EpisodeDetailCreateSerializer(serializers.ModelSerializer):
    """エピソード詳細作成シリアライザ"""
    class Meta:
        model = EpisodeDetail
        fields = ('id', 'act', 'episode_number', 'title', 'content', 'raw_content',
                 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class EpisodeDetailSerializer(serializers.ModelSerializer):
    """エピソード詳細シリアライザ"""
    act = ActDetailSerializer(read_only=True)

    class Meta:
        model = EpisodeDetail
        fields = ('id', 'act', 'episode_number', 'title', 'content', 'raw_content',
                 'created_at', 'updated_at')
        read_only_fields = ('id', 'act', 'created_at', 'updated_at')


class EpisodeContentCreateSerializer(serializers.ModelSerializer):
    """エピソード本文作成シリアライザ"""
    class Meta:
        model = EpisodeContent
        fields = ('id', 'episode', 'title', 'content', 'word_count', 'raw_content',
                 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class EpisodeContentSerializer(serializers.ModelSerializer):
    """エピソード本文シリアライザ"""
    episode = EpisodeDetailSerializer(read_only=True)

    class Meta:
        model = EpisodeContent
        fields = ('id', 'episode', 'title', 'content', 'word_count', 'raw_content',
                 'created_at', 'updated_at')
        read_only_fields = ('id', 'episode', 'created_at', 'updated_at')


class APIRequestLogSerializer(serializers.ModelSerializer):
    """API実行ログシリアライザ"""
    user = UserSerializer(read_only=True)
    ai_story = AIStorySerializer(read_only=True)

    class Meta:
        model = APIRequestLog
        fields = ('id', 'user', 'request_type', 'ai_story', 'parameters',
                 'response', 'is_success', 'credit_cost', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'request_type', 'ai_story', 'parameters',
                           'response', 'is_success', 'credit_cost', 'created_at', 'updated_at')


# リクエスト用シリアライザ
class BasicSettingDataRequestSerializer(serializers.Serializer):
    """基本設定作成用データリクエストシリアライザ"""
    theme = serializers.CharField(required=True)
    timeAndPlace = serializers.CharField(required=True)
    worldSetting = serializers.CharField(required=True)
    plotPattern = serializers.CharField(required=True)
    loveExpressions = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    emotionalExpressions = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    atmosphere = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    sensualExpressions = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    mentalElements = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    socialElements = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    pastMysteries = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )


class BasicSettingRequestSerializer(serializers.Serializer):
    """基本設定リクエストシリアライザ"""
    basic_setting_data_id = serializers.IntegerField(required=True)


class CharacterDetailRequestSerializer(serializers.Serializer):
    """キャラクター詳細リクエストシリアライザ"""
    character_name = serializers.CharField(required=True)
    character_role = serializers.CharField(required=True)


class PlotDetailRequestSerializer(serializers.Serializer):
    """あらすじ詳細リクエストシリアライザ"""
    pass  # 追加パラメータなし


class EpisodeDetailRequestSerializer(serializers.Serializer):
    """エピソード詳細リクエストシリアライザ"""
    act_id = serializers.IntegerField(required=True)
    episode_count = serializers.IntegerField(required=True, min_value=1, max_value=10)


class EpisodeContentRequestSerializer(serializers.Serializer):
    """エピソード本文リクエストシリアライザ"""
    episode_id = serializers.IntegerField(required=True)
    word_count = serializers.IntegerField(required=True, min_value=500, max_value=10000)


class TitleRequestSerializer(serializers.Serializer):
    """タイトル生成リクエストシリアライザ"""
    target_type = serializers.ChoiceField(
        choices=['episode', 'act', 'novel'],
        required=True
    )
    target_id = serializers.IntegerField(required=True)


# レスポンス用シリアライザ
class OptionsResponseSerializer(serializers.Serializer):
    """選択肢レスポンスシリアライザ"""
    themes = serializers.ListField(child=serializers.CharField())
    timeAndPlaces = serializers.ListField(child=serializers.CharField())
    worldSettings = serializers.ListField(child=serializers.CharField())
    plotPatterns = serializers.ListField(child=serializers.CharField())
    loveExpressions = serializers.ListField(child=serializers.CharField())
    emotionalExpressions = serializers.ListField(child=serializers.CharField())
    atmosphere = serializers.ListField(child=serializers.CharField())
    sensualExpressions = serializers.ListField(child=serializers.CharField())
    mentalElements = serializers.ListField(child=serializers.CharField())
    socialElements = serializers.ListField(child=serializers.CharField())
    pastMysteries = serializers.ListField(child=serializers.CharField())


class BasicSettingDataPreviewSerializer(serializers.Serializer):
    """基本設定作成用データプレビューシリアライザ"""
    preview = serializers.CharField()


class DifyResponseSerializer(serializers.Serializer):
    """Dify APIレスポンスシリアライザ"""
    content = serializers.CharField()
    task_id = serializers.CharField(required=False)
