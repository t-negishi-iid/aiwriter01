# エピソード詳細 仕様書

## 1. 概要

エピソード詳細は、AI小説執筆支援システムにおいて、小説の各エピソードの詳細を定義するためのデータです。あらすじ詳細（プロット詳細）をもとに、AIが小説の各エピソードを生成し、管理するために使用されます。

## 2. データ構造

### 2.1 フロントエンド側のデータ構造 (TypeScript)

```typescript
// エピソードの型定義
export interface Episode {
  id: number;
  ai_story: number | Story;
  act: number;         // 所属する幕（1, 2, 3）
  number: number;      // エピソード番号
  title: string;       // エピソードタイトル
  summary: string;     // エピソード概要
  raw_content?: string; // 生データ（任意）
  created_at: string;
  updated_at: string;
}

// エピソードコンテンツの型定義
export interface EpisodeContent {
  id: number;
  episode: number | Episode;
  content: string;     // エピソード本文
  raw_content?: string; // 生データ（任意）
  created_at: string;
  updated_at: string;
}
```

### 2.2 バックエンド側のデータ構造 (Django Model)

```python
class Episode(TimeStampedModel):
    """エピソード"""
    ai_story = models.ForeignKey(AIStory, on_delete=models.CASCADE, related_name='episodes')
    act = models.IntegerField(_('幕番号'))  # 1, 2, 3
    number = models.IntegerField(_('エピソード番号'))
    title = models.CharField(_('タイトル'), max_length=200)
    summary = models.TextField(_('概要'))
    raw_content = models.TextField(_('生データ'), blank=True, null=True)
    is_edited = models.BooleanField(_('編集済み'), default=False)

    class Meta:
        verbose_name = _('エピソード')
        verbose_name_plural = _('エピソード')
        ordering = ['act', 'number']
        unique_together = ('ai_story', 'number')

class EpisodeContent(TimeStampedModel):
    """エピソードコンテンツ"""
    episode = models.OneToOneField(Episode, on_delete=models.CASCADE, related_name='content')
    content = models.TextField(_('本文'))
    raw_content = models.TextField(_('生データ'), blank=True, null=True)
    is_edited = models.BooleanField(_('編集済み'), default=False)

    class Meta:
        verbose_name = _('エピソードコンテンツ')
        verbose_name_plural = _('エピソードコンテンツ')
```

## 3. フィールドの対応関係

### 3.1 エピソード

| フロントエンド (Episode) | バックエンド (Episode) | 説明 |
|--------------------------|------------------------|------|
| id                       | id                     | 一意のID |
| ai_story                 | ai_story               | 関連する小説 |
| act                      | act                    | 所属する幕（1, 2, 3） |
| number                   | number                 | エピソード番号 |
| title                    | title                  | エピソードタイトル |
| summary                  | summary                | エピソード概要 |
| raw_content              | raw_content            | 生データ |
| created_at               | created_at             | 作成日時 |
| updated_at               | updated_at             | 更新日時 |

### 3.2 エピソードコンテンツ

| フロントエンド (EpisodeContent) | バックエンド (EpisodeContent) | 説明 |
|--------------------------------|-------------------------------|------|
| id                             | id                            | 一意のID |
| episode                        | episode                       | 関連するエピソード |
| content                        | content                       | エピソード本文 |
| raw_content                    | raw_content                   | 生データ |
| created_at                     | created_at                    | 作成日時 |
| updated_at                     | updated_at                    | 更新日時 |

## 4. データフロー

### 4.1 エピソード生成のフロー

1. ユーザーがエピソードの生成を要求
2. フロントエンドが `generateEpisodes` API関数を呼び出し
3. バックエンドがあらすじ詳細（プロット詳細）を取得
4. Dify APIを使用してエピソードを生成
5. 生成されたエピソードを保存
6. フロントエンドに結果を返却

### 4.2 エピソードコンテンツ生成のフロー

1. ユーザーが特定のエピソードのコンテンツ生成を要求
2. フロントエンドが `generateEpisodeContent` API関数を呼び出し
3. バックエンドが該当エピソードの情報を取得
4. Dify APIを使用してエピソードコンテンツを生成
5. 生成されたコンテンツを保存
6. フロントエンドに結果を返却

