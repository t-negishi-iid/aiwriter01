# キャラクター詳細 仕様書

## 1. 概要

キャラクター詳細は、AI小説執筆支援システムにおいて、小説の登場人物の詳細な設定を定義するためのデータです。ユーザーがフォームから入力した情報をもとに、キャラクターの詳細な設定を保存したり、AIによって生成されたキャラクター詳細を管理したりするために使用されます。

## 2. データ構造

### 2.1 フロントエンド側のデータ構造 (TypeScript)

```typescript
// キャラクター詳細の型定義
export interface Character {
  id: number;
  ai_story: number | Story;
  name: string;      // キャラクター名
  role: string;      // 役割
  age?: string;      // 年齢（任意）
  gender?: string;   // 性別（任意）
  appearance?: string; // 外見（任意）
  personality?: string; // 性格（任意）
  background?: string;  // 背景（任意）
  motivation?: string;  // 動機（任意）
  relationship?: string; // 他キャラクターとの関係（任意）
  development?: string;  // キャラクター成長（任意）
  raw_content?: string;  // 生データ（任意）
  created_at: string;
  updated_at: string;
}
```

### 2.2 バックエンド側のデータ構造 (Django Model)

```python
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
```

## 3. フィールドの対応関係

フロントエンドとバックエンドのフィールドは以下のように対応しています：

| フロントエンド (Character) | バックエンド (CharacterDetail) | 説明 |
|---------------------------|--------------------------------|------|
| id                        | id                             | 一意のID |
| ai_story                  | ai_story                       | 関連する小説 |
| name                      | name                           | キャラクター名 |
| role                      | role                           | 役割 |
| age                       | age                            | 年齢 |
| gender                    | gender                         | 性別 |
| appearance                | appearance                     | 外見 |
| personality               | personality                    | 性格 |
| background                | background                     | 背景 |
| motivation                | motivation                     | 動機 |
| relationship              | relationship                   | 他キャラクターとの関係 |
| development               | development                    | キャラクター成長 |
| raw_content               | raw_content                    | 生データ |
| created_at                | created_at                     | 作成日時 |
| updated_at                | updated_at                     | 更新日時 |

## 4. データフロー

### 4.1 フォーム入力からAPIリクエストまで

1. ユーザーがフォームに入力
2. フォームのバリデーション（Zod スキーマによる検証）
3. フォームデータを `Character` 型に変換
4. `createCharacterDetail` API関数を呼び出し
5. APIリクエストを送信

### 4.2 バックエンドでのデータ処理

1. `CreateCharacterDetailView` がリクエストを受信
2. リクエストデータを検証
3. 基本設定データを取得
4. Dify APIを使用してキャラクター詳細を生成（AIによる生成の場合）
5. データベースにデータを保存
   - 小説（AIStory）との関連付け
   - 生成されたコンテンツを各フィールドに保存

## 5. バリデーション

### 5.1 フロントエンド側のバリデーション

```typescript
// キャラクター作成フォームのバリデーションスキーマ
const characterFormSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  role: z.string().min(1, '役割は必須です'),
  age: z.string().optional(),
  gender: z.string().optional(),
  appearance: z.string().optional(),
  personality: z.string().optional(),
  background: z.string().optional(),
  motivation: z.string().optional(),
  relationship: z.string().optional(),
  development: z.string().optional(),
});
```

### 5.2 バックエンド側のバリデーション

```python
class CharacterDetailCreateSerializer(serializers.ModelSerializer):
    """キャラクター詳細作成シリアライザ"""
    class Meta:
        model = CharacterDetail
        fields = ('id', 'ai_story', 'name', 'role', 'age', 'gender', 'appearance',
                 'personality', 'background', 'motivation', 'relationship',
                 'development', 'raw_content', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
```

## 6. API仕様

### 6.1 キャラクター詳細の作成

- **エンドポイント**: `/api/stories/{storyId}/character-details/`
- **メソッド**: POST
- **リクエストボディ**:
  ```json
  {
    "name": "string",
    "role": "string",
    "age": "string",
    "gender": "string",
    "appearance": "string",
    "personality": "string",
    "background": "string",
    "motivation": "string",
    "relationship": "string",
    "development": "string",
    "raw_content": "string"
  }
  ```
