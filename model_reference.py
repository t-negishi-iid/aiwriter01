class AIStory(models.Model):
    """AI小説モデル"""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='ai_stories',
        verbose_name="作者"
    )
    provisional_title = models.CharField("仮タイトル", max_length=100)
    title = models.CharField("タイトル", max_length=100, blank=True)
    status = models.CharField(
        "ステータス",
        max_length=20,
        choices=[
            ('draft', '下書き'),
            ('in_progress', '作成中'),
            ('completed', '完成'),
            ('published', '公開中'),
            ('archived', 'アーカイブ'),
        ],
        default='draft'
    )
    current_step = models.CharField(
        "現在のステップ",
        max_length=30,
        choices=[
            ('basic_setting_data', '基本設定作成用データ'),
            ('basic_setting', '基本設定'),
            ('character_detail', 'キャラクター詳細'),
            ('plot_detail', 'あらすじ詳細'),
            ('episode_detail', 'エピソード詳細'),
            ('episode_content', 'エピソード本文'),
            ('title_generation', 'タイトル生成'),
            ('completed', '完成'),
        ],
        default='basic_setting_data'
    )
    word_count = models.PositiveIntegerField("総文字数", default=0)
    created_at = models.DateTimeField("作成日時", auto_now_add=True)
    updated_at = models.DateTimeField("更新日時", auto_now=True)

    class Meta:
        verbose_name = "AI小説"
        verbose_name_plural = "AI小説"
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.title or self.provisional_title} ({self.user.username})"

    def get_display_title(self):
        """表示用タイトルを取得（正式タイトルがなければ仮タイトルを返す）"""
        return self.title if self.title else self.provisional_title

    def update_word_count(self):
        """小説の総文字数を更新"""
        total_count = 0
        for content in self.episode_contents.all():
            total_count += content.word_count

        self.word_count = total_count
        self.save(update_fields=['word_count'])
        return total_count

    def can_proceed_to_next_step(self):
        """次のステップに進めるかチェック"""
        step_requirements = {
            'basic_setting_data': lambda: self.basic_setting_data.exists(),
            'basic_setting': lambda: self.basic_settings.exists(),
            'character_detail': lambda: self.characters.count() > 0,
            'plot_detail': lambda: self.plots.count() == 3,  # 3幕すべて作成済みか
            'episode_detail': lambda: self.story_parts.exists(),
            'episode_content': lambda: self.story_parts.filter(content__isnull=False).exists(),
            'title_generation': lambda: bool(self.title),
        }

        current_step = self.current_step
        if current_step == 'completed':
            return False

        check_func = step_requirements.get(current_step)
        return check_func() if check_func else False

    def advance_to_next_step(self):
        """次のステップに進む"""
        step_order = [
            'basic_setting_data',
            'basic_setting',
            'character_detail',
            'plot_detail',
            'episode_detail',
            'episode_content',
            'title_generation',
            'completed',
        ]

        if not self.can_proceed_to_next_step():
            return False

        current_index = step_order.index(self.current_step)
        if current_index < len(step_order) - 1:
            self.current_step = step_order[current_index + 1]
            self.save(update_fields=['current_step'])
            return True

        return False

class User(AbstractUser):
    """ユーザーモデル（Django標準ユーザーモデルを拡張）"""

    pen_name = models.CharField("ペンネーム", max_length=20, blank=True)
    pen_name_kana = models.CharField("ペンネーム（かな）", max_length=40, blank=True)
    subscription_type = models.CharField(
        "サブスクリプション",
        max_length=20,
        choices=[
            ('free', '無料会員'),
            ('basic', '基本会員'),
            ('premium', 'プレミアム会員'),
        ],
        default='free'
    )
    created_at = models.DateTimeField("作成日時", auto_now_add=True)
    updated_at = models.DateTimeField("更新日時", auto_now=True)

    class Meta:
        verbose_name = "ユーザー"
        verbose_name_plural = "ユーザー"

    def __str__(self):
        return f"{self.username} ({self.pen_name})"

    def get_credit_balance(self):
        """ユーザーの現在のクレジット残高を取得"""
        credit, created = UserCredit.objects.get_or_create(
            user=self,
            defaults={'credit_amount': 0}
        )
        return credit.credit_amount

    def has_sufficient_credit(self, required_amount):
        """指定された量のクレジットが利用可能かチェック"""
        return self.get_credit_balance() >= required_amount

    def use_credit(self, amount):
        """クレジットを消費"""
        credit = UserCredit.objects.get(user=self)
        if credit.credit_amount < amount:
            raise ValueError("クレジットが不足しています")

        credit.credit_amount -= amount
        credit.save()

        # クレジット使用履歴を記録
        CreditUsageHistory.objects.create(
            user=self,
            amount=amount,
            usage_type='consumption',
            description='AI機能使用'
        )

        return credit.credit_amount

