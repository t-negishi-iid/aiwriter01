# エピソード管理API

エピソード管理APIは、ストーリー内の各エピソードを管理するためのAPIです。
このAPIでは以下の操作が可能です:

- エピソード一覧の取得
- 複数エピソードの一括作成（AI）
- 単一エピソードの作成
- エピソード詳細の取得・更新・削除
- エピソード並び順の変更

すべてのAPIエンドポイントには認証が必要です。

## エンドポイント一覧

| メソッド | エンドポイント | 説明 |
|---------|--------------|------|
| GET | `/api/stories/{story_id}/acts/{act_number}/episodes/` | エピソード一覧取得 |
| POST | `/api/stories/{story_id}/acts/{act_number}/episodes/create/` | 複数エピソード一括作成（AI）|
| POST | `/api/stories/{story_id}/acts/{act_number}/episodes/` | 単一エピソード作成 |
| GET | `/api/stories/{story_id}/acts/{act_number}/episodes/{episode_number}/` | エピソード詳細取得 |
| PUT | `/api/stories/{story_id}/acts/{act_number}/episodes/{episode_number}/` | エピソード更新 |
| DELETE | `/api/stories/{story_id}/acts/{act_number}/episodes/{episode_number}/` | エピソード削除 |

## 1. エピソード一覧取得 API

### リクエスト

```http
GET /api/stories/{story_id}/acts/{act_number}/episodes/
```

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|----------|---|------|-----|
| story_id | integer | はい | ストーリーID |
| act_number | integer | はい | 幕番号 |

### レスポンス

#### 成功時 (200 OK)

```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "最初の出会い",
      "description": "主人公と相棒が初めて出会うシーン",
      "episode_number": 1,
      "act": 1,
      "created_at": "2025-03-15T10:30:45Z",
      "updated_at": "2025-03-15T10:30:45Z"
    },
    {
      "id": 2,
      "title": "謎の手がかり",
      "description": "主要な手がかりが発見されるシーン",
      "episode_number": 2,
      "act": 1,
      "created_at": "2025-03-15T10:35:20Z",
      "updated_at": "2025-03-15T10:35:20Z"
    },
    {
      "id": 3,
      "title": "対立の始まり",
      "description": "主人公たちの間で意見の対立が始まるシーン",
      "episode_number": 3,
      "act": 1,
      "created_at": "2025-03-15T10:40:10Z",
      "updated_at": "2025-03-15T10:40:10Z"
    }
  ]
}
```

#### エラー時

```json
{
  "detail": "認証エラーメッセージ" // 401 Unauthorized
}
```

または

```json
{
  "detail": "指定された幕が見つかりません" // 404 Not Found
}
```

## 2. 複数エピソード一括作成（AI）API

### リクエスト

```http
POST /api/stories/{story_id}/acts/{act_number}/episodes/create/
```

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|----------|---|------|-----|
| story_id | integer | はい | ストーリーID |
| act_number | integer | はい | 幕番号 |

#### リクエストボディ

```json
{
  "episode_count": 5
}
```

| パラメータ | 型 | 必須 | 説明 |
|----------|---|------|-----|
| episode_count | integer | はい | 生成するエピソード数 (1-10) |

### レスポンス

#### 成功時 (201 Created)

```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 4,
      "title": "突然の来訪者",
      "description": "謎の人物が主人公の元を訪れるシーン",
      "episode_number": 4,
      "act": 1,
      "created_at": "2025-03-15T11:20:45Z",
      "updated_at": "2025-03-15T11:20:45Z"
    },
    // 他のエピソード（省略）
  ],
  "status": "success",
  "message": "5つのエピソードが正常に作成されました"
}
```

#### エラーレスポンス

##### 認証エラー (401 Unauthorized)

```json
{
  "detail": "認証情報が提供されていません"
}
```

##### アクセス権限エラー (403 Forbidden)

```json
{
  "detail": "このリソースにアクセスする権限がありません"
}
```

##### リソース不存在エラー (404 Not Found)

```json
{
  "detail": "指定されたストーリーまたは幕が見つかりません"
}
```

##### パラメータエラー (400 Bad Request)

```json
{
  "error": "episode_countは1から10の間の値である必要があります"
}
```

##### クレジット不足エラー (402 Payment Required)

```json
{
  "error": "クレジットが不足しています",
  "required_credits": 5,
  "available_credits": 2
}
```

## 3. 単一エピソード作成 API

### リクエスト

```http
POST /api/stories/{story_id}/acts/{act_number}/episodes/
```

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|----------|---|------|-----|
| story_id | integer | はい | ストーリーID |
| act_number | integer | はい | 幕番号 |

#### リクエストボディ

```json
{
  "title": "新しいエピソード",
  "description": "新しいエピソードの説明"
}
```

| パラメータ | 型 | 必須 | 説明 |
|----------|---|------|-----|
| title | string | はい | エピソードのタイトル |
| description | string | いいえ | エピソードの説明 |

