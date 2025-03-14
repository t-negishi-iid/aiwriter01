# 基本設定作成用データ 仕様書

## 1. 概要

基本設定作成用データは、AI小説執筆支援システムにおいて、小説の基本的な設定を定義するためのデータです。ユーザーがフォームから入力した情報をもとに、AIが小説の基本設定を生成するための入力データとして使用されます。

## 2. データ構造

### 2.1 フロントエンド側のデータ構造 (TypeScript)

```typescript
// 基本設定作成用データの型定義
export interface BasicSettingData {
  genre: string;      // ジャンル
  theme: string;      // テーマ
  setting: string;    // 舞台設定
  era: string;        // 時代
  emotions: string[]; // 情緒的要素
  plot_type: string;  // プロットタイプ
  mystery: string;    // 過去の謎
  additional_info?: string; // 追加情報（任意）
}
```

### 2.2 バックエンド側のデータ構造 (Django Model)

```python
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
```

## 3. フィールドの対応関係

フロントエンドとバックエンドのフィールドは以下のように対応しています：

| フロントエンド (BasicSettingData) | バックエンド (BasicSettingData) | 説明 |
|----------------------------------|--------------------------------|------|
| genre                            | (raw_contentに保存)              | ジャンル |
| theme                            | theme                          | テーマ |
| setting                          | world_setting                  | 舞台設定 |
| era                              | time_and_place                 | 時代と場所 |
| emotions                         | 複数のカテゴリに振り分け            | 情緒的要素 |
| plot_type                        | plot_pattern                   | プロットタイプ |
| mystery                          | past_mysteries                 | 過去の謎 |
| additional_info                  | (raw_contentに保存)              | 追加情報 |

### 3.1 情緒的要素の振り分け

フロントエンドの `emotions` 配列は、バックエンド側で以下のカテゴリに振り分けられます：

- `love_expression` を含む要素 → `love_expressions` 配列
- `emotional_expression` を含む要素 → `emotional_expressions` 配列
- `atmosphere` を含む要素 → `atmosphere` 配列
- `sensual_expression` を含む要素 → `sensual_expressions` 配列
- `spiritual_elements` を含む要素 → `mental_elements` 配列
- `social_elements` を含む要素 → `social_elements` 配列

## 4. データフロー

### 4.1 フォーム入力からAPIリクエストまで

1. ユーザーがフォームに入力
2. フォームのバリデーション（Zod スキーマによる検証）
3. フォームデータを `BasicSettingData` 型に変換
4. `createBasicSettingData` API関数を呼び出し
5. フロントエンドのデータ形式をバックエンドの形式に変換
6. APIリクエストを送信

### 4.2 バックエンドでのデータ処理

1. `BasicSettingDataCreateView` がリクエストを受信
2. リクエストデータをコピー
3. フィールド名のマッピングを行い、JSONコンテンツを作成
4. シリアライザーを使用してデータを検証
5. データベースにデータを保存
   - 小説（AIStory）との関連付け
   - JSONコンテンツを `raw_content` フィールドに保存

## 5. バリデーション

### 5.1 フロントエンド側のバリデーション

```typescript
// 基本設定作成用データのスキーマ
const formSchema = z.object({
  genre: z.string().min(1, "ジャンルは必須項目です"),
  theme: z.string().min(1, "テーマは必須項目です"),
  setting: z.string().min(1, "舞台設定は必須項目です"),
  era: z.string().min(1, "時代は必須項目です"),
  emotions: z.array(z.string()).min(1, "情緒的要素は必須項目です"), //、「情緒的要素は文字列配列として保存されるが、現在のUI実装では単一選択のみサポートしている」
  plot_type: z.string().min(1, "プロットタイプは必須項目です"),
  mystery: z.string().min(1, "過去の謎は必須項目です"),
  additional_info: z.string().optional(),
})
```

### 5.2 バックエンド側のバリデーション

```python
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
    # ... 他のフィールドも同様
```

## 6. API仕様

### 6.1 基本設定作成用データの作成

- **エンドポイント**: `/api/stories/{storyId}/basic-setting-data/`
- **メソッド**: POST
- **リクエストボディ**:
  ```json
  {
    "theme": "string",
    "time_and_place": "string",
    "world_setting": "string",
    "plot_pattern": "string",
    "love_expressions": ["string"],
    "emotional_expressions": ["string"],
    "atmosphere": ["string"],
    "sensual_expressions": ["string"],
    "mental_elements": ["string"],
    "social_elements": ["string"],
    "past_mysteries": ["string"],
    "raw_content": {}
  }
  ```
- **レスポンス**:
  ```json
  {
    "success": true,
    "data": {
      "task_id": "string",
      "status": "pending",
      "created_at": "string",
      "updated_at": "string"
    }
  }
  ```

### 6.2 基本設定作成用データの取得

- **エンドポイント**: `/api/stories/{storyId}/basic-setting-data/`
- **メソッド**: GET
- **レスポンス**:
  ```json
  {
    "success": true,
    "data": {
      "id": "number",
      "ai_story": {},
      "theme": "string",
      "time_and_place": "string",
      "world_setting": "string",
      "plot_pattern": "string",
      "love_expressions": ["string"],
      "emotional_expressions": ["string"],
      "atmosphere": ["string"],
      "sensual_expressions": ["string"],
      "mental_elements": ["string"],
      "social_elements": ["string"],
      "past_mysteries": ["string"],
      "formatted_content": "string",
      "created_at": "string",
      "updated_at": "string"
    }
  }
  ```

## 7. 実装上の注意点

1. **emotions フィールドの処理**:
   - フロントエンドでは `emotions` は文字列の配列として扱われます。
   - バックエンドでは `emotions` の各要素を内容に基づいて適切なカテゴリに振り分けます。

2. **raw_content フィールド**:
   - フロントエンドから送信されたデータの元の形式を保持するために使用されます。
   - JSONフィールドとして保存されるため、任意の構造のデータを格納できます。

3. **エラーハンドリング**:
   - フロントエンド側では、APIリクエスト失敗時にエラーメッセージをユーザーに表示します。
   - バックエンド側では、バリデーションエラーや処理エラーを適切なHTTPステータスコードとエラーメッセージで返します。

4. **型の整合性**:
   - フロントエンドとバックエンドの間でデータ型の整合性を保つことが重要です。
   - 特に `emotions` フィールドは、フロントエンドでは文字列の配列、バックエンドでは複数のカテゴリに分かれるため、注意が必要です。