class UserCredit(models.Model):
    """ユーザークレジットモデル"""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='credit',
        verbose_name="ユーザー"
    )
    credit_amount = models.PositiveIntegerField("クレジット残高", default=0)
    created_at = models.DateTimeField("作成日時", auto_now_add=True)
    updated_at = models.DateTimeField("更新日時", auto_now=True)

    class Meta:
        verbose_name = "ユーザークレジット"
        verbose_name_plural = "ユーザークレジット"

    def __str__(self):
        return f"{self.user.username}のクレジット: {self.credit_amount}"

    def add_credit(self, amount):
        """クレジットを追加"""
        self.credit_amount += amount
        self.save()

        # クレジット追加履歴を記録
        CreditUsageHistory.objects.create(
            user=self.user,
            amount=amount,
            usage_type='addition',
            description='クレジット購入または付与'
        )

        return self.credit_amount

class CreditUsageHistory(models.Model):
    """クレジット使用履歴モデル"""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='credit_history',
        verbose_name="ユーザー"
    )
    amount = models.IntegerField("クレジット量")
    usage_type = models.CharField(
        "使用タイプ",
        max_length=20,
        choices=[
            ('addition', '追加'),
            ('consumption', '消費'),
            ('refund', '返金'),
        ]
    )
    description = models.CharField("説明", max_length=255)
    ai_story = models.ForeignKey(
        'AIStory',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='credit_usages',
        verbose_name="関連小説"
    )
    feature_used = models.CharField("使用機能", max_length=100, blank=True)
    created_at = models.DateTimeField("作成日時", auto_now_add=True)

    class Meta:
        verbose_name = "クレジット使用履歴"
        verbose_name_plural = "クレジット使用履歴"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username}: {self.usage_type} {self.amount} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"

class BasicSettingData(models.Model):
    """基本設定作成用データモデル"""

    ai_story = models.ForeignKey(
        AIStory,
        on_delete=models.CASCADE,
        related_name='basic_setting_data',
        verbose_name="AI小説"
    )
    theme = models.CharField("主題", max_length=100)
    time_and_place = models.CharField("時代と場所", max_length=100)
    world_setting = models.CharField("作品世界と舞台設定", max_length=100)
    plot_pattern = models.CharField("プロットパターン", max_length=100)
    love_expressions = ArrayField(
        models.CharField(max_length=100),
        verbose_name="愛情表現",
        blank=True,
        default=list
    )
    emotional_expressions = ArrayField(
        models.CharField(max_length=100),
        verbose_name="感情表現",
        blank=True,
        default=list
    )
    atmosphere = ArrayField(
        models.CharField(max_length=100),
        verbose_name="雰囲気演出",
        blank=True,
        default=list
    )
    sensual_expressions = ArrayField(
        models.CharField(max_length=100),
        verbose_name="官能表現",
        blank=True,
        default=list
    )
    mental_elements = ArrayField(
        models.CharField(max_length=100),
        verbose_name="精神的要素",
        blank=True,
        default=list
    )
    social_elements = ArrayField(
        models.CharField(max_length=100),
        verbose_name="社会的要素",
        blank=True,
        default=list
    )
    past_mysteries = ArrayField(
        models.CharField(max_length=100),
        verbose_name="過去の謎",
        blank=True,
        default=list
    )
    formatted_content = models.TextField("フォーマット済み内容", blank=True)
    raw_content = JSONField("生データ", blank=True, null=True)
    created_at = models.DateTimeField("作成日時", auto_now_add=True)
    updated_at = models.DateTimeField("更新日時", auto_now=True)

    class Meta:
        verbose_name = "基本設定作成用データ"
        verbose_name_plural = "基本設定作成用データ"

    def __str__(self):
        return f"{self.ai_story.get_display_title()}の基本設定作成用データ"

    def save(self, *args, **kwargs):
        """保存時にフォーマット済み内容を生成"""
        self.formatted_content = self.get_formatted_content()
        super().save(*args, **kwargs)

    def get_formatted_content(self):
        """テンプレートに埋め込んだ結果を返す"""
        try:
            template_path = os.path.join(
                settings.BASE_DIR,
                'novel_gen_system_data/04_templates/01_基本設定作成用データテンプレート.md'
            )
            with open(template_path, 'r', encoding='utf-8') as f:
                template_content = f.read()

            # テンプレートに選択内容を埋め込む
            filled_template = template_content.format(
                theme=self.theme,
                time_and_place=self.time_and_place,
                world_setting=self.world_setting,
                plot_pattern=self.plot_pattern,
                love_expressions=', '.join(self.love_expressions),
                emotional_expressions=', '.join(self.emotional_expressions),
                atmosphere=', '.join(self.atmosphere),
                sensual_expressions=', '.join(self.sensual_expressions),
                mental_elements=', '.join(self.mental_elements),
                social_elements=', '.join(self.social_elements),
                past_mysteries=', '.join(self.past_mysteries)
            )

            return filled_template
        except Exception as e:
            logger.error(f"Error formatting content: {str(e)}")
            return f"テンプレート処理エラー: {str(e)}"