- **レスポンス**:
  ```json
  {
    "id": "number",
    "ai_story": "number",
    "name": "string",
    "role": "string",
    "age": "string",
    "gender": "string",
    "appearance": "string",
    "personality": "string",
    "background": "string",
    "motivation": "string",
    "relationship": "string",
    "development": "string",
    "raw_content": "string",
    "created_at": "string",
    "updated_at": "string"
  }
  ```

### 6.2 キャラクター詳細の取得

- **エンドポイント**: `/api/stories/{storyId}/character-details/`
- **メソッド**: GET
- **レスポンス**:
  ```json
  [
    {
      "id": "number",
      "ai_story": "number",
      "name": "string",
      "role": "string",
      "age": "string",
      "gender": "string",
      "appearance": "string",
      "personality": "string",
      "background": "string",
      "motivation": "string",
      "relationship": "string",
      "development": "string",
      "raw_content": "string",
      "created_at": "string",
      "updated_at": "string"
    }
  ]
  ```

### 6.3 特定のキャラクター詳細の取得

- **エンドポイント**: `/api/stories/{storyId}/character-details/{characterId}/`
- **メソッド**: GET
- **レスポンス**:
  ```json
  {
    "id": "number",
    "ai_story": "number",
    "name": "string",
    "role": "string",
    "age": "string",
    "gender": "string",
    "appearance": "string",
    "personality": "string",
    "background": "string",
    "motivation": "string",
    "relationship": "string",
    "development": "string",
    "raw_content": "string",
    "created_at": "string",
    "updated_at": "string"
  }
  ```

### 6.4 キャラクター詳細の更新

- **エンドポイント**: `/api/stories/{storyId}/character-details/{characterId}/`
- **メソッド**: PUT
- **リクエストボディ**:
  ```json
  {
    "name": "string",
    "role": "string",
    "age": "string",
    "gender": "string",
    "appearance": "string",
    "personality": "string",
    "background": "string",
    "motivation": "string",
    "relationship": "string",
    "development": "string",
    "raw_content": "string"
  }
  ```
- **レスポンス**:
  ```json
  {
    "id": "number",
    "ai_story": "number",
    "name": "string",
    "role": "string",
    "age": "string",
    "gender": "string",
    "appearance": "string",
    "personality": "string",
    "background": "string",
    "motivation": "string",
    "relationship": "string",
    "development": "string",
    "raw_content": "string",
    "created_at": "string",
    "updated_at": "string"
  }
  ```

### 6.5 キャラクター詳細の削除

- **エンドポイント**: `/api/stories/{storyId}/character-details/{characterId}/`
- **メソッド**: DELETE
- **レスポンス**: 204 No Content

### 6.6 AIによるキャラクター詳細の生成

- **エンドポイント**: `/api/stories/{storyId}/character-details/generate/`
- **メソッド**: POST
- **リクエストボディ**:
  ```json
  {
    "name": "string",
    "role": "string"
  }
  ```
- **レスポンス**:
  ```json
  {
    "id": "number",
    "ai_story": "number",
    "name": "string",
    "role": "string",
    "age": "string",
    "gender": "string",
    "appearance": "string",
    "personality": "string",
    "background": "string",
    "motivation": "string",
    "relationship": "string",
    "development": "string",
    "raw_content": "string",
    "created_at": "string",
    "updated_at": "string"
  }
  ```

## 7. 実装上の注意点

1. **キャラクター詳細の生成**:
   - フロントエンドでは、ユーザーが名前と役割を入力した後、AIによる詳細生成を要求できます。
   - バックエンドでは、Dify APIを使用して基本設定とキャラクター情報をもとに詳細を生成します。

2. **raw_content フィールド**:
   - フロントエンドから送信されたデータの元の形式を保持するために使用されます。
   - 手動入力の場合はJSONとして保存され、AI生成の場合はAPIからのレスポンスがそのまま保存されます。

3. **エラーハンドリング**:
   - フロントエンド側では、APIリクエスト失敗時にエラーメッセージをユーザーに表示します。
   - バックエンド側では、バリデーションエラーや処理エラーを適切なHTTPステータスコードとエラーメッセージで返します。

4. **キャラクター間の関係**:
   - `relationship` フィールドは、他のキャラクターとの関係を記述するためのテキストフィールドです。
   - 将来的には、より構造化されたデータとして実装することも検討されています。
