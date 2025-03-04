"""
シリアライザー定義
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile, Credit, CreditTransaction, AIStory,
    BasicSettingData, BasicSetting, CharacterDetail,
    PlotDetail, EpisodeDetail, EpisodeContent
)


class UserSerializer(serializers.ModelSerializer):
    """ユーザーシリアライザー"""
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'date_joined')
        read_only_fields = ('date_joined',)


class UserProfileSerializer(serializers.ModelSerializer):
    """ユーザープロフィールシリアライザー"""
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = UserProfile
        fields = ('id', 'username', 'bio', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')


class CreditSerializer(serializers.ModelSerializer):
    """クレジットシリアライザー"""
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Credit
        fields = ('id', 'username', 'amount', 'updated_at')
        read_only_fields = ('amount', 'updated_at')


class CreditTransactionSerializer(serializers.ModelSerializer):
    """クレジット取引履歴シリアライザー"""
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = CreditTransaction
        fields = ('id', 'username', 'amount', 'transaction_type', 'description', 'created_at')
        read_only_fields = ('created_at',)


class BasicSettingDataSerializer(serializers.ModelSerializer):
    """基本設定作成用データシリアライザー"""
    formatted_content = serializers.SerializerMethodField()

    class Meta:
        model = BasicSettingData
        fields = (
            'id', 'ai_story', 'theme', 'time_and_place', 'world_setting', 'plot_pattern',
            'love_expressions', 'emotional_expressions', 'atmosphere', 'sensual_expressions',
            'mental_elements', 'social_elements', 'past_mysteries',
            'formatted_content', 'created_at', 'updated_at'
        )
        read_only_fields = ('formatted_content', 'created_at', 'updated_at')

    def get_formatted_content(self, obj):
        """整形済みデータを取得"""
        return obj.get_formatted_content()


class BasicSettingSerializer(serializers.ModelSerializer):
    """基本設定シリアライザー"""
    ai_story_title = serializers.CharField(source='ai_story.title', read_only=True)

    class Meta:
        model = BasicSetting
        fields = ('id', 'ai_story', 'ai_story_title', 'setting_data', 'content', 'is_edited', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')


class CharacterDetailSerializer(serializers.ModelSerializer):
    """キャラクター詳細シリアライザー"""
    ai_story_title = serializers.CharField(source='ai_story.title', read_only=True)

    class Meta:
        model = CharacterDetail
        fields = ('id', 'ai_story', 'ai_story_title', 'name', 'role', 'summary', 'detail', 'is_edited', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')


class PlotDetailSerializer(serializers.ModelSerializer):
    """あらすじ詳細シリアライザー"""
    ai_story_title = serializers.CharField(source='ai_story.title', read_only=True)
    act_display = serializers.CharField(source='get_act_display', read_only=True)

    class Meta:
        model = PlotDetail
        fields = ('id', 'ai_story', 'ai_story_title', 'act', 'act_display', 'title', 'content', 'is_edited', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')


class EpisodeContentSerializer(serializers.ModelSerializer):
    """エピソード本文シリアライザー"""
    class Meta:
        model = EpisodeContent
        fields = ('id', 'content', 'word_count', 'is_edited', 'created_at', 'updated_at')
        read_only_fields = ('word_count', 'created_at', 'updated_at')


class EpisodeDetailSerializer(serializers.ModelSerializer):
    """エピソード詳細シリアライザー"""
    plot_title = serializers.CharField(source='plot.title', read_only=True)
    act_display = serializers.CharField(source='plot.get_act_display', read_only=True)
    content = EpisodeContentSerializer(read_only=True)

    class Meta:
        model = EpisodeDetail
        fields = ('id', 'plot', 'plot_title', 'act_display', 'number', 'title', 'content', 'is_edited', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')


class EpisodeDetailWithContentSerializer(serializers.ModelSerializer):
    """エピソード詳細と本文を含むシリアライザー"""
    plot_title = serializers.CharField(source='plot.title', read_only=True)
    act_display = serializers.CharField(source='plot.get_act_display', read_only=True)
    content_obj = EpisodeContentSerializer(source='content', read_only=True)
    episode_content = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = EpisodeDetail
        fields = ('id', 'plot', 'plot_title', 'act_display', 'number', 'title', 'content_obj', 'episode_content',
                  'is_edited', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')

    def create(self, validated_data):
        """エピソード詳細と本文を同時に作成"""
        episode_content = validated_data.pop('episode_content', '')
        episode = EpisodeDetail.objects.create(**validated_data)
        if episode_content:
            EpisodeContent.objects.create(episode=episode, content=episode_content)
        return episode

    def update(self, instance, validated_data):
        """エピソード詳細と本文を同時に更新"""
        episode_content = validated_data.pop('episode_content', None)
        # エピソード詳細を更新
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # エピソード本文を更新
        if episode_content is not None:
            content_obj, created = EpisodeContent.objects.get_or_create(episode=instance)
            content_obj.content = episode_content
            content_obj.save()

        return instance


class AIStorySerializer(serializers.ModelSerializer):
    """AI小説シリアライザー"""
    username = serializers.CharField(source='user.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = AIStory
        fields = ('id', 'user', 'username', 'title', 'status', 'status_display', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')


class AIStoryDetailSerializer(serializers.ModelSerializer):
    """AI小説詳細シリアライザー"""
    username = serializers.CharField(source='user.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    basic_setting_data = BasicSettingDataSerializer(many=True, read_only=True)
    basic_setting = BasicSettingSerializer(read_only=True)
    characters = CharacterDetailSerializer(many=True, read_only=True)
    plots = PlotDetailSerializer(many=True, read_only=True)

    class Meta:
        model = AIStory
        fields = ('id', 'user', 'username', 'title', 'status', 'status_display',
                  'basic_setting_data', 'basic_setting', 'characters', 'plots',
                  'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')
