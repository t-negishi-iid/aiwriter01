# あらすじ詳細生成 API

## 概要

あらすじ詳細生成APIは、基本設定データとキャラクター設定データを元に、小説の詳細なあらすじを生成するためのエンドポイントです。このAPIは第1幕、第2幕、第3幕を含む小説全体のあらすじを生成します。

## エンドポイント

```http
POST /api/stories/{story_id}/create-plot-detail/
```

## リクエスト

### パスパラメータ

| パラメータ | 型     | 必須 | 説明     |
|------------|--------|------|----------|
| story_id   | integer | はい | 小説のID |

### リクエストボディ

```json
{
  "basic_setting_id": 123
}
```

| パラメータ      | 型     | 必須 | 説明                      |
|-----------------|--------|------|---------------------------|
| basic_setting_id | integer | はい | 基本設定のID              |

## レスポンス

### 成功時 (200 OK)

```json
{
  "id": 456,
  "story": 123,
  "act_number": 1,
  "title": "第1幕：疑惑の影編",
  "content": "...",
  "updated_at": "2025-03-18T05:15:08.882Z",
  "created_at": "2025-03-18T05:15:08.882Z"
}
```

| フィールド  | 型     | 説明                          |
|------------|--------|-------------------------------|
| id         | integer | あらすじ詳細のID               |
| story      | integer | 小説のID                      |
| act_number | integer | 幕番号（1, 2, または 3）      |
| title      | string  | 幕のタイトル                  |
| content    | string  | 幕の詳細内容                  |
| updated_at | string  | 更新日時（ISO 8601形式）      |
| created_at | string  | 作成日時（ISO 8601形式）      |

### エラー時 (4xx/5xx)

```json
{
  "error": "あらすじ詳細の生成に失敗しました",
  "details": "エラーの詳細メッセージ"
}
```

| フィールド | 型     | 説明                 |
|------------|--------|----------------------|
| error      | string | エラーメッセージ     |
| details    | string | エラーの詳細情報     |

## エラーコード

| ステータスコード | 説明                                      |
|------------------|-------------------------------------------|
| 400 Bad Request  | リクエストパラメータが不正                 |
| 401 Unauthorized | 認証が必要または認証が失敗                |
| 404 Not Found    | 指定されたリソースが見つからない           |
| 500 Server Error | サーバー内部エラー（APIリクエスト失敗など）|

## リクエスト例

```bash
curl -X POST http://localhost:8001/api/stories/24/create-plot-detail/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"basic_setting_id": 123}'
```

## 注意事項

- このAPIはDify APIを使用して詳細あらすじを生成します
- API実行にはOpenAIのレート制限があります。制限に達した場合はエラーが返されます
- 生成には数十秒かかる場合があります
- レスポンスで返されるのは第1幕のデータのみで、第2幕と第3幕は別途取得する必要があります
