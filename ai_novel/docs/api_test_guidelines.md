# API テストガイドライン

このドキュメントでは、AI Novel Writing SystemにおけるフロントエンドとバックエンドのAPI機能テストの方法について説明します。本ガイドラインは「Django / Next.js 一気通貫テストシステム」の一部として機能します。包括的なテスト方法論については、[django_nextjs_e2e_testing.md](django_nextjs_e2e_testing.md)を参照してください。

【重要】本テストの目的は、システム全体が正常系のワークフローが完全に動作する状態を迅速に確保することです。テストを成功させることはそのための手段にすぎず、目的ではありません。従ってテストを成功させるためにテストプログラムを修正するのではなく、正しい仕様で動くようにバックエンドを修正し、バックエンドの仕様通りに動かすためにフロントエンドを修正してください。

## 1. 疎通確認の基本概念

フロントエンドとバックエンドの連携を確保するため、以下の仕組みを実装しています：

### 1.1 疎通確認用エンドポイント

- **バックエンド**: `/api/is_live/` - 認証不要で `{ "results": "live" }` を返す
- **フロントエンド**: `/api/is_live` - バックエンドの疎通確認エンドポイントに転送

### 1.2 視覚的確認ツール

- Web UI: `/tools/connection-test` - ブラウザから接続状態を確認

## 2. テスト方法

### 2.1 テストの種類

1. **cURLによる手動テスト**：開発初期やデバッグ時に使用する簡易テスト
2. **テストプログラムによる自動テスト**：継続的なテストのための再利用可能なテスト

### 2.2 Unified API クライアントを用いたテスト

当システムでは、`unifiedStoryApi`のような統一APIクライアントを使用して、バックエンドとフロントエンドの間でシームレスな通信を実現しています。この仕組みを活用したテスト方法を推奨します。

#### 2.2.1 API通信フロー

```
フロントエンドUI → フロントエンドAPIルート → Unified APIクライアント → バックエンドAPI
```

#### 2.2.2 テストプロキシAPI

フロントエンドでは、Next.jsのAPI Routesを使ってプロキシAPIを実装し、フロントエンドとバックエンドのURL形式の違いを吸収しています：

- フロントエンド：クエリパラメータ形式 (`/api/stories?id=123`)
- バックエンド：RESTful形式 (`/api/stories/123/`)

### 2.3 cURLを使用した手動テスト手順

#### 2.3.1 バックエンドAPIの直接テスト

```bash
# 一覧取得
curl -s http://localhost:8001/api/stories/ | python3 -m json.tool

# 個別取得
curl -s http://localhost:8001/api/stories/123/ | python3 -m json.tool

# 作成
curl -X POST -H "Content-Type: application/json" \
  -d '{"title":"テスト小説", "catchphrase":"キャッチフレーズ", "summary":"概要"}' \
  http://localhost:8001/api/stories/

# 更新
curl -X PUT -H "Content-Type: application/json" \
  -d '{"title":"更新テスト", "catchphrase":"更新キャッチフレーズ", "summary":"更新概要"}' \
  http://localhost:8001/api/stories/123/

# 削除
curl -X DELETE http://localhost:8001/api/stories/123/
```

#### 2.3.2 フロントエンドプロキシAPIのテスト

```bash
# 一覧取得
curl -s http://localhost:3000/api/stories | python3 -m json.tool

# 個別取得
curl -s http://localhost:3000/api/stories?id=123 | python3 -m json.tool

# 作成
curl -X POST -H "Content-Type: application/json" \
  -d '{"title":"テスト小説", "catchphrase":"キャッチフレーズ", "summary":"概要"}' \
  http://localhost:3000/api/stories

# 更新
curl -X PUT -H "Content-Type: application/json" \
  -d '{"title":"更新テスト", "catchphrase":"更新キャッチフレーズ", "summary":"更新概要"}' \
  http://localhost:3000/api/stories?id=123

# 削除
curl -X DELETE http://localhost:3000/api/stories?id=123
```

### 2.4 テストプログラムの基本構造

テストプログラムは `ai_novel/tests/` ディレクトリ内に TypeScript ファイルとして実装されています。
各機能のテストスクリプトは次の命名規則に従います：

```
test_[機能名].ts
```

例：`test_stories_new.ts` (小説作成API)、`test_characters.ts` (キャラクター関連API)

### 2.5 【重要】URL形式とレスポンス形式の差異に注意

バックエンドとフロントエンド間のURLとレスポンス形式の主な違い：

1. **URL形式**：
   - バックエンド：RESTful形式 (`/api/stories/123/`)
   - フロントエンド：クエリパラメータ形式 (`/api/stories?id=123`)

2. **HTTP ステータスコード**：
   - バックエンド：標準的なHTTPステータスコード（204 No Contentなど）
   - フロントエンド：統一APIクライアントを通じて処理された結果

3. **削除操作のレスポンス**：
   - バックエンド：204 No Content（レスポンスボディなし）
   - フロントエンド：204 No Content（レスポンスボディなし）

### 2.6 テスト項目

