# AI Novel Writing System テスト環境

このディレクトリには、AI Novel Writing Systemのフロントエンドとバックエンドの疎通確認およびAPI機能テストのためのスクリプトとツールが含まれています。

## セットアップ

テストスクリプトを実行するには、まず必要な依存関係をインストールする必要があります：

```bash
# テストディレクトリに移動
cd ai_novel/tests

# 依存関係のインストール
npm install
```

## 前提条件

テストを実行する前に、以下の条件を満たす必要があります：

1. バックエンドサーバーが稼働している（デフォルトでは `http://localhost:8001`）
2. フロントエンドサーバーが稼働している（デフォルトでは `http://localhost:3000`）

Docker環境を使用している場合は、以下のコマンドで起動できます：

```bash
docker-compose up -d
```

## 使用方法

### 疎通確認

システムの基本的な疎通確認は、以下の方法で行えます：

1. **ブラウザを使用**:
   - `http://localhost:3000/tools/connection-test` にアクセス

2. **APIエンドポイントを直接呼び出し**:

   ```bash
   # フロントエンド経由
   curl http://localhost:3000/api/is_live

   # バックエンド直接アクセス
   curl http://localhost:8001/api/is_live
   ```

### テストスクリプトの実行

各APIの機能テストは、対応するテストスクリプトを実行して行います：

```bash
# 小説作成APIのテスト
npx ts-node test_stories_new.ts

# ヘルプを表示
npx ts-node test_stories_new.ts --help
```

### 実行モード

テストスクリプトは以下のモードをサポートしています：

1. **インタラクティブモード** (デフォルト):

   ```bash
   npx ts-node test_stories_new.ts
   ```

2. **バックエンド直接アクセスモード**:

   ```bash
   npx ts-node test_stories_new.ts --backend-direct
   ```

3. **比較モード** (フロントエンドとバックエンドの両方をテストして結果を比較):

   ```bash
   npx ts-node test_stories_new.ts --compare --title "テスト小説"
   ```

4. **自動テストモード** (CI/CD向け):

   ```bash
   npx ts-node test_stories_new.ts --test --random
   ```

### コマンドライン引数

共通の引数：

| 引数 | 省略形 | 説明 |
|------|-------|------|
| `--help` | `-h` | ヘルプを表示 |
| `--backend-direct` | `-b` | バックエンドに直接アクセス |
| `--compare` | `-c` | フロントエンドとバックエンドの結果を比較 |
| `--test` | | 自動テストモード（終了コード0/1で結果を返す） |
| `--random` | | ランダムデータを生成してテスト |

その他、テスト対象の機能に応じた引数があります（詳細は各スクリプトのヘルプを参照）。

## 利用可能なテストスクリプト

現在、以下のテストスクリプトが実装されています：

- `test_stories_new.ts` - 小説作成APIのテスト

## トラブルシューティング

1. **依存関係エラー**:

   ```bash
   npm install
   ```

   を実行して、すべての依存関係がインストールされていることを確認してください。

2. **接続エラー**:
   - バックエンドとフロントエンドのサーバーが実行中であることを確認してください。
   - Docker環境を使用している場合は、コンテナが正常に起動しているか確認してください：

     ```bash
     docker-compose ps
     ```

3. **タイプスクリプトエラー**:
   - TypeScriptの型定義が正しくインストールされていることを確認してください：

     ```bash
     npm install @types/node @types/node-fetch --save-dev
     ```

## 詳細な情報

より詳細なAPIテストのガイドラインについては、[api_test_guidelines.md](../docs/api_test_guidelines.md)を参照してください。