class BasicSetting(models.Model):
    """基本設定モデル"""

    ai_story = models.ForeignKey(
        AIStory,
        on_delete=models.CASCADE,
        related_name='basic_settings',
        verbose_name="AI小説"
    )
    basic_setting_data = models.ForeignKey(
        BasicSettingData,
        on_delete=models.SET_NULL,
        null=True,
        related_name='basic_settings',
        verbose_name="基本設定作成用データ"
    )
    content = models.TextField("内容")
    status = models.CharField(
        "ステータス",
        max_length=20,
        choices=[
            ('generating', '生成中'),
            ('completed', '生成完了'),
            ('saved', '保存済み'),
            ('failed', '生成失敗')
        ],
        default='generating'
    )
    created_at = models.DateTimeField("作成日時", auto_now_add=True)
    updated_at = models.DateTimeField("更新日時", auto_now=True)

    class Meta:
        verbose_name = "基本設定"
        verbose_name_plural = "基本設定"

    def __str__(self):
        return f"{self.ai_story.get_display_title()}の基本設定"

    def get_characters(self):
        """基本設定から登場人物情報を抽出"""
        import re
        pattern = r'## 主な登場人物\s+(.+?)(?=##|\Z)'
        match = re.search(pattern, self.content, re.DOTALL)
        if not match:
            return []

        # 各登場人物の情報を抽出
        characters_section = match.group(1)
        character_pattern = r'### (.+?)\s+#### 役割\s+(.+?)\s+#### 説明\s+(.+?)(?=---|\Z)'
        characters = []

        for char_match in re.finditer(character_pattern, characters_section, re.DOTALL):
            name = char_match.group(1).strip()
            role = char_match.group(2).strip()
            description = char_match.group(3).strip()

            characters.append({
                'name': name,
                'role': role,
                'description': description
            })

        return characters

    def get_plot_summary(self):
        """基本設定からあらすじ情報を抽出"""
        import re
        pattern = r'## あらすじ\s+(.+?)(?=##|\Z)'
        match = re.search(pattern, self.content, re.DOTALL)
        if not match:
            return {}

        # あらすじの各幕情報を抽出
        plot_section = match.group(1)
        act_pattern = r'### 第(\d+)幕\s+#### 幕タイトル\s+「(.+?)」\s+#### ストーリー\s+([\s\S]+?)(?=###|\Z)'
        acts = []

        for act_match in re.finditer(act_pattern, plot_section, re.DOTALL):
            act_number = act_match.group(1)
            act_title = act_match.group(2)
            act_story = act_match.group(3).strip()

            acts.append({
                'act_number': int(act_number),
                'title': act_title,
                'story': act_story
            })

        # 結末情報を抽出
        ending_pattern = r'### 結末\s+([\s\S]+?)(?=##|\Z)'
        ending_match = re.search(ending_pattern, plot_section, re.DOTALL)
        ending = ending_match.group(1).strip() if ending_match else ""

        return {
            'acts': acts,
            'ending': ending
        }

    def extract_character_inputs(self):
        """基本設定から各キャラクターのINPUTデータを抽出して保存"""
        characters = self.get_characters()

        for char_data in characters:
            # 既存のキャラクターINPUTがあれば更新、なければ作成
            CharacterDetailInput.objects.update_or_create(
                ai_story=self.ai_story,
                name=char_data['name'],
                defaults={
                    'role': char_data['role'],
                    'description': char_data['description']
                }
            )

        return len(characters)

    def extract_plot_inputs(self):
        """基本設定からあらすじ詳細のINPUTデータを抽出して保存"""
        plot_data = self.get_plot_summary()

        if not plot_data or 'acts' not in plot_data:
            return 0

        for act in plot_data['acts']:
            # 既存のあらすじINPUTがあれば更新、なければ作成
            PlotDetail.objects.update_or_create(
                ai_story=self.ai_story,
                act_number=act['act_number'],
                defaults={
                    'act_title': act['title'],
                    'content': act['story'],
                    'is_input': True  # これは基本設定からの抽出データ
                }
            )

        return len(plot_data['acts'])

