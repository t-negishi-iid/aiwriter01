# エピソード本文API

エピソード本文APIは小説の各エピソードの本文を管理するためのエンドポイントを提供します。このAPIでは以下の操作が可能です：

- エピソード本文の取得
- エピソード本文の更新
- エピソード本文の削除
- エピソード本文の生成（AI）

すべてのAPIエンドポイントには認証が必要です。

## エンドポイント一覧

| メソッド | エンドポイント | 説明 |
|---------|--------------|------|
| GET | `/api/stories/{story_id}/acts/{act_number}/episodes/{episode_number}/content/` | エピソード本文取得 |
| PUT | `/api/stories/{story_id}/acts/{act_number}/episodes/{episode_number}/content/` | エピソード本文更新 |
| DELETE | `/api/stories/{story_id}/acts/{act_number}/episodes/{episode_number}/content/` | エピソード本文削除 |
| POST | `/api/stories/{story_id}/acts/{act_number}/episodes/{episode_number}/content/create/` | エピソード本文生成 |

## エピソード本文取得

### リクエスト

```http
GET /api/stories/{story_id}/acts/{act_number}/episodes/{episode_number}/content/
```

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|----------|---|------|-----|
| story_id | integer | はい | ストーリーID |
| act_number | integer | はい | 幕番号 |
| episode_number | integer | はい | エピソード番号 |

### レスポンス

#### 成功時 (200 OK)

```json
{
  "id": 1,
  "episode": 5,
  "content": "朝日が差し込む窓辺で、主人公は新しい冒険の準備を始めた...",
  "created_at": "2025-03-18T10:15:30Z",
  "updated_at": "2025-03-18T10:15:30Z"
}
```

#### エラー時

```json
{
  "error": "エピソード本文が見つかりません"
}
```

## エピソード本文更新

### リクエスト

```http
PUT /api/stories/{story_id}/acts/{act_number}/episodes/{episode_number}/content/
```

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|----------|---|------|-----|
| story_id | integer | はい | ストーリーID |
| act_number | integer | はい | 幕番号 |
| episode_number | integer | はい | エピソード番号 |

#### リクエストボディ

```json
{
  "content": "更新された本文の内容..."
}
```

| パラメータ | 型 | 必須 | 説明 |
|----------|---|------|-----|
| content | string | はい | エピソードの本文内容 |

### レスポンス

#### 成功時 (200 OK)

```json
{
  "id": 1,
  "episode": 5,
  "content": "更新された本文の内容...",
  "created_at": "2025-03-18T10:15:30Z",
  "updated_at": "2025-03-18T10:18:45Z"
}
```

#### エラー時

```json
{
  "error": "エラーメッセージ"
}
```

## エピソード本文削除

### リクエスト

```http
DELETE /api/stories/{story_id}/acts/{act_number}/episodes/{episode_number}/content/
```

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|----------|---|------|-----|
| story_id | integer | はい | ストーリーID |
| act_number | integer | はい | 幕番号 |
| episode_number | integer | はい | エピソード番号 |

### レスポンス

#### 成功時 (204 No Content)

空のレスポンスボディ

#### エラー時

```json
{
  "error": "エラーメッセージ"
}
```

## エピソード本文生成

### リクエスト

```http
POST /api/stories/{story_id}/acts/{act_number}/episodes/{episode_number}/content/create/
```

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|----------|---|------|-----|
| story_id | integer | はい | ストーリーID |
| act_number | integer | はい | 幕番号 |
| episode_number | integer | はい | エピソード番号 |

#### リクエストボディ

```json
{
  "guidance": "主人公が森で不思議な生き物と出会うシーン",
  "tone": "ミステリアス",
  "length": "medium"
}
```

| パラメータ | 型 | 必須 | 説明 |
|----------|---|------|-----|
| guidance | string | いいえ | 生成の方向性を示すガイダンス |
| tone | string | いいえ | 文章のトーン（例: 明るい、暗い、シリアス、ユーモラスなど） |
| length | string | いいえ | 生成する本文の長さ（short, medium, long） |

### レスポンス

#### 成功時 (200 OK)

```json
{
  "id": 1,
  "episode": 5,
  "content": "森の奥深く、日差しが木々の隙間から漏れる静かな場所で、主人公は足を止めた。不意に現れた青い光に気づき、慎重に近づいてみると...",
  "created_at": "2025-03-18T10:15:30Z",
  "updated_at": "2025-03-18T10:20:15Z",
  "status": "success"
}
```

#### エラー時

```json
{
  "error": "エラーメッセージ",
  "details": "詳細情報（ある場合）"
}
```

## エピソード本文生成の内部処理

エピソード本文生成は、DifyAPIを利用して実装されています。

### 処理フロー

1. ユーザー認証と権限チェック
2. エピソード情報の取得と関連データ（基本設定、キャラクター情報、幕情報）の収集
3. クレジット消費チェック
4. Dify APIへのリクエスト送信
   - エピソードのタイトルと内容
   - 基本設定情報
   - キャラクター情報
   - ガイダンス、トーン、長さの指定
5. 生成された本文の保存
6. レスポンス返却

### 特徴

- 非同期処理に対応（長文生成時に有効）
- トランザクション処理によるデータ整合性の確保
- AIリクエストのログ記録
- エラーハンドリングの実装
