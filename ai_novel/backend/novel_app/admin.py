"""
管理画面の設定
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import (
    UserProfile, Credit, CreditTransaction, AIStory,
    BasicSettingData, BasicSetting, CharacterDetail,
    PlotDetail, EpisodeDetail, EpisodeContent, ApiUsageLog
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """ユーザープロフィール管理"""
    list_display = ('user', 'created_at', 'updated_at')
    search_fields = ('user__username', 'user__email', 'bio')
    date_hierarchy = 'created_at'


@admin.register(Credit)
class CreditAdmin(admin.ModelAdmin):
    """クレジット管理"""
    list_display = ('user', 'amount', 'updated_at')
    search_fields = ('user__username', 'user__email')
    list_filter = ('amount',)
    date_hierarchy = 'updated_at'


@admin.register(CreditTransaction)
class CreditTransactionAdmin(admin.ModelAdmin):
    """クレジット取引履歴管理"""
    list_display = ('user', 'transaction_type', 'amount', 'description', 'created_at')
    search_fields = ('user__username', 'description')
    list_filter = ('transaction_type', 'created_at')
    date_hierarchy = 'created_at'


class BasicSettingDataInline(admin.TabularInline):
    """基本設定作成用データのインライン表示"""
    model = BasicSettingData
    extra = 0
    fields = ('theme', 'time_and_place', 'plot_pattern', 'created_at')
    readonly_fields = ('created_at',)


class CharacterDetailInline(admin.TabularInline):
    """キャラクター詳細のインライン表示"""
    model = CharacterDetail
    extra = 0
    fields = ('name', 'role', 'is_edited', 'created_at')
    readonly_fields = ('created_at',)


class PlotDetailInline(admin.TabularInline):
    """あらすじ詳細のインライン表示"""
    model = PlotDetail
    extra = 0
    fields = ('act', 'title', 'is_edited', 'created_at')
    readonly_fields = ('created_at',)


@admin.register(AIStory)
class AIStoryAdmin(admin.ModelAdmin):
    """AI小説管理"""
    list_display = ('title', 'user', 'status', 'created_at', 'updated_at')
    search_fields = ('title', 'user__username')
    list_filter = ('status', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'
    inlines = [BasicSettingDataInline, CharacterDetailInline, PlotDetailInline]
    fieldsets = (
        (None, {'fields': ('user', 'title', 'status')}),
        (_('タイムスタンプ'), {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
    readonly_fields = ('created_at', 'updated_at')


@admin.register(BasicSettingData)
class BasicSettingDataAdmin(admin.ModelAdmin):
    """基本設定作成用データ管理"""
    list_display = ('ai_story', 'theme', 'time_and_place', 'created_at')
    search_fields = ('ai_story__title', 'theme', 'time_and_place')
    list_filter = ('created_at',)
    date_hierarchy = 'created_at'
    fieldsets = (
        (None, {'fields': ('ai_story', 'theme', 'time_and_place', 'world_setting', 'plot_pattern')}),
        (_('表現要素'), {'fields': ('love_expressions', 'emotional_expressions', 'atmosphere', 'sensual_expressions')}),
        (_('テーマ要素'), {'fields': ('mental_elements', 'social_elements', 'past_mysteries')}),
        (_('データ'), {'fields': ('formatted_content', 'raw_content'), 'classes': ('collapse',)}),
        (_('タイムスタンプ'), {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
    readonly_fields = ('created_at', 'updated_at', 'formatted_content')


@admin.register(BasicSetting)
class BasicSettingAdmin(admin.ModelAdmin):
    """基本設定管理"""
    list_display = ('ai_story', 'is_edited', 'created_at', 'updated_at')
    search_fields = ('ai_story__title', 'content')
    list_filter = ('is_edited', 'created_at')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')


@admin.register(CharacterDetail)
class CharacterDetailAdmin(admin.ModelAdmin):
    """キャラクター詳細管理"""
    list_display = ('name', 'ai_story', 'role', 'is_edited', 'created_at')
    search_fields = ('name', 'ai_story__title', 'role', 'summary', 'detail')
    list_filter = ('is_edited', 'created_at')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')


class EpisodeDetailInline(admin.TabularInline):
    """エピソード詳細のインライン表示"""
    model = EpisodeDetail
    extra = 0
    fields = ('number', 'title', 'is_edited')


@admin.register(PlotDetail)
class PlotDetailAdmin(admin.ModelAdmin):
    """あらすじ詳細管理"""
    list_display = ('ai_story', 'act', 'title', 'is_edited', 'created_at')
    search_fields = ('ai_story__title', 'title', 'content')
    list_filter = ('act', 'is_edited', 'created_at')
    date_hierarchy = 'created_at'
    inlines = [EpisodeDetailInline]
    readonly_fields = ('created_at', 'updated_at')


class EpisodeContentInline(admin.StackedInline):
    """エピソード本文のインライン表示"""
    model = EpisodeContent
    extra = 0
    fields = ('content', 'word_count', 'is_edited')
    readonly_fields = ('word_count',)


@admin.register(EpisodeDetail)
class EpisodeDetailAdmin(admin.ModelAdmin):
    """エピソード詳細管理"""
    list_display = ('plot', 'number', 'title', 'is_edited', 'created_at')
    search_fields = ('plot__ai_story__title', 'title', 'content')
    list_filter = ('plot__act', 'is_edited', 'created_at')
    date_hierarchy = 'created_at'
    inlines = [EpisodeContentInline]
    readonly_fields = ('created_at', 'updated_at')


@admin.register(EpisodeContent)
class EpisodeContentAdmin(admin.ModelAdmin):
    """エピソード本文管理"""
    list_display = ('episode', 'word_count', 'is_edited', 'created_at')
    search_fields = ('episode__title', 'content')
    list_filter = ('is_edited', 'created_at')
    date_hierarchy = 'created_at'
    readonly_fields = ('word_count', 'created_at', 'updated_at')


@admin.register(ApiUsageLog)
class ApiUsageLogAdmin(admin.ModelAdmin):
    """API使用ログ管理"""
    list_display = ('user', 'api_type', 'credit_used', 'is_success', 'created_at')
    search_fields = ('user__username', 'request_data', 'response_data', 'error_message')
    list_filter = ('api_type', 'is_success', 'credit_used', 'created_at')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')
