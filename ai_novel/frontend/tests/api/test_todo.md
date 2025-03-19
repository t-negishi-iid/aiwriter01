# シンプルな実APIを使用したテスト手順

## 1. 基本方針

- モックを使用せず、実際のバックエンドAPIに対してテストを実行
- エラーを隠さず、実際の挙動を確認する
- シンプルかつ直接的なアプローチでテストを実施

## 2. 実行環境の準備

- バックエンドサーバーが起動していることを確認
  ```bash
  # バックエンドの状態確認
  docker-compose ps
  
  # 必要に応じてバックエンドを起動
  docker-compose up -d ai_novel_backend ai_novel_db ai_novel_redis
  ```

## 3. テストスクリプトの作成

- 単純なFetch APIを使ったテストスクリプト作成
  ```typescript
  // api-tests.ts - シンプルなAPI疎通確認用スクリプト
  
  async function testApiEndpoint(endpoint: string, options = {}) {
    console.log(`Testing endpoint: ${endpoint}`);
    
    try {
      const response = await fetch(endpoint, options);
      const status = response.status;
      console.log(`Status: ${status}`);
      
      // レスポンスボディの取得
      let data = null;
      try {
        data = await response.json();
      } catch (e) {
        console.log('レスポンスボディなし、または解析エラー');
        return { success: false, status };
      }
      
      console.log('Response data:', data);
      return { success: true, status, data };
    } catch (error) {
      console.error('Error:', error);
      return { success: false, error };
    }
  }
  
  // エクスポート
  export { testApiEndpoint };
  ```

## 4. APIエンドポイントテスト実行

- 各APIエンドポイントに対して個別にテストを実行
  ```bash
  # TypeScriptをNode.jsで実行するためのセットアップ
  npm install -g ts-node
  
  # テスト実行スクリプト
  ts-node path/to/run-tests.ts
  ```

- 実行スクリプト例（`run-tests.ts`）
  ```typescript
  import { testApiEndpoint } from './api-tests';
  
  async function runAllTests() {
    console.log('==== API疎通テスト開始 ====');
    
    // ノベル一覧の取得テスト
    await testApiEndpoint('http://localhost:8000/api/novels/');
    
    // ユーザー情報取得テスト（認証あり）
    await testApiEndpoint('http://localhost:8000/api/users/me/', {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    });
    
    // 他のAPIエンドポイントテストを必要に応じて追加
    
    console.log('==== API疎通テスト完了 ====');
  }
  
  runAllTests().catch(console.error);
  ```

## 5. 手動テスト実施のガイドライン

1. **事前条件の設定**:
   - テスト用データが存在することを確認
   - ログイン状態/非ログイン状態の確認

2. **正常系テストの実施**:
   - 各APIエンドポイントに正しいパラメータでリクエスト
   - レスポンスのステータスコードと内容を確認

3. **エラー系テストの実施**:
   - 不正なパラメータでリクエスト
   - 認証が必要なAPIに認証なしでアクセス
   - 存在しないリソースへのアクセス

4. **結果検証**:
   - APIレスポンスの構造が仕様通りか
   - エラーメッセージが適切か
   - パフォーマンスは許容範囲内か

## 6. レポート作成

- テスト結果をテキストファイルに記録
  ```bash
  # テスト結果を記録
  ts-node path/to/run-tests.ts > test-results.txt
  ```

- 問題点と修正案を整理
  - レスポンス形式の不一致
  - エラー処理の不備
  - パフォーマンス問題

## 7. 自動化のヒント（任意）

シンプルなシェルスクリプトで定期的にAPIの疎通確認を行う:

```bash
#!/bin/bash

echo "APIテスト実行: $(date)"

# 各APIエンドポイントをcurlでテスト
curl -s http://localhost:8000/api/novels/ | jq '.count'
curl -s http://localhost:8000/api/some-endpoint/ | jq '.status'

echo "APIテスト完了"
```

## 8. 重要な注意点

- テスト用の専用データベースを使用する
- 実運用環境でのテスト実行は避ける
- テスト後のクリーンアップを忘れない
- 機密データを含むテスト結果の共有は避ける