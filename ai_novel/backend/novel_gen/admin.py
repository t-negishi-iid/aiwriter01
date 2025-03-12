"""
Django管理画面の設定
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import (
    UserProfile, CreditHistory, AIStory, BasicSettingData,
    BasicSetting, CharacterDetail, ActDetail, EpisodeDetail,
    EpisodeContent, APIRequestLog
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """ユーザープロファイル管理"""
    list_display = ('id', 'user', 'credit', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('user',)


@admin.register(CreditHistory)
class CreditHistoryAdmin(admin.ModelAdmin):
    """クレジット履歴管理"""
    list_display = ('id', 'user', 'action_type', 'amount', 'balance', 'created_at')
    list_filter = ('action_type', 'created_at')
    search_fields = ('user__username', 'user__email', 'description')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('user',)


@admin.register(AIStory)
class AIStoryAdmin(admin.ModelAdmin):
    """小説管理"""
    list_display = ('id', 'title', 'user', 'status', 'created_at', 'updated_at')
    list_filter = ('status', 'created_at', 'updated_at')
    search_fields = ('title', 'user__username')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('user',)


@admin.register(BasicSettingData)
class BasicSettingDataAdmin(admin.ModelAdmin):
    """基本設定作成用データ管理"""
    list_display = ('id', 'ai_story', 'theme', 'time_and_place', 'created_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('ai_story__title', 'theme', 'time_and_place')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('ai_story',)


@admin.register(BasicSetting)
class BasicSettingAdmin(admin.ModelAdmin):
    """基本設定管理"""
    list_display = ('id', 'ai_story', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('ai_story__title', 'story_setting', 'characters')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('ai_story',)


@admin.register(CharacterDetail)
class CharacterDetailAdmin(admin.ModelAdmin):
    """キャラクター詳細管理"""
    list_display = ('id', 'ai_story', 'name', 'role', 'created_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('ai_story__title', 'name', 'role')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('ai_story',)


@admin.register(ActDetail)
class ActDetailAdmin(admin.ModelAdmin):
    """幕詳細管理"""
    list_display = ('id', 'ai_story', 'act_number', 'title', 'created_at')
    list_filter = ('act_number', 'created_at', 'updated_at')
    search_fields = ('ai_story__title', 'title', 'content')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('ai_story',)


@admin.register(EpisodeDetail)
class EpisodeDetailAdmin(admin.ModelAdmin):
    """エピソード詳細管理"""
    list_display = ('id', 'act', 'episode_number', 'title', 'created_at')
    list_filter = ('episode_number', 'created_at', 'updated_at')
    search_fields = ('act__ai_story__title', 'title', 'content')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('act',)


@admin.register(EpisodeContent)
class EpisodeContentAdmin(admin.ModelAdmin):
    """エピソード本文管理"""
    list_display = ('id', 'episode', 'title', 'word_count', 'created_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('episode__act__ai_story__title', 'title', 'content')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('episode',)


@admin.register(APIRequestLog)
class APIRequestLogAdmin(admin.ModelAdmin):
    """API実行ログ管理"""
    list_display = ('id', 'user', 'request_type', 'ai_story', 'is_success', 'credit_cost', 'created_at')
    list_filter = ('request_type', 'is_success', 'created_at')
    search_fields = ('user__username', 'ai_story__title')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('user', 'ai_story')
