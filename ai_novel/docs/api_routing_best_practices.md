# API ルーティングのベストプラクティス

このドキュメントでは、フロントエンド（Next.js）とバックエンド（Django）間のAPIルーティングに関する推奨事項と実装パターンを説明します。

## 背景

AI Novel Writing Systemでは、フロントエンドとバックエンドの間でAPIリクエストを転送する際、パスの構造と実装方法によって様々な課題があることが判明しました。特にNext.jsのApp Routerを使用する場合、ネストされた動的パラメータを含むパスでは安定性に欠ける場合があります。

## 推奨されるAPIパス構造

### バックエンド（Django）

バックエンドでは、RESTfulな設計原則に従って、リソースベースの階層的なパス構造を維持します：

```
/api/stories/                    # 小説リスト（GET）、小説作成（POST）
/api/stories/{id}/               # 小説詳細（GET）、更新（PUT/PATCH）、削除（DELETE）
/api/stories/{id}/basic-setting/ # 基本設定関連
/api/stories/{id}/characters/    # キャラクター関連
/api/stories/{id}/is_live/       # 動作確認用
```

### フロントエンド（Next.js）

フロントエンドでは、クエリパラメータを活用したフラットな構造を推奨します：

```
/api/story-detail?id={id}         # 小説詳細取得（GET）
/api/story-basic-setting?id={id}  # 基本設定関連
/api/story-characters?id={id}     # キャラクター関連
/api/story-is-live?id={id}        # 動作確認用
```

## 実装パターン

### バックエンドAPI転送の基本パターン

Next.jsからDjangoバックエンドへのリクエスト転送は以下のパターンで実装します：

```typescript
// route.ts
export async function GET(request: NextRequest) {
  try {
    // URLからクエリパラメータを取得
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'IDが指定されていません' }, { status: 400 });
    }

    // バックエンドの対応するエンドポイントにリクエスト
    const backendHost = process.env.BACKEND_HOST || 'localhost';
    const backendPort = process.env.BACKEND_PORT || '8001';
    const backendUrl = `http://${backendHost}:${backendPort}/api/stories/${id}/endpoint/`;

    console.log(`API: Forwarding request to ${backendUrl}`);

    // タイムアウト処理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒タイムアウト

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // レスポンスの処理
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    // バックエンドのレスポンスをそのまま返す
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API error:', error);

    // エラー処理
    return NextResponse.json(
      {
        error: 'APIリクエストに失敗しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
```

### テストの実装

フロントエンドとバックエンドの両方を対象としたテストスクリプトは、以下のパターンで実装します：

```typescript
// APIリクエスト送信
async function makeApiRequest(params, apiUrl, apiLabel = 'API') {
  try {
    let endpoint;
    if (apiUrl === BACKEND_API_URL) {
      // バックエンドの場合はRESTfulなパスを使用
      endpoint = `${apiUrl}/stories/${params.id}/endpoint/`;
    } else {
      // フロントエンドの場合はクエリパラメータ形式を使用
      endpoint = `${apiUrl}/api/story-endpoint?id=${params.id}`;
    }

    // ... (リクエスト処理)
  } catch (error) {
    // ... (エラー処理)
  }
}
```

## 今後の展開

今後は全てのAPIエンドポイントをこのパターンに準拠させ、統一性と安定性を確保します。既存のエンドポイントについても、順次移行していきます。

なお、フロントエンドとバックエンドの間で統一されたインターフェースを維持するため、JSONレスポンスの構造についても標準化を進める予定です。
