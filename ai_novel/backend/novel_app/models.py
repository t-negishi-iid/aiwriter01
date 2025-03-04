"""
AI小説執筆支援システムのデータモデル
"""
from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
from django.contrib.postgres.fields import ArrayField

class TimeStampedModel(models.Model):
    """タイムスタンプを持つ基底モデル"""
    created_at = models.DateTimeField(_('作成日時'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新日時'), auto_now=True)

    class Meta:
        abstract = True


class UserProfile(TimeStampedModel):
    """ユーザープロフィール"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(_('自己紹介'), blank=True)

    class Meta:
        verbose_name = _('ユーザープロフィール')
        verbose_name_plural = _('ユーザープロフィール')

    def __str__(self):
        return f"{self.user.username}のプロフィール"


class Credit(TimeStampedModel):
    """クレジット（ポイント）管理"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='credit')
    amount = models.PositiveIntegerField(_('残高'), default=0)

    class Meta:
        verbose_name = _('クレジット')
        verbose_name_plural = _('クレジット')

    def __str__(self):
        return f"{self.user.username}のクレジット: {self.amount}"

    def has_sufficient_credit(self, required_amount):
        """必要なクレジットがあるか確認"""
        return self.amount >= required_amount

    def use_credit(self, amount):
        """クレジットを消費"""
        if self.has_sufficient_credit(amount):
            self.amount -= amount
            self.save()
            return True
        return False

    def add_credit(self, amount):
        """クレジットを追加"""
        self.amount += amount
        self.save()
        return True


class CreditTransaction(TimeStampedModel):
    """クレジット取引履歴"""
    TRANSACTION_TYPES = (
        ('add', _('追加')),
        ('use', _('使用')),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='credit_transactions')
    amount = models.IntegerField(_('金額'))
    transaction_type = models.CharField(_('取引種別'), max_length=10, choices=TRANSACTION_TYPES)
    description = models.CharField(_('説明'), max_length=255)

    class Meta:
        verbose_name = _('クレジット取引')
        verbose_name_plural = _('クレジット取引')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username}: {self.transaction_type} {self.amount}"


class AIStory(TimeStampedModel):
    """AI小説データ"""
    STATUS_CHOICES = (
        ('draft', _('下書き')),
        ('in_progress', _('作成中')),
        ('completed', _('完成')),
        ('published', _('公開中')),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='stories')
    title = models.CharField(_('タイトル'), max_length=255, blank=True)
    status = models.CharField(_('ステータス'), max_length=20, choices=STATUS_CHOICES, default='draft')

    class Meta:
        verbose_name = _('AI小説')
        verbose_name_plural = _('AI小説')
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.title or '無題の小説'} ({self.user.username})"


class BasicSettingData(TimeStampedModel):
    """基本設定作成用データ"""
    ai_story = models.ForeignKey(AIStory, on_delete=models.CASCADE, related_name='basic_setting_data')
    theme = models.CharField(_('主題'), max_length=100)
    time_and_place = models.CharField(_('時代と場所'), max_length=100)
    world_setting = models.CharField(_('作品世界と舞台設定'), max_length=100)
    plot_pattern = models.CharField(_('プロットパターン'), max_length=100)
    love_expressions = ArrayField(models.CharField(max_length=100), blank=True, verbose_name=_('愛情表現'))
    emotional_expressions = ArrayField(models.CharField(max_length=100), blank=True, verbose_name=_('感情表現'))
    atmosphere = ArrayField(models.CharField(max_length=100), blank=True, verbose_name=_('雰囲気演出'))
    sensual_expressions = ArrayField(models.CharField(max_length=100), blank=True, verbose_name=_('官能表現'))
    mental_elements = ArrayField(models.CharField(max_length=100), blank=True, verbose_name=_('精神的要素'))
    social_elements = ArrayField(models.CharField(max_length=100), blank=True, verbose_name=_('社会的要素'))
    past_mysteries = ArrayField(models.CharField(max_length=100), blank=True, verbose_name=_('過去の謎'))
    raw_content = models.JSONField(_('生データ'), blank=True, null=True)
    formatted_content = models.TextField(_('整形済みデータ'), blank=True)

    class Meta:
        verbose_name = _('基本設定作成用データ')
        verbose_name_plural = _('基本設定作成用データ')

    def __str__(self):
        return f"{self.ai_story.title or '無題の小説'}の基本設定作成用データ"

    def get_formatted_content(self):
        """テンプレートに埋め込んだ結果を返す"""
        if self.formatted_content:
            return self.formatted_content

        # 実際の実装ではテンプレートからフォーマット
        template = "# 基本設定作成用データ\n\n"
        template += f"## 主題\n{self.theme}\n\n"
        template += f"## 時代と場所\n{self.time_and_place}\n\n"
        template += f"## 作品世界と舞台設定\n{self.world_setting}\n\n"
        template += f"## プロットパターン\n{self.plot_pattern}\n\n"
        template += f"## 愛情表現\n{', '.join(self.love_expressions)}\n\n"
        template += f"## 感情表現\n{', '.join(self.emotional_expressions)}\n\n"
        template += f"## 雰囲気演出\n{', '.join(self.atmosphere)}\n\n"
        template += f"## 官能表現\n{', '.join(self.sensual_expressions)}\n\n"
        template += f"## 精神的要素\n{', '.join(self.mental_elements)}\n\n"
        template += f"## 社会的要素\n{', '.join(self.social_elements)}\n\n"
        template += f"## 過去の謎\n{', '.join(self.past_mysteries)}\n\n"

        self.formatted_content = template
        self.save(update_fields=['formatted_content'])
        return template


