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
        fields = ('id', 'title', 'catchphrase', 'summary', 'user', 'status', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user')


class BasicSettingDataSerializer(serializers.ModelSerializer):
    """基本設定作成用データシリアライザ"""
    ai_story = AIStorySerializer(read_only=True)
    basic_setting_data = serializers.CharField(required=False, allow_blank=True)

    # 統合設定クリエーターのデータフィールド
    theme_data = serializers.JSONField(required=False, allow_null=True)
    time_place_data = serializers.JSONField(required=False, allow_null=True)
    world_setting_data = serializers.JSONField(required=False, allow_null=True)
    style_data = serializers.JSONField(required=False, allow_null=True)
    emotional_data = serializers.JSONField(required=False, allow_null=True)
    mystery_data = serializers.JSONField(required=False, allow_null=True)
    plot_data = serializers.JSONField(required=False, allow_null=True)
    integrated_data = serializers.JSONField(required=False, allow_null=True)

    class Meta:
        model = BasicSettingData
        fields = ('id', 'ai_story', 'basic_setting_data',
                 'theme_data', 'time_place_data', 'world_setting_data',
                 'style_data', 'emotional_data', 'mystery_data',
                 'plot_data', 'integrated_data',
                 'created_at', 'updated_at')
        read_only_fields = ('id', 'ai_story', 'created_at', 'updated_at')


class BasicSettingSerializer(serializers.ModelSerializer):
    """基本設定シリアライザ"""
    ai_story = AIStorySerializer(read_only=True)
    raw_content = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = BasicSetting
        fields = (
            'id', 'ai_story', 
            'title', 'summary', 'theme', 'theme_description', 'time_place',
            'world_setting', 'world_setting_basic', 'world_setting_features',
            'writing_style', 'writing_style_structure', 'writing_style_expression', 'writing_style_theme',
            'emotional', 'emotional_love', 'emotional_feelings', 'emotional_atmosphere', 'emotional_sensuality',
            'characters', 'key_items', 'mystery',
            'plot_pattern',
            'act1_title', 'act1_overview', 'act2_title', 'act2_overview', 'act3_title', 'act3_overview',
            'raw_content', 'is_edited', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'ai_story', 'created_at', 'updated_at')


class BasicSettingCreateSerializer(serializers.Serializer):
    """基本設定作成リクエストシリアライザ"""
    basic_setting_data_id = serializers.IntegerField(required=True)


class CharacterDetailSerializer(serializers.ModelSerializer):
    """キャラクター詳細シリアライザ"""
    ai_story = AIStorySerializer(read_only=True)

    class Meta:
        model = CharacterDetail
        fields = ('id', 'ai_story', 'name', 'role', 'age', 'gender', 'appearance',
                 'personality', 'background', 'motivation', 'relationship',
                 'development', 'raw_content', 'created_at', 'updated_at')
        read_only_fields = ('id', 'ai_story', 'created_at', 'updated_at')


class CharacterDetailCreateSerializer(serializers.Serializer):
    """キャラクター詳細作成リクエストシリアライザ"""
    character_name = serializers.CharField(required=True)
    character_role = serializers.CharField(required=True)


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
    content = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = EpisodeDetail
        fields = ('id', 'act', 'episode_number', 'title', 'content', 'raw_content',
                 'created_at', 'updated_at')
        read_only_fields = ('id', 'act', 'created_at', 'updated_at')


class EpisodeContentCreateSerializer(serializers.ModelSerializer):
    """エピソード本文作成シリアライザ"""
    content = serializers.CharField(required=False, allow_blank=True)
    raw_content = serializers.JSONField(required=False, allow_null=True)
    
    class Meta:
        model = EpisodeContent
        fields = ('id', 'episode', 'content', 'raw_content', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class EpisodeContentSerializer(serializers.ModelSerializer):
    """エピソード本文シリアライザ"""
    episode = EpisodeDetailSerializer(read_only=True)
    content = serializers.CharField(required=False, allow_blank=True)
    raw_content = serializers.JSONField(required=False, allow_null=True)
    title = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = EpisodeContent
        fields = ('id', 'episode', 'title', 'content', 'raw_content', 'created_at', 'updated_at')
        read_only_fields = ('id', 'episode', 'created_at', 'updated_at')


class EpisodeContentUpdateSerializer(serializers.ModelSerializer):
    """エピソード本文更新用シリアライザ"""
    content = serializers.CharField(required=True)
    raw_content = serializers.CharField(required=True)
    title = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = EpisodeContent
        fields = ('content', 'raw_content', 'title')


class DifyResponseSerializer(serializers.Serializer):
    """Dify API レスポンスシリアライザ"""
    id = serializers.CharField()
    answer = serializers.CharField()
    created_at = serializers.DateTimeField()


class IntegratedSettingCreatorSerializer(serializers.ModelSerializer):
    """統合設定クリエイターシリアライザ"""
    user = UserSerializer(read_only=True)
    story = AIStorySerializer(read_only=True, source='ai_story')
    basic_setting_data = serializers.CharField(required=True)
    integrated_data = serializers.JSONField(required=False, allow_null=True)

    class Meta:
        model = BasicSettingData
        fields = ('id', 'user', 'story', 'basic_setting_data', 'integrated_data', 'created_at')

    def create(self, validated_data):
        """
        統合設定クリエイターデータの保存
        フロントエンドから送られてきたMarkdownテキストと選択状態を基本設定データモデルに保存
        """
        user = validated_data.get('user')
        story = validated_data.get('story')
        basic_setting_data = validated_data.get('basic_setting_data', '')
        integrated_data = validated_data.get('integrated_data')

        # 基本設定データオブジェクトを作成または更新
        instance, created = BasicSettingData.objects.update_or_create(
            ai_story=story,
            defaults={
                'basic_setting_data': basic_setting_data,
                'integrated_data': integrated_data
            }
        )

        return instance


class BasicSettingRequestSerializer(serializers.Serializer):
    """基本設定リクエストシリアライザ"""
    basic_setting_data_id = serializers.IntegerField(required=True)


class CharacterDetailRequestSerializer(serializers.Serializer):
    """キャラクター詳細リクエストシリアライザ"""
    character_id = serializers.IntegerField(required=True)


class PlotDetailRequestSerializer(serializers.Serializer):
    """あらすじ詳細リクエストシリアライザ"""
    basic_setting_id = serializers.IntegerField(required=True)


class EpisodeDetailRequestSerializer(serializers.Serializer):
    """エピソード詳細リクエストシリアライザ"""
    episode_count = serializers.IntegerField(required=True, min_value=1, max_value=10)
    basic_setting_id = serializers.IntegerField(required=True)


class EpisodeNumberUpdateSerializer(serializers.Serializer):
    """エピソード番号更新シリアライザ"""
    episode_number = serializers.IntegerField(required=True, min_value=1)


class EpisodeCreateSerializer(serializers.Serializer):
    """エピソード作成シリアライザ"""
    title = serializers.CharField(required=True, max_length=255)
    content = serializers.CharField(required=True)


class EpisodeContentRequestSerializer(serializers.Serializer):
    """エピソード本文リクエストシリアライザ"""
    basic_setting_id = serializers.IntegerField(required=True)
    word_count = serializers.IntegerField(required=True, min_value=500, max_value=5000)


class TitleGenerateRequestSerializer(serializers.Serializer):
    """タイトル生成リクエストシリアライザ"""
    pass  # 追加パラメータなし


class TitleSelectRequestSerializer(serializers.Serializer):
    """タイトル選択リクエストシリアライザ"""
    title_id = serializers.IntegerField(required=True)


class TitleRequestSerializer(serializers.Serializer):
    """タイトル生成リクエストシリアライザ"""
    story_id = serializers.IntegerField(required=True)


class TitleGenerationRequestSerializer(serializers.Serializer):
    """タイトル・キャッチコピー生成リクエストシリアライザ"""
    basic_setting = serializers.CharField(required=True)
    target_content = serializers.CharField(required=True)
    title_type = serializers.CharField(required=True)  # "タイトル" または "キャッチコピー"


class SummaryGenerationRequestSerializer(serializers.Serializer):
    """サマリー生成リクエストシリアライザ"""
    target_content = serializers.CharField(required=True)
    word_count = serializers.IntegerField(required=True)


class TitleSerializer(serializers.ModelSerializer):
    """タイトルシリアライザ"""
    ai_story = AIStorySerializer(read_only=True)

    class Meta:
        model = BasicSetting
        fields = ('id', 'ai_story', 'title', 'created_at', 'updated_at')
        read_only_fields = ('id', 'ai_story', 'created_at', 'updated_at')


class APIRequestLogSerializer(serializers.ModelSerializer):
    """API実行ログシリアライザ"""
    class Meta:
        model = APIRequestLog
        fields = ('id', 'ai_story', 'api_name', 'request_body', 'response_body', 'status', 'created_at')
        read_only_fields = ('id', 'ai_story', 'api_name', 'request_body', 'response_body', 'status', 'created_at')