### 4.3 バックエンドでのデータ処理

1. エピソード生成時：
   - `CreateEpisodeDetailView` がリクエストを受信
   - あらすじ詳細（プロット詳細）を取得
   - Dify APIを使用してエピソードを生成
   - 生成されたエピソードを保存

2. エピソードコンテンツ生成時：
   - `CreateEpisodeContentView` がリクエストを受信
   - エピソード情報を取得
   - Dify APIを使用してエピソードコンテンツを生成
   - 生成されたコンテンツを保存

## 5. API仕様

### 5.1 エピソード一覧の取得

- **エンドポイント**: `/api/stories/{storyId}/episodes/`
- **メソッド**: GET
- **レスポンス**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "number",
        "ai_story": "number",
        "act": "number",
        "number": "number",
        "title": "string",
        "summary": "string",
        "raw_content": "string",
        "created_at": "string",
        "updated_at": "string"
      }
    ]
  }
  ```

### 5.2 特定のエピソードの取得

- **エンドポイント**: `/api/acts/{storyId}/episodes/{episodeId}/`
- **メソッド**: GET
- **レスポンス**:
  ```json
  {
    "success": true,
    "data": {
      "id": "number",
      "ai_story": "number",
      "act": "number",
      "number": "number",
      "title": "string",
      "summary": "string",
      "raw_content": "string",
      "created_at": "string",
      "updated_at": "string"
    }
  }
  ```

### 5.3 エピソードコンテンツの取得

- **エンドポイント**: `/api/episodes/{episodeId}/content/`
- **メソッド**: GET
- **レスポンス**:
  ```json
  {
    "success": true,
    "data": {
      "id": "number",
      "episode": "number",
      "content": "string",
      "raw_content": "string",
      "created_at": "string",
      "updated_at": "string"
    }
  }
  ```

### 5.4 エピソードの生成

- **エンドポイント**: `/api/stories/{storyId}/create-episode-details/`
- **メソッド**: POST
- **リクエストボディ**: なし
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

### 5.5 エピソードコンテンツの生成

- **エンドポイント**: `/api/stories/{storyId}/create-episode-content/`
- **メソッド**: POST
- **リクエストボディ**:
  ```json
  {
    "episode_id": "number"
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

### 5.6 エピソードの更新

- **エンドポイント**: `/api/acts/{storyId}/episodes/{episodeId}/`
- **メソッド**: PATCH
- **リクエストボディ**:
  ```json
  {
    "title": "string",
    "summary": "string"
  }
  ```
- **レスポンス**:
  ```json
  {
    "success": true,
    "data": {
      "id": "number",
      "ai_story": "number",
      "act": "number",
      "number": "number",
      "title": "string",
      "summary": "string",
      "raw_content": "string",
      "created_at": "string",
      "updated_at": "string"
    }
  }
  ```

### 5.7 エピソードコンテンツの更新

- **エンドポイント**: `/api/episodes/{episodeId}/content/`
- **メソッド**: PATCH
- **リクエストボディ**:
  ```json
  {
    "content": "string"
  }
  ```
- **レスポンス**:
  ```json
  {
    "success": true,
    "data": {
      "id": "number",
      "episode": "number",
      "content": "string",
      "raw_content": "string",
      "created_at": "string",
      "updated_at": "string"
    }
  }
  ```

## 6. Dify API連携

### 6.1 エピソード生成API

```python
def create_episode_details(
    self,
    plot_detail: Dict[str, str],
    user_id: str,
    blocking: bool = True
) -> Dict[str, Any]:
    """
    エピソード詳細を生成

    Args:
        plot_detail: あらすじ詳細
        user_id: ユーザーID
        blocking: ブロッキングモード（同期処理）

    Returns:
        Dict[str, Any]: レスポンス
    """
    inputs = {
        "plot_detail": json.dumps(plot_detail, ensure_ascii=False)
    }

    return self._make_api_request("episode_detail", inputs, user_id, blocking)
```

### 6.2 エピソードコンテンツ生成API

```python
def create_episode_content(
    self,
    episode: Dict[str, Any],
    plot_detail: Dict[str, str],
    character_details: List[Dict[str, Any]],
    user_id: str,
    blocking: bool = True
) -> Dict[str, Any]:
    """
    エピソードコンテンツを生成

    Args:
        episode: エピソード情報
        plot_detail: あらすじ詳細
        character_details: キャラクター詳細リスト
        user_id: ユーザーID
        blocking: ブロッキングモード（同期処理）

    Returns:
        Dict[str, Any]: レスポンス
    """
    inputs = {
        "episode": json.dumps(episode, ensure_ascii=False),
        "plot_detail": json.dumps(plot_detail, ensure_ascii=False),
        "character_details": json.dumps(character_details, ensure_ascii=False)
    }

    return self._make_api_request("episode_content", inputs, user_id, blocking)
```

## 7. フロントエンド実装

### 7.1 エピソード一覧の表示

フロントエンドでは、エピソード一覧を幕ごとにグループ化して表示します。

```typescript
// エピソード一覧の取得
const getEpisodes = async (storyId: string | number): Promise<ApiResponse<Episode[]>> => {
  return fetchApi<Episode[]>(`/stories/${storyId}/episodes/`)
}

// エピソードの生成
const generateEpisodes = async (storyId: string | number): Promise<ApiResponse<TaskStatus>> => {
  return fetchApi<TaskStatus>(`/stories/${storyId}/create-episode-details/`, {
    method: "POST",
  })
}
```

### 7.2 エピソードコンテンツの表示と編集

```typescript
// エピソードコンテンツの取得
const getEpisodeContent = async (storyId: string | number, episodeId: string | number): Promise<ApiResponse<EpisodeContent>> => {
  return fetchApi<EpisodeContent>(`/episodes/${episodeId}/content/`)
}

// エピソードコンテンツの生成
const generateEpisodeContent = async (storyId: string | number, episodeId: string | number): Promise<ApiResponse<TaskStatus>> => {
  return fetchApi<TaskStatus>(`/stories/${storyId}/create-episode-content/`, {
    method: "POST",
    body: JSON.stringify({ episode_id: episodeId }),
  })
}

// エピソードコンテンツの更新
const updateEpisodeContent = async (storyId: string | number, episodeId: string | number, data: Partial<EpisodeContent>): Promise<ApiResponse<EpisodeContent>> => {
  return fetchApi<EpisodeContent>(`/episodes/${episodeId}/content/`, {
    method: "PATCH",
    body: JSON.stringify(removeEmptyValues(data)),
  })
}
```

## 8. 実装上の注意点

1. **エピソードと幕の関係**:
   - エピソードは特定の幕（act）に属します。
   - 幕ごとに複数のエピソードが存在し、それらは順序付けられています。

2. **エピソードとエピソードコンテンツの分離**:
   - エピソード（概要情報）とエピソードコンテンツ（本文）は別々のモデルとして管理されています。
   - これにより、概要情報の取得と本文の取得を分離し、必要に応じて本文を遅延ロードできます。

3. **エピソード生成の前提条件**:
   - エピソードを生成するには、事前にあらすじ詳細（プロット詳細）が作成されている必要があります。
   - あらすじ詳細が不足している場合は、適切なエラーメッセージを表示する必要があります。

4. **エピソードコンテンツ生成の前提条件**:
   - エピソードコンテンツを生成するには、事前にエピソード、あらすじ詳細、キャラクター詳細が作成されている必要があります。
   - これらが不足している場合は、適切なエラーメッセージを表示する必要があります。

5. **raw_content フィールド**:
   - APIからのレスポンスをそのまま保存するために使用されます。
   - 将来的な分析や再生成のために保持されます。

6. **非同期処理**:
   - エピソードとエピソードコンテンツの生成は時間がかかるため、非同期処理として実装されています。
   - タスクIDを返し、フロントエンドはタスクの完了を定期的にポーリングして確認します。
