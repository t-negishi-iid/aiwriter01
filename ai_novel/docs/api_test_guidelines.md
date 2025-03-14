# API テストガイドライン

このドキュメントでは、AI Novel Writing Systemにおけるフロントエンドとバックエンドの疎通確認およびAPI機能テストの方法について説明します。本ガイドラインは「Django / Next.js 一気通貫テストシステム」の一部として機能します。包括的なテスト方法論については、[django_nextjs_e2e_testing.md](django_nextjs_e2e_testing.md)を参照してください。

【重要】本テストの目的は、システム全体が正常系のワークフローが完全に動作する状態を迅速に確保することです。テストを成功させることはそのための手段にすぎず、目的ではありません。従ってテストを成功させるためにテストプログラムを修正するのではなく、正しい仕様で動くようにバックエンドを修正し、バックエンドの仕様通りに動かすためにフロントエンドを修正してください。

## 1. 疎通確認の基本概念

フロントエンドとバックエンドの連携を確保するため、以下の仕組みを実装しています：

### 1.1 疎通確認用エンドポイント

- **バックエンド**: `/api/is_live/` - 認証不要で `{ "results": "live" }` を返す
- **フロントエンド**: `/api/is_live` - バックエンドの疎通確認エンドポイントに転送

### 1.2 視覚的確認ツール

- Web UI: `/tools/connection-test` - ブラウザから接続状態を確認

## 2. テスト方法

### 2.1 テストスクリプトの基本構造

テストスクリプトは `ai_novel/tests/` ディレクトリ内に TypeScript ファイルとして実装されています。
各機能のテストスクリプトは次の命名規則に従います：

```
test_[機能名].ts
```

例：`test_stories_new.ts` (小説作成API)、`test_characters.ts` (キャラクター関連API)

### 2.2 テストモード

各テストスクリプトは以下のモードをサポートしています：

1. **インタラクティブモード**: ユーザー入力を求める対話式テスト
2. **パラメータ指定モード**: コマンドライン引数でパラメータを指定
3. **バックエンド直接アクセスモード**: フロントエンドをバイパスしてバックエンドに直接リクエスト
4. **比較モード**: フロントエンドとバックエンドの両方にリクエストし結果を比較
5. **自動テストモード**: CI/CD向けに成功/失敗を終了コードで返す

### 2.3 コマンドライン引数

標準的に実装すべきコマンドライン引数：

| 引数 | 省略形 | 説明 |
|------|-------|------|
| `--help` | `-h` | ヘルプを表示 |
| `--backend-direct` | `-b` | バックエンドに直接アクセス |
| `--compare` | `-c` | フロントエンドとバックエンドの結果を比較 |
| `--test` | | 自動テストモード（終了コード0/1で結果を返す） |
| `--random` | | ランダムデータを生成してテスト |

機能固有のパラメータも追加可能（例：`--title "タイトル"` など）

### 2.4 テスト項目

1. 小説 (Story)
2. 基本設定作成用データ (BasicSettingData)
3. 基本設定 (BasicSetting)
4. キャラクター (Character)
5. プロット/あらすじ (Plot/Act)
6. エピソード (Episode)
7. エピソード本文 (EpisodeContent)
8. タイトル生成 (Title)

### 2.5 テストデータ

basic-setting-data 以降のテストは、前のワークフローの成果データを必要とします。
そこで、前のテストによって取得した成果データは、ai_novel/tests/data/ 以下に保存し、後のテストで流用可能にしてください。

ai_novel/tests/data/
|-BasicSetting
|-BasicSettingData
|-Character
|-Plot_Act
|-Episode
|-EpisodeContent
|-Title

## 3. 新しい機能のテスト実装ガイド

新機能のテストスクリプトを実装する際の標準的な手順：

### 3.1 基本テンプレート

