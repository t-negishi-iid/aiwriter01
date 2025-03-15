"""
AI小説執筆支援システムのデータモデル
"""
from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.contrib.postgres.fields import ArrayField
import os


class TimeStampedModel(models.Model):
    """すべてのモデルの基底クラス - 作成日時と更新日時を記録"""
    created_at = models.DateTimeField(_('作成日時'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新日時'), auto_now=True)

    class Meta:
        abstract = True


class UserProfile(TimeStampedModel):
    """ユーザープロファイル（クレジット管理）"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    credit = models.IntegerField(_('クレジット'), default=100)
    bio = models.TextField(_('自己紹介'), blank=True)

    class Meta:
        verbose_name = _('ユーザープロファイル')
        verbose_name_plural = _('ユーザープロファイル')

    def __str__(self):
        return f"{self.user.username}のプロファイル"

    def has_sufficient_credit(self, required_credit):
        """必要なクレジットがあるかチェック"""
        return self.credit >= required_credit

    def use_credit(self, amount):
        """クレジットを使用"""
        if self.credit < amount:
            raise ValidationError(_('クレジットが不足しています'))
        self.credit -= amount
        self.save()

        # クレジット使用履歴に記録
        CreditHistory.objects.create(
            user=self.user,
            amount=-amount,
            balance=self.credit,
            action_type='use'
        )
        return True

    def add_credit(self, amount):
        """クレジットを追加"""
        self.credit += amount
        self.save()

        # クレジット追加履歴に記録
        CreditHistory.objects.create(
            user=self.user,
            amount=amount,
            balance=self.credit,
            action_type='add'
        )
        return True


class CreditHistory(TimeStampedModel):
    """クレジット使用履歴"""
    ACTION_TYPES = (
        ('add', _('追加')),
        ('use', _('使用')),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='credit_history')
    amount = models.IntegerField(_('変動量'))
    balance = models.IntegerField(_('残高'))
    action_type = models.CharField(_('アクションタイプ'), max_length=10, choices=ACTION_TYPES)
    description = models.CharField(_('説明'), max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = _('クレジット履歴')
        verbose_name_plural = _('クレジット履歴')
        ordering = ['-created_at']

    def __str__(self):
        action = '追加' if self.action_type == 'add' else '使用'
        return f"{self.user.username}: {action} {abs(self.amount)}クレジット"


class AIStory(TimeStampedModel):
    """AI小説"""
    STATUS_CHOICES = (
        ('draft', _('下書き')),
        ('in_progress', _('作成中')),
        ('completed', _('完成')),
        ('published', _('公開中')),
    )

    title = models.CharField(_('タイトル'), max_length=255, blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='stories')
    status = models.CharField(_('ステータス'), max_length=20, choices=STATUS_CHOICES, default='draft')

    class Meta:
        verbose_name = _('AI小説')
        verbose_name_plural = _('AI小説')
        ordering = ['-created_at']

    def __str__(self):
        return self.title or f"無題の小説 ({self.id})"


class BasicSettingData(TimeStampedModel):
    """基本設定作成用データ"""
    ai_story = models.ForeignKey(AIStory, on_delete=models.CASCADE, related_name='basic_setting_data')
    basic_setting_data = models.TextField(_('基本設定データ'), blank=True)
    
    # 統合設定クリエーターのデータ
    theme_data = models.JSONField(_('テーマデータ'), blank=True, null=True)
    time_place_data = models.JSONField(_('時代と場所データ'), blank=True, null=True)
    world_setting_data = models.JSONField(_('世界観データ'), blank=True, null=True)
    style_data = models.JSONField(_('文体データ'), blank=True, null=True)
    emotional_data = models.JSONField(_('情緒的要素データ'), blank=True, null=True)
    mystery_data = models.JSONField(_('謎データ'), blank=True, null=True)
    plot_data = models.JSONField(_('プロットデータ'), blank=True, null=True)
    integrated_data = models.JSONField(_('統合データ'), blank=True, null=True)

    class Meta:
        verbose_name = _('基本設定作成用データ')
        verbose_name_plural = _('基本設定作成用データ')

    def __str__(self):
        return f"{self.ai_story.title or 'タイトルなし'}の基本設定データ"

    def get_formatted_content(self):
        """基本設定データをフォーマットして返す"""
        return self.basic_setting_data


class BasicSetting(TimeStampedModel):
    """基本設定（作品設定、あらすじ、登場人物）"""
    ai_story = models.OneToOneField(AIStory, on_delete=models.CASCADE, related_name='basic_setting')
    setting_data = models.ForeignKey(BasicSettingData, on_delete=models.SET_NULL, null=True, related_name='basic_settings')
    story_setting = models.TextField(_('作品設定'))
    characters = models.TextField(_('登場人物設定'))
    plot_overview = models.TextField(_('あらすじ概要'))
    act1_overview = models.TextField(_('第1幕概要'))
    act2_overview = models.TextField(_('第2幕概要'))
    act3_overview = models.TextField(_('第3幕概要'))
    raw_content = models.TextField(_('生データ'))  # APIから返ってきたそのままのテキスト
    is_edited = models.BooleanField(_('編集済み'), default=False)

    class Meta:
        verbose_name = _('基本設定')
        verbose_name_plural = _('基本設定')

    def __str__(self):
        return f"{self.ai_story}の基本設定"


class CharacterDetail(TimeStampedModel):
    """キャラクター詳細"""
    ai_story = models.ForeignKey(AIStory, on_delete=models.CASCADE, related_name='character_details')
    name = models.CharField(_('名前'), max_length=100)
    role = models.CharField(_('役割'), max_length=100)
    age = models.CharField(_('年齢'), max_length=50, blank=True, null=True)
    gender = models.CharField(_('性別'), max_length=50, blank=True, null=True)
    appearance = models.TextField(_('外見'), blank=True, null=True)
    personality = models.TextField(_('性格'), blank=True, null=True)
    background = models.TextField(_('背景'), blank=True, null=True)
    motivation = models.TextField(_('動機'), blank=True, null=True)
    relationship = models.TextField(_('他キャラクターとの関係'), blank=True, null=True)
    development = models.TextField(_('キャラクター成長'), blank=True, null=True)
    raw_content = models.TextField(_('生データ'))  # APIから返ってきたそのままのテキスト
    is_edited = models.BooleanField(_('編集済み'), default=False)

    class Meta:
        verbose_name = _('キャラクター詳細')
        verbose_name_plural = _('キャラクター詳細')
        ordering = ['id']

    def __str__(self):
        return f"{self.name} ({self.ai_story})"


class ActDetail(TimeStampedModel):
    """幕（あらすじ詳細）"""
    ACTS = (
        (1, _('第1幕')),
        (2, _('第2幕')),
        (3, _('第3幕')),
    )

    ai_story = models.ForeignKey(AIStory, on_delete=models.CASCADE, related_name='act_details')
    act_number = models.IntegerField(_('幕番号'), choices=ACTS)
    title = models.CharField(_('タイトル'), max_length=255)
    content = models.TextField(_('内容'))
    raw_content = models.TextField(_('生データ'))  # APIから返ってきたそのままのテキスト
    is_edited = models.BooleanField(_('編集済み'), default=False)

    class Meta:
        verbose_name = _('幕の詳細')
        verbose_name_plural = _('幕の詳細')
        ordering = ['act_number']
        unique_together = [['ai_story', 'act_number']]

    def __str__(self):
        return f"{self.ai_story} - {self.get_act_number_display()}: {self.title}"


class EpisodeDetail(TimeStampedModel):
    """エピソード詳細"""
    act = models.ForeignKey(ActDetail, on_delete=models.CASCADE, related_name='episode_details')
    episode_number = models.IntegerField(_('エピソード番号'))
    title = models.CharField(_('タイトル'), max_length=255)
    content = models.TextField(_('内容'))
    raw_content = models.TextField(_('生データ'))  # APIから返ってきたそのままのテキスト
    is_edited = models.BooleanField(_('編集済み'), default=False)

    class Meta:
        verbose_name = _('エピソード詳細')
        verbose_name_plural = _('エピソード詳細')
        ordering = ['episode_number']
        unique_together = [['act', 'episode_number']]

    def __str__(self):
        return f"{self.act} - エピソード{self.episode_number}: {self.title}"


class EpisodeContent(TimeStampedModel):
    """エピソード本文"""
    episode = models.OneToOneField(EpisodeDetail, on_delete=models.CASCADE, related_name='episode_content')
    title = models.CharField(_('タイトル'), max_length=255)
    content = models.TextField(_('本文'))
    word_count = models.IntegerField(_('文字数'))
    raw_content = models.TextField(_('生データ'))  # APIから返ってきたそのままのテキスト
    is_edited = models.BooleanField(_('編集済み'), default=False)

    class Meta:
        verbose_name = _('エピソード本文')
        verbose_name_plural = _('エピソード本文')

    def __str__(self):
        return f"{self.episode}の本文"

    def save(self, *args, **kwargs):
        # 文字数を自動計算
        if not self.word_count:
            self.word_count = len(self.content)
        super().save(*args, **kwargs)


class APIRequestLog(TimeStampedModel):
    """API実行ログ"""
    REQUEST_TYPES = (
        ('basic_setting_data', _('基本設定作成用データ')),
        ('basic_setting', _('基本設定')),
        ('character_detail', _('キャラクター詳細')),
        ('plot_detail', _('あらすじ詳細')),
        ('episode_detail', _('エピソード詳細')),
        ('episode_content', _('エピソード本文')),
        ('title_episode', _('エピソードタイトル')),
        ('title_act', _('幕タイトル')),
        ('title_novel', _('小説タイトル')),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='api_logs')
    request_type = models.CharField(_('リクエストタイプ'), max_length=20, choices=REQUEST_TYPES)
    ai_story = models.ForeignKey(AIStory, on_delete=models.CASCADE, related_name='api_logs')
    parameters = models.JSONField(_('パラメータ'), blank=True, null=True)
    response = models.TextField(_('レスポンス'), blank=True, null=True)
    is_success = models.BooleanField(_('成功フラグ'), default=True)
    credit_cost = models.IntegerField(_('消費クレジット'), default=0)
    error_message = models.TextField(_('エラーメッセージ'), blank=True, null=True)

    class Meta:
        verbose_name = _('APIリクエストログ')
        verbose_name_plural = _('APIリクエストログ')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.get_request_type_display()} ({self.created_at})"