class CharacterDetailInput(models.Model):
    """キャラクター詳細INPUTモデル"""

    ai_story = models.ForeignKey(
        AIStory,
        on_delete=models.CASCADE,
        related_name='character_inputs',
        verbose_name="AI小説"
    )
    name = models.CharField("登場人物名", max_length=100)
    role = models.CharField("役割", max_length=100)
    description = models.TextField("登場人物基本設定")
    created_at = models.DateTimeField("作成日時", auto_now_add=True)
    updated_at = models.DateTimeField("更新日時", auto_now=True)

    class Meta:
        verbose_name = "キャラクター詳細INPUT"
        verbose_name_plural = "キャラクター詳細INPUT"
        unique_together = ('ai_story', 'name')

    def __str__(self):
        return f"{self.name} ({self.ai_story.get_display_title()})"

    def get_formatted_content(self):
        """APIに送信するフォーマット済み内容を返す"""
        return f"""# キャラクター詳細INPUT

## 登場人物名
{self.name}

## 役割
{self.role}

## 登場人物基本設定
{self.description}
"""

class CharacterDetail(models.Model):
    """キャラクター詳細モデル"""

    ai_story = models.ForeignKey(
        AIStory,
        on_delete=models.CASCADE,
        related_name='characters',
        verbose_name="AI小説"
    )
    character_input = models.ForeignKey(
        CharacterDetailInput,
        on_delete=models.SET_NULL,
        null=True,
        related_name='character_details',
        verbose_name="キャラクター詳細INPUT"
    )
    name = models.CharField("登場人物名", max_length=100)
    role = models.CharField("役割", max_length=100)
    content = models.TextField("キャラクター詳細")
    status = models.CharField(
        "ステータス",
        max_length=20,
        choices=[
            ('generating', '生成中'),
            ('completed', '生成完了'),
            ('saved', '保存済み'),
            ('failed', '生成失敗')
        ],
        default='generating'
    )
    created_at = models.DateTimeField("作成日時", auto_now_add=True)
    updated_at = models.DateTimeField("更新日時", auto_now=True)

    class Meta:
        verbose_name = "キャラクター詳細"
        verbose_name_plural = "キャラクター詳細"
        unique_together = ('ai_story', 'name')

    def __str__(self):
        return f"{self.name} ({self.ai_story.get_display_title()})"

    def extract_character_attributes(self):
        """キャラクター詳細から属性を抽出"""
        import re

        attributes = {}
        patterns = {
            'gender_age': r'## 性別と年齢\s+(.*?)(?=##|\Z)',
            'personality': r'## 表面的な性格、気質\s+(.*?)(?=##|\Z)',
            'goals': r'## 内に秘めた生きる目的、目標\s+(.*?)(?=##|\Z)',
            'beliefs': r'## 思想/信条/プライドにかけて譲れないもの\s+(.*?)(?=##|\Z)',
            'hobbies': r'## 趣味や嗜好\s+(.*?)(?=##|\Z)',
            'habits': r'## 日常生活での習慣や癖\s+(.*?)(?=##|\Z)',
            'treasures': r'## 思い出の品や大切にしているもの\s+(.*?)(?=##|\Z)',
            'past': r'## 過去の重要な経験\s+(.*?)(?=##|\Z)',
            'skills': r'## 特技や専門知識、特殊技能\s+(.*?)(?=##|\Z)',
            'strengths': r'## 長所、強み\s+(.*?)(?=##|\Z)',
            'dislikes': r'## 嫌いなモノ、苦手なモノ\s+(.*?)(?=##|\Z)',
        }

        for key, pattern in patterns.items():
            match = re.search(pattern, self.content, re.DOTALL)
            if match:
                attributes[key] = match.group(1).strip()

        return attributes