class BasicSetting(TimeStampedModel):
    """基本設定（作品設定、登場人物、あらすじ）"""
    ai_story = models.OneToOneField(AIStory, on_delete=models.CASCADE, related_name='basic_setting')
    setting_data = models.ForeignKey(BasicSettingData, on_delete=models.SET_NULL, null=True, related_name='basic_settings')
    content = models.TextField(_('内容'))
    is_edited = models.BooleanField(_('編集済み'), default=False)

    class Meta:
        verbose_name = _('基本設定')
        verbose_name_plural = _('基本設定')

    def __str__(self):
        return f"{self.ai_story.title or '無題の小説'}の基本設定"

    def extract_characters(self):
        """登場人物データを抽出する"""
        # 実際の実装では正規表現などでパースする
        return []


class CharacterDetail(TimeStampedModel):
    """キャラクター詳細"""
    ai_story = models.ForeignKey(AIStory, on_delete=models.CASCADE, related_name='characters')
    name = models.CharField(_('名前'), max_length=100)
    role = models.CharField(_('役割'), max_length=100, blank=True)
    summary = models.TextField(_('概要'), blank=True)
    detail = models.TextField(_('詳細'), blank=True)
    is_edited = models.BooleanField(_('編集済み'), default=False)

    class Meta:
        verbose_name = _('キャラクター詳細')
        verbose_name_plural = _('キャラクター詳細')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.ai_story.title or '無題の小説'})"


class PlotDetail(TimeStampedModel):
    """あらすじ詳細"""
    ACT_CHOICES = (
        (1, _('第1幕')),
        (2, _('第2幕')),
        (3, _('第3幕')),
    )

    ai_story = models.ForeignKey(AIStory, on_delete=models.CASCADE, related_name='plots')
    act = models.IntegerField(_('幕'), choices=ACT_CHOICES)
    title = models.CharField(_('タイトル'), max_length=255, blank=True)
    content = models.TextField(_('内容'))
    is_edited = models.BooleanField(_('編集済み'), default=False)

    class Meta:
        verbose_name = _('あらすじ詳細')
        verbose_name_plural = _('あらすじ詳細')
        ordering = ['act']
        unique_together = [['ai_story', 'act']]

    def __str__(self):
        return f"{self.ai_story.title or '無題の小説'} - {self.get_act_display()}: {self.title or '無題'}"


class EpisodeDetail(TimeStampedModel):
    """エピソード詳細"""
    plot = models.ForeignKey(PlotDetail, on_delete=models.CASCADE, related_name='episodes')
    number = models.PositiveIntegerField(_('エピソード番号'))
    title = models.CharField(_('タイトル'), max_length=255, blank=True)
    content = models.TextField(_('内容'))
    is_edited = models.BooleanField(_('編集済み'), default=False)

    class Meta:
        verbose_name = _('エピソード詳細')
        verbose_name_plural = _('エピソード詳細')
        ordering = ['plot__act', 'number']
        unique_together = [['plot', 'number']]

    def __str__(self):
        return f"{self.plot.ai_story.title or '無題の小説'} - {self.plot.get_act_display()} - エピソード{self.number}: {self.title or '無題'}"


class EpisodeContent(TimeStampedModel):
    """エピソード本文"""
    episode = models.OneToOneField(EpisodeDetail, on_delete=models.CASCADE, related_name='content')
    content = models.TextField(_('本文'))
    word_count = models.PositiveIntegerField(_('文字数'), default=0)
    is_edited = models.BooleanField(_('編集済み'), default=False)

    class Meta:
        verbose_name = _('エピソード本文')
        verbose_name_plural = _('エピソード本文')

    def __str__(self):
        return f"{self.episode.title or f'エピソード{self.episode.number}'}の本文"

    def save(self, *args, **kwargs):
        # 文字数を更新
        self.word_count = len(self.content)
        super().save(*args, **kwargs)


class ApiUsageLog(TimeStampedModel):
    """API使用ログ"""
    API_TYPES = (
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

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='api_usage_logs')
    ai_story = models.ForeignKey(AIStory, on_delete=models.CASCADE, related_name='api_usage_logs', null=True)
    api_type = models.CharField(_('API種別'), max_length=30, choices=API_TYPES)
    credit_used = models.PositiveIntegerField(_('使用クレジット'))
    request_data = models.TextField(_('リクエストデータ'), blank=True)
    response_data = models.TextField(_('レスポンスデータ'), blank=True)
    is_success = models.BooleanField(_('成功'), default=True)
    error_message = models.TextField(_('エラーメッセージ'), blank=True)

    class Meta:
        verbose_name = _('API使用ログ')
        verbose_name_plural = _('API使用ログ')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.get_api_type_display()} ({self.created_at})"
