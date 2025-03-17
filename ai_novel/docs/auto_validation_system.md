# 自動バリデーションシステム

## 概要

本ドキュメントは、コードの品質を自動的にチェックし、一般的なバグやエラーを未然に防ぐための自動バリデーションシステムについて説明します。特に、インポートエラーなどの基本的な問題を事前に発見し、バックエンドサービスの停止を防ぐことを目的としています。

## 自動チェックツール

### 1. インポート検証ツール（importcheck.py）

#### 目的

モジュールのインポートが正常に行えるかを事前に検証し、インポートエラーを未然に防ぎます。

#### 実装

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
# filename: importcheck.py

"""
モジュールのインポートが正常に行えるかを検証するスクリプト
"""

import importlib
import sys
import os

def test_imports(module_path):
    """
    指定されたモジュールをインポートテストし、結果を返す

    Args:
        module_path (str): テスト対象のモジュールパス（ドット区切り）

    Returns:
        bool: インポート成功ならTrue、失敗ならFalse
    """
    try:
        importlib.import_module(module_path)
        print(f"✓ {module_path} - インポート成功")
        return True
    except ImportError as e:
        print(f"✗ {module_path} - インポートエラー: {str(e)}")
        return False
    except Exception as e:
        print(f"! {module_path} - 予期せぬエラー: {str(e)}")
        return False

def get_all_modules(base_dir, base_package):
    """
    指定ディレクトリ内のすべてのPythonモジュールを取得

    Args:
        base_dir (str): 検索対象のディレクトリパス
        base_package (str): ベースとなるパッケージ名

    Returns:
        list: モジュールパスのリスト
    """
    modules = []

    for root, dirs, files in os.walk(base_dir):
        package_path = root.replace(base_dir, '').replace('/', '.').lstrip('.')
        if package_path:
            package = f"{base_package}.{package_path}" if base_package else package_path
        else:
            package = base_package

        for file in files:
            if file.endswith('.py') and not file.startswith('__'):
                module_name = file[:-3]  # 拡張子を除去
                module_path = f"{package}.{module_name}" if package else module_name
                modules.append(module_path)

    return modules

def main():
    """メイン関数"""
    # 固定でチェックする重要モジュール
    critical_modules = [
        "reactions.serializers",
        "reactions.views",
        "reactions.urls",
        "novels.serializers",
        "novels.views",
        "novels.urls",
        "users.serializers",
        "users.models"
    ]

    # 自動検出したモジュールをチェック（オプション）
    auto_detect = len(sys.argv) > 1 and sys.argv[1] == '--auto-detect'
    if auto_detect:
        backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
        detected_modules = get_all_modules(backend_dir, '')
        modules = list(set(critical_modules + detected_modules))
    else:
        modules = critical_modules

    # 結果集計
    success_count = 0
    fail_count = 0

    for module in modules:
        if test_imports(module):
            success_count += 1
        else:
            fail_count += 1

    # 結果表示
    total = success_count + fail_count
    print(f"\n==== インポートチェック結果 ====")
    print(f"合計: {total} モジュール")
    print(f"成功: {success_count} モジュール")
    print(f"失敗: {fail_count} モジュール")

    return 0 if fail_count == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
```

#### 使用方法

```sh
# Dockerコンテナ内で実行
docker-compose exec backend python importcheck.py

# 自動検出オプション付き
docker-compose exec backend python importcheck.py --auto-detect
```

### 2. バックエンド起動前検証スクリプト（validate-backend.sh）

#### 目的

バックエンドの起動前に、基本的なチェックを実行し、潜在的な問題を事前に発見します。

#### 実装

```bash
#!/bin/bash
# filename: validate-backend.sh

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}==== バックエンド検証開始 ====${NC}"

# 1. 構文チェック
echo -e "\n${YELLOW}1. Python構文チェック実行中...${NC}"
docker-compose exec -T backend python -m pyflakes . > /tmp/pyflakes_output.txt 2>&1
if [ $? -eq 0 ] && [ ! -s /tmp/pyflakes_output.txt ]; then
    echo -e "${GREEN}✓ 構文エラーはありません${NC}"
else
    echo -e "${RED}✗ 構文エラーが見つかりました:${NC}"
    cat /tmp/pyflakes_output.txt
    echo ""
fi

# 2. インポートチェック
echo -e "\n${YELLOW}2. モジュールインポートチェック実行中...${NC}"
docker-compose exec -T backend python -c "
import importlib
import sys

modules = [
    'reactions.serializers',
    'reactions.views',
    'reactions.urls',
    'novels.serializers',
    'novels.views',
    'novels.urls',
    'users.serializers',
    'users.models'
]

failed = False
for module in modules:
    try:
        importlib.import_module(module)
        print(f'✓ {module} - インポート成功')
    except Exception as e:
        print(f'✗ {module} - エラー: {str(e)}')
        failed = True

sys.exit(1 if failed else 0)
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ すべてのモジュールが正常にインポートできました${NC}"
else
    echo -e "${RED}✗ 一部モジュールのインポートに失敗しました${NC}"
    VALIDATION_FAILED=true
fi

# 3. URLパターンの検証
echo -e "\n${YELLOW}3. URLパターン検証実行中...${NC}"
docker-compose exec -T backend python -c "
import sys
try:
    from django.core.management import execute_from_command_line
    execute_from_command_line(['manage.py', 'check'])
    print('✓ URLパターンに問題はありません')
    sys.exit(0)
