# Next.jsとDjangoのAPI連携修正

## 問題点

フロントエンド（Next.js）とバックエンド（Django）間のAPI連携に問題が発生していました：

1. エラー内容:
   - ブラウザで`http://localhost:3000/stories`にアクセスすると`404 Not Found`エラー
   - 具体的なエラー: `http://localhost:3000/api/stories 404 Not Found`
   - Django側のエラーメッセージ: `"/app/api/stories" が存在しません`

2. 問題の原因:
   - URL構造の不一致:
     - Next.jsのAPIリクエストが`/api/api/stories`のような二重パスになっていた可能性
     - Dockerコンテナ内のパス解決の問題（`/app/api/stories`が見つからない）
   - Next.jsのリライト設定とDjangoのURLルーティングの不整合

## 修正内容

### 1. フロントエンドのAPIベースURL設定を修正

`ai_novel/frontend/src/lib/api-client.ts`:

```javascript
// 修正前
const API_BASE_URL = '/api';

// 修正後
// Next.jsのリライト設定があるため、先頭の/apiは不要
const API_BASE_URL = '';
```

### 2. Next.jsのAPI URL構築ロジックを修正

`ai_novel/frontend/src/lib/api-client.ts`:

```javascript
// 修正前
const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
const url = `${currentUrl}${API_BASE_URL}${normalizedEndpoint}`

// 修正後
let url;
if (typeof window !== 'undefined') {
  // ブラウザ環境の場合：相対URLを使用（Next.jsのリライト機能を使う）
  url = `/api${normalizedEndpoint}`;
} else {
  // サーバー環境の場合：環境変数の絶対URLを使用
  const apiUrl = process.env.NEXT_PUBLIC_API_DIRECT_URL || 'http://localhost:8001';
  url = `${apiUrl}/api${normalizedEndpoint}`;
}
```

### 3. Next.js設定ファイルに環境変数設定を追加

`ai_novel/frontend/next.config.js`:

```javascript
// ビルド時の環境変数設定を追加
env: {
  NEXT_PUBLIC_API_DIRECT_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
},
```

## 解決のポイント

1. **二重パスの解消**:
   - API_BASE_URLを空文字列に設定
   - リクエスト時に正しいAPI URLを構築

2. **SSR対応**:
   - クライアント側とサーバー側で異なるURL解決ロジックを使用
   - クライアント側: 相対パスでNext.jsのリライト機能を活用
   - サーバー側: 環境変数の絶対URLを使用

3. **環境変数の適切な管理**:
   - Next.jsのビルド時に環境変数を設定
   - フォールバック値の提供

## テスト方法

1. フロントエンドとバックエンドを起動

   ```bash
   cd ai_novel
   docker-compose up -d
   ```

2. ブラウザで以下のURLにアクセス
   - `http://localhost:3001/stories` - 小説一覧画面が正常に表示されるか確認
   - `http://localhost:3001/stories/new` - 新規小説作成画面が正常に表示されるか確認

3. 開発者ツールのネットワークタブでAPIリクエストを確認
   - `/api/stories`へのリクエストが正常にステータス200で返ってくるか確認
   - レスポンスデータが正しく構造化されているか確認

## 補足

今回の対応は、Next.jsとDjangoが別々のサーバーで動作する環境を前提としています。この設定により:

1. 開発環境では:
   - Next.js: `http://localhost:3001`
   - Django: `http://localhost:8001`
   - Next.jsのリライト機能により、API通信を透過的に処理

2. 本番環境では:
   - 環境変数`NEXT_PUBLIC_API_URL`を適切に設定することで、異なるAPI URLに対応可能
   - URLの相対パス/絶対パスの扱いが正しく機能

この修正により、フロントエンドとバックエンドの連携問題が解決され、安定したAPI通信が可能になりました。