1. 小説 (Story)
   - 一覧取得 (GET) が正常に動作し、ページネーションが正しい
   - 個別取得 (GET with id) が正常に動作
   - 作成 (POST) が正常に動作
   - 更新 (PUT) が正常に動作
   - 削除 (DELETE) が正常に動作
   - **新機能：`catchphrase`と`summary`フィールドのサポート**

2. 基本設定作成用データ (BasicSettingData)
3. 基本設定 (BasicSetting)
4. キャラクター (Character)
5. プロット/あらすじ (Plot/Act)
6. エピソード (Episode)
7. エピソード本文 (EpisodeContent)
8. タイトル生成 (Title)

## 3. Unified API クライアントの実装とテスト

### 3.1 Unified API クライアントの基本構造

```typescript
// APIクライアント関数
export const unifiedStoryApi = {
  // 一覧取得
  getStories: () => unifiedFetchApi<DRFPaginatedResponse<Record<string, unknown>>>('/stories/'),
  
  // 個別取得
  getStory: (id: string | number) => unifiedFetchApi<Record<string, unknown>>(`/stories/${id}/`),
  
  // 作成
  createStory: (data: Record<string, unknown>) => unifiedFetchApi<Record<string, unknown>>('/stories/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // 更新
  updateStory: (id: string | number, data: Record<string, unknown>) => 
    unifiedFetchApi<Record<string, unknown>>(`/stories/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
  }),
  
  // 削除
  deleteStory: (id: string | number) => unifiedFetchApi<null>(`/stories/${id}/`, {
    method: 'DELETE',
  }),
};
```

### 3.2 フロントエンドAPIルートの実装

```typescript
// GET - 一覧取得または個別取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      // 個別取得
      const result = await unifiedStoryApi.getStory(id);
      return NextResponse.json(result);
    } else {
      // 一覧取得
      const result = await unifiedStoryApi.getStories();
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '不明なエラー',
        details: JSON.stringify(error) 
      },
      { status: 500 }
    );
  }
}

// POST - 作成
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const result = await unifiedStoryApi.createStory(data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '不明なエラー',
        details: JSON.stringify(error) 
      },
      { status: 500 }
    );
  }
}

// PUT - 更新
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID parameter is required' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    const result = await unifiedStoryApi.updateStory(id, data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '不明なエラー',
        details: JSON.stringify(error) 
      },
      { status: 500 }
    );
  }
}

// DELETE - 削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required for DELETE operation' },
        { status: 400 }
      );
    }
    
    await unifiedStoryApi.deleteStory(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '不明なエラー',
        details: JSON.stringify(error) 
      },
      { status: 500 }
    );
  }
}
```

## 4. 注意すべき実装ポイント

### 4.1 204 No Contentのハンドリング

削除操作など、204 No Contentレスポンスを返すエンドポイントでは、レスポンスにボディがないことを考慮する必要があります：

```typescript
// 正常なレスポンス処理（204 No Contentの考慮）
if (response.ok) {
  // 204 No Contentの場合はJSONパースをスキップ
  if (response.status === 204) {
    return null as T;
  }
  
  const data = await response.json();
  return data as T;
}
```

### 4.2 エラーハンドリング

エラーレスポンスは詳細な情報を提供するようにします：

```typescript
return NextResponse.json(
  { 
    error: error instanceof Error ? error.message : '不明なエラー',
    details: JSON.stringify(error) 
  },
  { status: 500 }
);
```

### 4.3 バックエンドとフロントエンドの整合性確保

1. **URLパスの統一**：バックエンドのURLパス形式をUnified APIクライアントで適切に扱う
2. **レスポンス形式の統一**：Django REST Frameworkの標準ページネーション形式を尊重
3. **エラーハンドリングの一貫性**：エラーレスポンスの形式を統一

## 5. テスト検証のチェックリスト

### 5.1 基本機能テスト

- [ ] 一覧取得 (GET) が正常に動作し、ページネーションが正しい
- [ ] 個別取得 (GET with id) が正常に動作
- [ ] 作成 (POST) が正常に動作
- [ ] 更新 (PUT) が正常に動作
- [ ] 削除 (DELETE) が正常に動作
- [ ] `catchphrase`と`summary`フィールドが正しく処理される

### 5.2 エラーケーステスト

- [ ] 存在しないリソースのリクエスト (404)
- [ ] 不正なパラメータでのリクエスト (400)
- [ ] 必須パラメータ欠如のリクエスト (400)

## 6. APIエンドポイント一覧

| 機能 | バックエンドURL | フロントエンドURL | HTTPメソッド | 説明 |
|------|---------------|-----------------|------------|------|
| 小説一覧取得 | `/api/stories/` | `/api/stories` | GET | 小説の一覧を取得 |
| 小説詳細取得 | `/api/stories/{id}/` | `/api/stories?id={id}` | GET | 指定IDの小説を取得 |
| 小説作成 | `/api/stories/` | `/api/stories` | POST | 新しい小説を作成 |
| 小説更新 | `/api/stories/{id}/` | `/api/stories?id={id}` | PUT | 指定IDの小説を更新 |
| 小説削除 | `/api/stories/{id}/` | `/api/stories?id={id}` | DELETE | 指定IDの小説を削除 |
