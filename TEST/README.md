# Dify APIテスト

このディレクトリには、Dify APIとの連携をテストするためのコードが含まれています。

## テスト構成

```
TEST/
  ├── DifyAPI/               # Dify API テスト
  │   ├── config.py          # テスト設定
  │   ├── conftest.py        # pytest設定
  │   ├── test_utils.py      # テストユーティリティ
  │   ├── test_basic_setting_data_creation.py  # 基本設定作成用データ生成テスト
  │   └── ... (その他のテスト)
  ├── Dockerfile.test        # テスト用Dockerfile
  └── README.md              # このファイル
```

## CI/CDパイプラインでのテスト自動化

### GitHub Actionsの設定

プロジェクトのルートディレクトリにある`.github/workflows/dify_api_tests.yml`ファイルでGitHub Actionsの設定を行っています。この設定により、以下のタイミングで自動的にテストが実行されます：

- `main`または`develop`ブランチへのプッシュ時
- `main`または`develop`ブランチへのプルリクエスト時

### GitHub Secretsの設定

テストで使用するAPIキーを安全に管理するために、GitHub Secretsを設定する必要があります。以下の手順で設定してください：

1. GitHubリポジトリのページで「Settings」タブを選択
2. 左側のメニューから「Secrets and variables」>「Actions」を選択
3. 「New repository secret」ボタンをクリックして、以下のシークレットを追加：
   - `DIFY_API_KEY_BASIC_SETTING_DATA`
   - `DIFY_API_KEY_BASIC_SETTING`
   - `DIFY_API_KEY_CHARACTER_DETAIL`
   - `DIFY_API_KEY_PLOT_DETAIL`
   - `DIFY_API_KEY_EPISODE_DETAIL`
   - `DIFY_API_KEY_EPISODE_CONTENT`
   - `DIFY_API_KEY_TITLE`

### テスト結果の確認

GitHub Actionsのワークフローが実行されると、以下の情報が確認できます：

1. テスト成功・失敗の状態
2. テストカバレッジレポート
3. 詳細なテスト実行ログ

テスト結果はプルリクエストページやActionsタブから確認できます。

## ローカルでのテスト実行

### Dockerを使用したテスト

プロジェクトには、Dockerを使用してテストを実行するための設定が含まれています。以下のコマンドでテストを実行できます：

```bash
# テスト用のDockerコンテナを構築して実行
docker-compose -f docker-compose.test.yml up --build

# 既存のコンテナで再度テストを実行
docker-compose -f docker-compose.test.yml up
```

### 環境変数の設定

テストを実行する前に、以下の環境変数を設定することができます（省略可）：

- `DIFY_API_KEY_*`: 各API機能のAPIキー
- `DIFY_TEST_DEV_MODE`: `true`に設定すると実際のAPIを呼び出します（デフォルトは`false`）

例えば：

```bash
# 環境変数を設定してテストを実行
DIFY_TEST_DEV_MODE=true docker-compose -f docker-compose.test.yml up
```

### pytestを直接使用したテスト

Dockerを使用せずに直接pytestを実行することもできます：

```bash
# 必要なパッケージをインストール
pip install pytest pytest-cov pytest-mock requests

# テストを実行
PYTHONPATH=. pytest TEST/DifyAPI/ -v
```

## テスト実装のガイドライン

新しいDify API機能のテストを実装する場合は、以下のガイドラインに従ってください：

1. `test_<機能名>.py`という名前のファイルを作成
2. ユニットテストとモックを使用したテストを実装
3. 実際のAPIを呼び出すテストは、`@unittest.skip`デコレータを使用してスキップ可能にする
4. `test_utils.py`の共通関数を活用する

## モックの使用

CI/CDパイプラインや通常のテスト実行では、実際のDify APIを呼び出さないようにモックを使用します。テスト用のモックレスポンスは`test_utils.py`の`create_mock_dify_api()`関数で定義されています。

実際のAPIを呼び出してテストしたい場合は、環境変数`DIFY_TEST_DEV_MODE`を`true`に設定してください。