### レスポンス

#### 成功時 (201 Created)

```json
{
  "id": 9,
  "title": "新しいエピソード",
  "description": "新しいエピソードの説明",
  "episode_number": 4,
  "act": 1,
  "created_at": "2025-03-15T14:20:45Z",
  "updated_at": "2025-03-15T14:20:45Z"
}
```

#### エラー時

```json
{
  "error": "エラーメッセージ"
}
```

## 4. エピソード詳細取得 API

### リクエスト (詳細取得)

```http
GET /api/stories/{story_id}/acts/{act_number}/episodes/{episode_number}/
```

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|----------|---|------|-----|
| story_id | integer | はい | ストーリーID |
| act_number | integer | はい | 幕番号 |
| episode_number | integer | はい | エピソード番号 |

### レスポンス (詳細取得)

#### 成功時 (200 OK)

```json
{
  "id": 1,
  "title": "最初の出会い",
  "description": "主人公と相棒が初めて出会うシーン",
  "episode_number": 1,
  "act": 1,
  "created_at": "2025-03-15T10:30:45Z",
  "updated_at": "2025-03-15T10:30:45Z"
}
```

#### エラー時

```json
{
  "detail": "エラーメッセージ"
}
```

## 5. エピソード更新 API

### リクエスト (更新)

```http
PUT /api/stories/{story_id}/acts/{act_number}/episodes/{episode_number}/
```

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|----------|---|------|-----|
| story_id | integer | はい | ストーリーID |
| act_number | integer | はい | 幕番号 |
| episode_number | integer | はい | エピソード番号 |

#### リクエストボディ (通常更新)

```json
{
  "title": "更新されたタイトル",
  "description": "更新された説明"
}
```

#### リクエストボディ (並び順変更)

```json
{
  "episode_number": 3
}
```

| パラメータ | 型 | 必須 | 説明 |
|----------|---|------|-----|
| title | string | いいえ | 更新するタイトル |
| description | string | いいえ | 更新する説明 |
| episode_number | integer | いいえ | 更新するエピソード番号（変更すると順序が再調整される） |

### レスポンス (更新)

#### 成功時 (200 OK)

```json
{
  "id": 1,
  "title": "更新されたタイトル",
  "description": "更新された説明",
  "episode_number": 1,
  "act": 1,
  "created_at": "2025-03-15T10:30:45Z",
  "updated_at": "2025-03-15T15:45:12Z"
}
```

#### エラー時

```json
{
  "error": "エラーメッセージ"
}
```

## 6. エピソード削除 API

### リクエスト (削除)

```http
DELETE /api/stories/{story_id}/acts/{act_number}/episodes/{episode_number}/
```

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|----------|---|------|-----|
| story_id | integer | はい | ストーリーID |
| act_number | integer | はい | 幕番号 |
| episode_number | integer | はい | エピソード番号 |

### レスポンス (削除)

#### 成功時 (204 No Content)

空のレスポンスボディ

#### エラー時

```json
{
  "error": "エラーメッセージ"
}
```

## エピソード並び順変更の内部処理

エピソードの並び順を変更する際には、以下の処理が行われます:

1. エピソード番号（episode_number）を含むPUTリクエストを受信
2. 現在のエピソード番号と新しいエピソード番号を比較
3. 他のエピソードの番号を調整（トランザクション処理）
   - 移動先のエピソード番号が大きい場合: 間にあるエピソードの番号を1つ減らす
   - 移動先のエピソード番号が小さい場合: 間にあるエピソードの番号を1つ増やす
4. 対象エピソードを指定の位置に移動
5. PostgreSQLのバルク更新機能を使用して効率的に処理

### 並び順変更の例

例えば、エピソード1を3の位置に移動したい場合:

1. エピソード1の`episode_number`を3に更新
2. エピソード2と3の`episode_number`を1つ減らす（2→1, 3→2）
3. 最終的にエピソードの順序は: [2, 3, 1, 4, 5] → [3, 1, 2, 4, 5]（ID順）

## 認証と権限

すべてのAPIエンドポイントには認証が必要です。また、ユーザーは以下の条件を満たす必要があります:

1. 認証済みのユーザーであること
2. 対象ストーリーの所有者であること

権限がない場合は、適切なHTTPステータスコード（401 Unauthorized または 403 Forbidden）とエラーメッセージが返されます。

## エラーハンドリング

APIは以下のようなエラーハンドリングを実装しています:

1. **認証エラー**: 401 Unauthorized
2. **権限エラー**: 403 Forbidden
3. **リソース不存在エラー**: 404 Not Found
4. **パラメータ検証エラー**: 400 Bad Request
5. **クレジット不足エラー**: 402 Payment Required
6. **サーバーエラー**: 500 Internal Server Error

エラーレスポンスには常に明確なエラーメッセージが含まれ、可能な場合は追加情報も提供されます。
