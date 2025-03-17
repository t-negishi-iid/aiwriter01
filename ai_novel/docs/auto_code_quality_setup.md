# コード品質自動チェック・修正・検証の統合ガイド

このドキュメントでは、プロジェクトにおける自動的なコード品質管理のための総合的なガイドラインを提供します。TypeScript/JavaScript、Python、Markdownファイルに対するコード品質チェックと修正の設定方法に加え、バックエンドの自動検証システムについても説明します。

## 目次

1. [前提条件](#前提条件)
2. [TypeScript/JavaScriptの設定](#typescriptjavascriptの設定)
3. [Pythonの設定](#pythonの設定)
4. [Markdownの設定](#markdownの設定)
5. [自動バリデーションシステム](#自動バリデーションシステム)
   - [インポート検証ツール](#1-インポート検証ツールimportcheckpy)
   - [バックエンド起動前検証スクリプト](#2-バックエンド起動前検証スクリプトvalidate-backendsh)
   - [継続的な検証プロセス](#3-継続的な検証プロセス)
   - [バリデーションのトラブルシューティング](#4-バリデーションのトラブルシューティング)
   - [トリガー方法](#5-トリガー方法)
6. [Git Hooks (pre-commit)の設定](#git-hooks-pre-commitの設定)
7. [CI/CDでの統合](#cicdでの統合)
8. [トラブルシューティング](#トラブルシューティング)

{{ ... }}

## 自動バリデーションシステム

{{ ... }}

### 5. トリガー方法

自動バリデーションシステムを効果的に機能させるためには、適切なタイミングで検証プロセスをトリガーする必要があります。以下に、様々なトリガー方法とその実装について説明します。

#### 5.1 トリガーオプション

##### a) Git Pre-commitフック

開発者がコードをコミットする前に自動的に検証を実行します。

**メリット:**
- コミット前に問題を検出できる
- 問題のあるコードがリポジトリに入るのを防ぐ

**実装方法:**
```bash
# .git/hooks/pre-commit ファイルを作成
#!/bin/bash
./validate-backend.sh
exit $?
```

##### b) Docker起動時のエントリーポイント

バックエンドのDockerコンテナが起動する際に自動的に検証を実行します。

**メリット:**
- 開発環境起動時に毎回検証される
- 開発者の手動操作が不要

**実装方法:**
docker-compose.ymlを編集:
```yaml
services:
  backend:
    # 他の設定...
    entrypoint: ["sh", "-c", "./validate-backend.sh && python manage.py runserver 0.0.0.0:8000"]
```

##### c) 起動スクリプトのラッパー

既存の起動コマンドをラップしたスクリプトで、起動前に検証を実行します。

**メリット:**
- 既存のワークフローを変更せずに導入できる
- 検証を経ていないバックエンドが起動するのを防ぐ

**実装例:** 次のセクションの`safe-start-backend.sh`を参照

##### d) CIパイプラインでの実行

継続的インテグレーション環境で、プルリクエストやマージ時に自動的に検証を実行します。

**メリット:**
- コード変更のたびに自動的に検証される
- 問題のあるコードがマージされるのを防ぐ

**実装方法:**
GitHub Actionsワークフローファイル (.github/workflows/validate.yml):
```yaml
name: Validate Backend
on: [pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Docker
        uses: docker/setup-buildx-action@v2
      - name: Validate Backend
        run: docker-compose run --rm backend ./validate-backend.sh
```

#### 5.2 推奨アプローチ: 多層防御

最も効果的なアプローチは、複数のトリガー方法を組み合わせた「多層防御」です：

1. 開発者のローカル環境でのPre-commitフック
2. 起動スクリプトラッパーによる検証
3. CIパイプラインでの最終検証

これにより、問題のあるコードが本番環境にデプロイされるリスクを最小限に抑えることができます。

#### 5.3 検証・起動スクリプトの構成

プロジェクトには以下の検証・起動スクリプトが含まれています：

1. **validate-backend.sh** - バックエンド検証スクリプト（プロジェクトルートに配置）
2. **start-backend.sh** - 安全なバックエンド起動スクリプト（プロジェクトルートに配置）
3. **backend/scripts/importcheck.py** - モジュールインポート検証ツール
4. **backend/scripts/validate-backend.sh** - 詳細なバックエンド検証ロジック
5. **backend/scripts/safe-start-backend.sh** - 詳細な安全起動ロジック

##### 5.3.1 プロジェクトルートのスクリプト

**validate-backend.sh**
- **目的**: バックエンドコードの検証のみを行い、問題がないか確認します
- **主な機能**:
  - Python構文チェック
  - モジュールインポートチェック
  - URLパターン検証
  - モデル検証
- **使用場面**:
  - コード変更後の問題確認
  - CI/CDパイプラインでの自動チェック
  - コードレビュー前の事前確認
  - デバッグ時の問題切り分け
- **使用方法**:
  ```bash
  ./validate-backend.sh
  ```

**start-backend.sh**
- **目的**: 検証を実行してから安全にバックエンドを起動します
- **主な機能**:
  - 自動的に検証を実行
  - 検証通過後のみバックエンドを起動
  - オプションで再構築をスキップ可能
- **使用方法**:
  ```bash
  # 標準的な起動（検証→停止→再構築→起動）
  ./start-backend.sh
  
  # 高速再起動（検証→再起動のみ）
  ./start-backend.sh --no-rebuild
  ```

##### 5.3.2 安全なバックエンド起動スクリプト (backend/scripts/safe-start-backend.sh)

以下に、バックエンドの安全な起動と再構築を行うスクリプトの実装例を示します：

```bash
#!/bin/bash
# filename: safe-start-backend.sh

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}バックエンド検証を実行します...${NC}"

# バックエンド検証を実行
./validate-backend.sh
VALIDATION_RESULT=$?

# 検証に成功した場合のみバックエンドを再構築・起動
if [ $VALIDATION_RESULT -eq 0 ]; then
    echo -e "${GREEN}検証に成功しました。バックエンドを再構築して起動します。${NC}"
    
    echo -e "${YELLOW}コンテナを停止中...${NC}"
    docker-compose down
    
    echo -e "${YELLOW}イメージを再ビルド中...${NC}"
    docker-compose build backend
    
    echo -e "${YELLOW}コンテナを起動中...${NC}"
    docker-compose up -d backend
    
    echo -e "${GREEN}バックエンドの再起動が完了しました。${NC}"
else
    echo -e "${RED}検証に失敗しました。バックエンドの起動を中止します。${NC}"
    exit 1
fi
```

##### オプション機能: 再構築のスキップ

時間を節約するために、再構築をスキップするオプションを追加することもできます：

```bash
#!/bin/bash
# filename: safe-start-backend.sh

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}バックエンド検証を実行します...${NC}"

# バックエンド検証を実行
./validate-backend.sh
VALIDATION_RESULT=$?

# 検証に成功した場合のみバックエンドを起動
if [ $VALIDATION_RESULT -eq 0 ]; then
    echo -e "${GREEN}検証に成功しました。${NC}"
    
    # コマンドライン引数に基づいて処理を分岐
    if [[ "$1" == "--no-rebuild" ]]; then
        echo -e "${YELLOW}再構築をスキップして再起動します...${NC}"
        docker-compose restart backend
    else
        echo -e "${YELLOW}完全な再構築を実行します...${NC}"
        
        echo -e "${YELLOW}コンテナを停止中...${NC}"
        docker-compose down
        
        echo -e "${YELLOW}イメージを再ビルド中...${NC}"
        docker-compose build backend
        
        echo -e "${YELLOW}コンテナを起動中...${NC}"
        docker-compose up -d backend
    fi
    
    echo -e "${GREEN}バックエンドの処理が完了しました。${NC}"
else
    echo -e "${RED}検証に失敗しました。バックエンドの起動を中止します。${NC}"
    exit 1
fi
```

**使用例:**
```bash
# 完全な再構築を伴う起動
./start-backend.sh

# 高速再起動（検証は行うが再構築はスキップ）
./start-backend.sh --no-rebuild
```

#### 5.4 スクリプトの実行順序

1. ユーザーが `./start-backend.sh` を実行
2. プロジェクトルートの `start-backend.sh` が `backend/scripts/safe-start-backend.sh` を呼び出す
3. `backend/scripts/safe-start-backend.sh` が `backend/scripts/validate-backend.sh` で検証を実行
4. 検証に成功した場合のみ、バックエンドの再構築・起動が行われる

この多層的なアプローチにより、間違いやすい操作を防ぎながら、常に検証済みのバックエンドが起動することを保証します。