```typescript
/**
 * [機能名]APIテストスクリプト
 */
import * as readline from 'readline';
import fetch from 'node-fetch';

// APIのベースURL
const FRONTEND_API_URL = 'http://localhost:3000/api';
const BACKEND_API_URL = 'http://localhost:8001/api';

// コマンドライン引数の解析
interface CommandLineArgs {
  // 標準引数
  help?: boolean;
  backendDirect?: boolean;
  compareMode?: boolean;
  test?: boolean;
  random?: boolean;
  // 機能固有の引数
  id?: string;  // リソースID
  action?: string; // アクション (create, update, delete など)
  // その他の機能固有パラメータ
  // title?: string; など
}

// コマンドライン引数を解析する関数
function parseCommandLineArgs(): CommandLineArgs {
  const args: CommandLineArgs = {};

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];

    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--backend-direct' || arg === '-b') {
      args.backendDirect = true;
    } else if (arg === '--compare' || arg === '-c') {
      args.compareMode = true;
    } else if (arg === '--test') {
      args.test = true;
    } else if (arg === '--random') {
      args.random = true;
    }
    // クエリパラメータ形式に対応した機能固有の引数処理
    else if (arg === '--id' && i + 1 < process.argv.length) {
      args.id = process.argv[++i];
    } else if (arg === '--action' && i + 1 < process.argv.length) {
      args.action = process.argv[++i];
    }
    // 例: その他の機能固有パラメータ
    else if (arg === '--title' && i + 1 < process.argv.length) {
      args.title = process.argv[++i];
    }
  }

  return args;
}

// APIリクエスト関数
async function makeApiRequest(params, apiUrl, apiLabel = 'API') {
  try {
    // クエリパラメータ形式のURLを構築する例
    let endpoint = `${apiUrl}/resource`;

    // 機能に応じたクエリパラメータの追加
    if (params.id) {
      endpoint += `?id=${params.id}`;
    }

    // アクションがある場合はアクションを追加
    if (params.action) {
      endpoint += endpoint.includes('?') ? `&action=${params.action}` : `?action=${params.action}`;
    }

    // バックエンドの場合はREST形式のURLに変換
    if (apiLabel === 'バックエンド') {
      if (params.id && params.action !== 'create') {
        // バックエンドでのID指定形式 /resource/{id}/
        endpoint = `${apiUrl}/resource/${params.id}/`;
      } else if (params.action === 'create') {
        // バックエンドでの作成エンドポイント /resource/
        endpoint = `${apiUrl}/resource/`;
      }
    }

    // APIリクエストの実行
    const response = await fetch(endpoint, {
      method: 'GET', // または 'POST', 'PATCH', 'DELETE' など
      headers: {
        'Content-Type': 'application/json',
      },
      // POSTなどの場合はbodyも設定
      // body: JSON.stringify(params),
    });

    const data = await response.json();
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// 結果比較関数
function compareResults(frontendResult, backendResult) {
  // 結果の比較ロジック
  // ...
  return areEqual;
}

// メイン実行関数
async function main() {
  try {
    const args = parseCommandLineArgs();

    if (args.help) {
      showHelp();
      return;
    }

    // パラメータの準備
    // ...

    if (args.compareMode) {
      // 比較モード
      const frontendResult = await makeApiRequest(params, FRONTEND_API_URL, 'フロントエンド');
      const backendResult = await makeApiRequest(params, BACKEND_API_URL, 'バックエンド');

      const isMatch = compareResults(frontendResult, backendResult);

      if (args.test) {
        process.exit(isMatch ? 0 : 1);
      }
    } else {
      // 単一APIモード
      const apiUrl = args.backendDirect ? BACKEND_API_URL : FRONTEND_API_URL;
      const apiLabel = args.backendDirect ? 'バックエンド' : 'フロントエンド';

      const result = await makeApiRequest(params, apiUrl, apiLabel);

      // 結果の処理
      if (args.test) {
        process.exit(result.success ? 0 : 1);
      }
    }
  } catch (error) {
    console.error('実行エラー:', error);
    if (args.test) process.exit(1);
  }
}

main().catch(console.error);
```

### 3.2 実装手順

1. テストスクリプトのファイルを作成（`test_[機能名].ts`）
2. 機能固有の引数を定義
3. API呼び出し関数を実装
4. 結果表示・比較ロジックを実装
5. 必要に応じてヘルプメッセージをカスタマイズ