class PlotDetail(models.Model):
    """あらすじ詳細モデル"""

    ai_story = models.ForeignKey(
        AIStory,
        on_delete=models.CASCADE,
        related_name='plots',
        verbose_name="AI小説"
    )
    act_number = models.PositiveSmallIntegerField("幕NO", choices=[(1, '第1幕'), (2, '第2幕'), (3, '第3幕')])
    act_title = models.CharField("幕タイトル", max_length=100)
    content = models.TextField("あらすじ詳細")
    is_input = models.BooleanField("INPUTデータか", default=False)
    status = models.CharField(
        "ステータス",
        max_length=20,
        choices=[
            ('generating', '生成中'),
            ('completed', '生成完了'),
            ('saved', '保存済み'),
            ('failed', '生成失敗')
        ],
        default='completed'
    )
    created_at = models.DateTimeField("作成日時", auto_now_add=True)
    updated_at = models.DateTimeField("更新日時", auto_now=True)

    class Meta:
        verbose_name = "あらすじ詳細"
        verbose_name_plural = "あらすじ詳細"
        unique_together = ('ai_story', 'act_number')
        ordering = ['ai_story', 'act_number']

    def __str__(self):
        return f"第{self.act_number}幕: {self.act_title} ({self.ai_story.get_display_title()})"

    def regenerate_title(self):
        """幕タイトルのみを再生成するメソッド"""
        # ここでDify APIを呼び出してタイトルを再生成
        # 実装は省略
        pass

class StoryPart(models.Model):
    """エピソード詳細モデル"""

    ai_story = models.ForeignKey(
        AIStory,
        on_delete=models.CASCADE,
        related_name='story_parts',
        verbose_name="AI小説"
    )
    plot = models.ForeignKey(
        PlotDetail,
        on_delete=models.CASCADE,
        related_name='story_parts',
        verbose_name="あらすじ詳細"
    )
    episode_number = models.PositiveSmallIntegerField("エピソードNO")
    overall_number = models.PositiveSmallIntegerField("通し話数NO")
    provisional_title = models.CharField("エピソード仮タイトル", max_length=100)
    content = models.TextField("エピソード詳細")
    status = models.CharField(
        "ステータス",
        max_length=20,
        choices=[
            ('generating', '生成中'),
            ('completed', '生成完了'),
            ('saved', '保存済み'),
            ('failed', '生成失敗')
        ],
        default='generating'
    )
    created_at = models.DateTimeField("作成日時", auto_now_add=True)
    updated_at = models.DateTimeField("更新日時", auto_now=True)

    class Meta:
        verbose_name = "エピソード詳細"
        verbose_name_plural = "エピソード詳細"
        unique_together = [('ai_story', 'episode_number', 'plot'), ('ai_story', 'overall_number')]
        ordering = ['ai_story', 'overall_number']

    def __str__(self):
        return f"第{self.plot.act_number}幕 エピソード{self.episode_number}: {self.provisional_title} ({self.ai_story.get_display_title()})"

    def regenerate_title(self):
        """エピソードタイトルのみを再生成するメソッド"""
        # ここでDify APIを呼び出してタイトルを再生成
        # 実装は省略
        pass

    @property
    def has_content(self):
        """エピソード本文が作成されているかどうか"""
        return hasattr(self, 'content_obj') and self.content_obj is not None

class StoryPartContent(models.Model):
    """エピソード本文モデル"""

    story_part = models.OneToOneField(
        StoryPart,
        on_delete=models.CASCADE,
        related_name='content_obj',
        verbose_name="エピソード詳細"
    )
    title = models.CharField("エピソードタイトル", max_length=100)
    content = models.TextField("エピソード本文")
    word_count = models.PositiveIntegerField("文字数", default=0)
    status = models.CharField(
        "ステータス",
        max_length=20,
        choices=[
            ('generating', '生成中'),
            ('completed', '生成完了'),
            ('saved', '保存済み'),
            ('failed', '生成失敗')
        ],
        default='generating'
    )