except Exception as e:
    print(f'✗ URLパターンに問題があります: {str(e)}')
    sys.exit(1)
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ URLパターンに問題はありません${NC}"
else
    echo -e "${RED}✗ URLパターンに問題があります${NC}"
    VALIDATION_FAILED=true
fi

# 4. 基本的なモデル検証
echo -e "\n${YELLOW}4. モデル検証実行中...${NC}"
docker-compose exec -T backend python -c "
import sys
try:
    from django.core.management import execute_from_command_line
    execute_from_command_line(['manage.py', 'validate'])
    print('✓ モデルに問題はありません')
    sys.exit(0)
except Exception as e:
    print(f'✗ モデルに問題があります: {str(e)}')
    sys.exit(1)
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ モデルに問題はありません${NC}"
else
    echo -e "${RED}✗ モデルに問題があります${NC}"
    VALIDATION_FAILED=true
fi

# 結果表示
echo -e "\n${YELLOW}==== バックエンド検証完了 ====${NC}"
if [ "$VALIDATION_FAILED" = true ]; then
    echo -e "${RED}! 検証に失敗しました。バックエンドの起動前に問題を修正してください。${NC}"
    exit 1
else
    echo -e "${GREEN}✓ すべての検証に成功しました。バックエンドを起動できます。${NC}"
    exit 0
fi
```

#### 使用方法
```bash
# プロジェクトルートから実行
./validate-backend.sh

# 結果に応じてバックエンド起動
if ./validate-backend.sh; then
    docker-compose up -d backend
else
    echo "バックエンド起動を中止しました。問題を修正してください。"
fi
```

### 3. Gitプリコミットフック（pre-commit）

#### 目的
コードをコミットする前に自動的にチェックを実行し、問題のあるコードがリポジトリに入るのを防ぎます。

#### 実装

`.git/hooks/pre-commit`ファイルに以下の内容を追加します：

```bash
#!/bin/bash
# filename: pre-commit

set -e

echo "プリコミットフック実行中..."

# バックエンドの検証
if [ -f ./validate-backend.sh ]; then
    echo "バックエンド検証実行中..."
    ./validate-backend.sh
    if [ $? -ne 0 ]; then
        echo "バックエンド検証に失敗しました。コミットを中止します。"
        exit 1
    fi
fi

# インポートチェック
echo "モジュールインポートチェック実行中..."
docker-compose exec -T backend python importcheck.py
if [ $? -ne 0 ]; then
    echo "インポートチェックに失敗しました。コミットを中止します。"
    exit 1
fi

echo "すべてのチェックに成功しました。コミットを続行します。"
exit 0
```

#### 設定方法
```bash
# フックを実行可能にする
chmod +x .git/hooks/pre-commit
```

### 4. CI/CDパイプライン統合（GitHub Actions用）

#### 目的
プッシュやプルリクエスト時に自動的にコードの検証を行い、問題を早期に発見します。

#### 実装

`.github/workflows/code-validation.yml`ファイルに以下の内容を追加します：

```yaml
# filename: code-validation.yml
name: Code Validation

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Set up Docker
        uses: docker/setup-buildx-action@v1

      - name: Build Docker images
        run: docker-compose build

      - name: Start containers
        run: docker-compose up -d db redis

      - name: Python syntax validation
        run: docker-compose exec -T backend python -m pyflakes .

      - name: Import validation
        run: docker-compose exec -T backend python importcheck.py

      - name: Django check
        run: docker-compose exec -T backend python manage.py check

      - name: Model validation
        run: docker-compose exec -T backend python manage.py validate
```

## 継続的な検証プロセス

### 開発フロー

1. 新しい機能やバグ修正の開発を始める前に、自動検証ツールを実行
2. 変更を加えた後、コミット前に再度検証ツールを実行
3. CI/CDパイプラインで検証が行われたことを確認
4. 本番環境にデプロイする前に最終検証を実施

### 日常的なチェック

以下のコマンドを定期的に実行し、コードベースの健全性を維持します：

```bash
# モジュールインポートチェック
docker-compose exec backend python importcheck.py

# バックエンド全体検証
./validate-backend.sh
```

## トラブルシューティング

### よくある問題と解決方法

#### インポートエラー

```sh
✗ module_name - インポートエラー: No module named 'xxx'
```

**解決方法**：

1. モジュール名が正しいか確認
2. モジュールが実際に存在するか確認
3. `__init__.py`ファイルが各ディレクトリに存在するか確認
4. PYTHONPATHが正しく設定されているか確認

#### 構文エラー

```sh
✗ 構文エラーが見つかりました: SyntaxError: invalid syntax
```

**解決方法**：

1. エラーが報告された行を確認し、構文を修正
2. インデントが正しいか確認
3. 括弧、引用符などが閉じられているか確認

## 結論

自動バリデーションシステムを導入することで、次のようなメリットが得られます：

1. 基本的なエラーを早期に発見し、修正コストを削減
2. バックエンドサービスの突然の停止を防止
3. コードの品質維持と技術的負債の蓄積防止
4. チーム全体での一貫したコード品質の確保

このシステムを継続的に改善し、プロジェクトの特性に合わせたカスタマイズを行うことで、より効果的な品質保証が可能になります。