### 3.3 比較ロジックのカスタマイズ

機能ごとに重要な比較ポイントが異なるため、`compareResults()` 関数を適切にカスタマイズしてください。
一般的な比較ポイント：

- HTTP ステータスコード
- 成功/失敗フラグ
- レスポンスの構造
- 重要なフィールドの値

## 4. テスト実行の推奨手順

### 4.1 新機能実装後のテスト

新機能を実装した後の標準的なテスト手順：

1. バックエンド直接アクセスでのテスト

   ```bash
   npx ts-node test_[機能名].ts --backend-direct
   ```

2. フロントエンドを通したテスト

   ```bash
   npx ts-node test_[機能名].ts
   ```

3. 比較テストの実施

   ```bash
   npx ts-node test_[機能名].ts --compare
   ```

### 4.2 CI/CD パイプラインでの利用

CI/CD パイプラインでは自動テストモードを使用：

```bash
npx ts-node test_[機能名].ts --test
```

失敗時は終了コード 1 を返すため、CI/CD のテストステップとして組み込み可能です。

### 4.3 バグ調査のためのテスト

フロントエンドとバックエンド間で問題が発生した場合：

1. まず疎通確認を実行

   ```bash
   curl http://localhost:3000/api/is_live
   ```

2. バックエンド直接アクセスでテスト

   ```bash
   npx ts-node test_[機能名].ts --backend-direct
   ```

3. 比較モードで詳細な差異を確認

   ```bash
   npx ts-node test_[機能名].ts --compare
   ```

## 5. 既存のテストスクリプト

現在実装されているテストスクリプト：

- `test_stories_new.ts` - 小説作成APIテスト
  - 旧形式: `/api/stories/new` (フロントエンド) → `/api/stories/` (バックエンド)
  - 新形式: `/api/stories?action=create` (フロントエンド) → `/api/stories/` (バックエンド)
  - 旧形式は後方互換性のためにサポートされていますが、新規実装では新形式を使用してください

## 6. ベストプラクティス

1. **一貫性を保つ**: すべてのテストスクリプトで同じパターンとオプションを使用
2. **エラーハンドリング**: 適切なエラーメッセージとエラー処理を行う
3. **詳細なログ出力**: 何が起きているかを明確に示すログを出力
4. **パラメータ検証**: リクエスト前にパラメータの有効性を確認
5. **独立したテスト**: テストは他のテストに依存せず単独で実行可能に
6. **ランダムデータサポート**: 自動テスト用にランダムデータ生成をサポート
7. **コメント**: コードに適切なコメントを追加して理解しやすくする
8. **クエリパラメータの適切な処理**:
   - クエリパラメータ形式（例：`/api/resource?id=123&action=update`）を適切に構築する
   - パラメータのエスケープ（特殊文字やURLエンコードが必要な値）を正しく行う
   - フロントエンド（クエリパラメータ形式）とバックエンド（REST形式）の違いを考慮する
9. **URL違いへの対応**: フロントエンドとバックエンドでのURLパターンの違いを適切に処理する
10. **後方互換性テスト**: 旧URLパターンと新URLパターン両方でテストを実施する

## 7. 既知の問題と対処法

1. **タイミング問題**: バックエンドの起動直後はレスポンスが遅い場合があるため、適切なタイムアウト設定を行う
2. **パスの違い**: フロントエンドとバックエンドでパスが異なる場合がある
   - 新しいクエリパラメータ形式: フロントエンド `/api/stories?action=create` vs バックエンド `/api/stories/`
   - 旧URLパターンも後方互換性のために維持（例: `/api/stories/new` → 内部的に `/api/stories?action=create` にリダイレクト）
3. **認証の違い**: バックエンド直接アクセス時は認証が必要な場合がある
4. **URLパターンの違い**: フロントエンドはクエリパラメータ形式（例: `/stories?id=123`）、バックエンドはREST形式（例: `/stories/123/`）

---

このガイドラインに従うことで、フロントエンドとバックエンド間の連携を確保し、一貫性のあるテスト環境を構築できます。
