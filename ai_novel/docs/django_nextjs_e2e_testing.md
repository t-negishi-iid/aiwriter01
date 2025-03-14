# Django / Next.js 一気通貫テストシステム

このドキュメントでは、DjangoバックエンドとNext.jsフロントエンドを統合的にテストするプロセスを解説します。

## 概要

一気通貫テストシステムは、バックエンドからフロントエンドまでの全てのレイヤーを一貫して検証するためのテスト方法論です。各層のテストが互いに整合性を持ち、システム全体の信頼性を確保します。

![テストフロー](https://mermaid.ink/img/pako:eNqFkk9v2zAMxb8K4VMCNNiAHXvosV3bS4HtsA7eQYodR4gsGZLcNQj63SPLSTRDB2wnyc_vPZIy3jlvNIWMO9sVyDIWAcmxpPzrQT85WV-8Yq9bsR9ooPZCkSRfbZ_QCMvAa91j62xAl9AzspwKbr7EBhsU1oHv5J1PQVAFVsEJVzQQJfUNXqJiuIcfQg39F1y-dw7_5uO3QjRU4TpSSdSh5FN0KNDYK3gNwgX2Dg9kA0ZoWCXWQDqk_L5NeVG0YtPZAbAYP1bFZc2nh4RwjXsyvNONs-Hl3x_PnlkN1kLRUTtLGrYaFRMvGBk32F6hwVXCSU-QJZSCRiA5DYDkqLpNOE6o9oU0OyTYUIXm0bOPwAXZfAZZy9_D57c9ZZ9GnJrAoFCY8bMFORLPqKhgIzJu9INKtUNkdYW7XGbcNojyXS9Rn7OuwB7lsq_oc7Ys5zLs6W4um0ldL2VTTC77AK-HPeZ2avwuZ9w9nJ7sT1_QWKylc_YHXRNOYw?type=png)

## 実装ステップ

### 1. スルーAPI（プロキシAPI）の実装

スルーAPIは、フロントエンドからバックエンドへのリクエストを透過的に転送するAPIエンドポイントです。

#### バックエンド側（Django）

```python
# views/connectivity.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([AllowAny])
def is_live(request):
    """
    フロントエンドとバックエンドの疎通確認用の簡易エンドポイント
    認証不要でシンプルに "live" を返します
    """
    return Response({"results": "live"})
```

```python
# urls.py
from django.urls import path
from .views.connectivity import is_live

urlpatterns = [
    # 他のURL設定...
    path('is_live/', is_live, name='is-live'),
]
```

#### フロントエンド側（Next.js）

```typescript
// src/app/api/is_live/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const backendHost = process.env.BACKEND_HOST || 'localhost';
    const backendPort = process.env.BACKEND_PORT || '8001';
    const backendUrl = `http://${backendHost}:${backendPort}/api/is_live/`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'バックエンドAPIとの疎通確認に失敗しました',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
```

### 2. TypeScriptテストスクリプトの作成

バックエンドとフロントエンドの両方をテストするスクリプトを作成します。

```typescript
// tests/test_stories_new.ts
import fetch from 'node-fetch';

// APIのベースURL
const FRONTEND_API_URL = 'http://localhost:3000/api';
const BACKEND_API_URL = 'http://localhost:8001/api';

// コマンドライン引数の解析
interface CommandLineArgs {
  title?: string;
  random?: boolean;
  test?: boolean;
  help?: boolean;
  backendDirect?: boolean; // バックエンドに直接アクセスするかどうか
  compareMode?: boolean;   // フロントエンドとバックエンドの両方をテストして比較
}

// APIリクエスト関数
async function createStory(title: string, apiUrl: string, apiLabel: string = 'API') {
  try {
    console.log(`🔄 ${apiLabel}: 小説「${title}」を作成中...`);

    // 適切なエンドポイントを決定
    const endpoint = apiUrl === BACKEND_API_URL
      ? `${apiUrl}/stories/`  // バックエンドAPIの場合
      : `${apiUrl}/stories/new`;  // フロントエンドAPIの場合

    // APIリクエストを実行
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    // 結果を返す
    return { success: response.ok, data: await response.json() };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// メイン実行関数
async function main() {
  // 引数解析...

  // モードに応じたAPI実行
  if (args.compareMode) {
    // フロントエンドとバックエンドの両方をテスト...
  } else {
    // 単一のAPIテスト...
  }
}

main().catch(console.error);
```

### 3. バックエンドテストの実施

バックエンドAPIの仕様を確定させるためのテストを実行します。

```bash
# バックエンド直接テスト
npx ts-node test_stories_new.ts --backend-direct --random
```

- バックエンドAPIが期待通り動作することを確認
- レスポンスの構造や各フィールドを確認
- この段階で、バックエンドの仕様が**確定**します

### 4. フロントエンドテストの実施

フロントエンド経由でのAPIテストを実施します。

```bash
# フロントエンド経由テスト
npx ts-node test_stories_new.ts --random
```

- フロントエンドプロキシAPIが正しくバックエンドにリクエストを転送していることを確認
- レスポンスがバックエンドと同一形式であることを確認

### 5. フロントエンドとバックエンドの比較テスト

```bash
# 比較テスト
npx ts-node test_stories_new.ts --compare --random
```

- フロントエンドとバックエンドの両方にリクエストを送信
- レスポンスの一致を確認（ステータスコード、成功/失敗状態など）

### 6. CypressによるヘッドレスUIテスト

バックエンドテストで確定した仕様に基づいて、UIテストを実装します。

#### カスタムコマンドの実装

```typescript
// cypress/support/commands.ts
Cypress.Commands.add('createStory', (title: string) => {
  // タイトル入力フィールドにテキストを入力
  cy.get('input#title').clear().type(title);

  // 作成ボタンをクリック
  cy.contains('button', '小説を作成')
    .should('be.enabled')
    .click();
});
```

#### E2Eテスト実装

```typescript
// cypress/e2e/stories/create-story.cy.ts
describe('新規小説作成', () => {
  beforeEach(() => {
    // 各テスト前に新規小説作成ページにアクセス
    cy.visitNewStoryPage();
  });

  it('小説作成フォームが操作可能', () => {
    // ランダムなタイトルを生成
    cy.generateRandomTitle().then((title) => {
      // タイトル入力フィールドにテキストを入力
      cy.get('input#title').clear().type(title as string);

      // ボタンが有効になっていることを確認
      cy.get('button').not('[disabled]').should('exist');
    });
  });

  // その他のテスト...
});
```

#### テスト実行

```bash
# Cypressのヘッドレステスト実行
npm run cypress:headless
```

### 7. テストに基づくフロントエンド修正

ヘッドレスUIテストの結果に基づき、フロントエンドを修正します。

- テストが失敗する場合、バックエンドテストの仕様に合わせてフロントエンドを修正
- テスト成功まで繰り返し実行
- **重要**: フロントエンドのUI仕様がテストを妨げる場合は、UIを修正する（テストが優先）

## テスト方法論の目的

この一気通貫テストシステムの主な目的：

1. **正常系の動作を迅速に確定する**
   - バックエンドの仕様を早期に固定
   - その仕様に基づいてフロントエンドを実装・検証

2. **複数レイヤーの一貫性を確保する**
   - バックエンドとフロントエンドの整合性を保証
   - データの流れを一気通貫でテスト

3. **CI/CDパイプラインに組み込み可能**
   - 全てのテストは自動化可能
   - 終了コードによる成功/失敗判定

4. **開発の効率化**
   - テスト仕様が先行することでフロントエンド開発が明確に
   - 異なるチーム間の連携がスムーズに

## テスト実行の優先順位

1. バックエンド直接テスト → バックエンド仕様確定
2. フロントエンドプロキシテスト → 連携確認
3. ヘッドレスUIテスト → UI実装検証

## 実践上の注意点

- バックエンドテスト成功後は、バックエンドコードを「フリーズ」し、仕様変更を避ける
- フロントエンドは必要に応じてテストに合わせて修正する
- 不具合系のテストは最低限に留め、正常系の動作確認を優先する
- テスト環境（特にURL、ポート番号）は実行環境と揃える
