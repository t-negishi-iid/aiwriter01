# Cypress UI テスト実装ガイドライン

## 目次

1. [はじめに](#はじめに)
2. [テスト設計の基本原則](#テスト設計の基本原則)
3. [フロントエンドコンポーネントの準備](#フロントエンドコンポーネントの準備)
   - [data-testid属性の命名規則](#data-testid属性の命名規則)
   - [重要なコンポーネントへの属性追加](#重要なコンポーネントへの属性追加)
4. [Cypressテストの実装](#cypressテストの実装)
   - [セレクタの使用方法](#セレクタの使用方法)
   - [テストの構造](#テストの構造)
   - [非同期処理の取り扱い](#非同期処理の取り扱い)
5. [ヘッドレステスト実行](#ヘッドレステスト実行)
6. [参考資料](#参考資料)

## はじめに

本ドキュメントは、アプリケーションのフロントエンドUIテストを効率的に実装するためのガイドラインです。特にCypressを使用したヘッドレスUIテストの実装方法と、テストしやすいフロントエンドコンポーネントの設計に焦点を当てています。

ヘッドレスUIテストとは、実際のブラウザUIを表示せずにバックグラウンドでテストを実行する方法です。これにより、CIパイプラインでの自動テストや、多数のテストケースを高速に実行することが可能になります。

## テスト設計の基本原則

1. **独立性**: 各テストは独立して実行できるようにする
2. **再現性**: テストは環境に依存せず、常に同じ結果を返すようにする
3. **包括性**: 重要なユースケースをすべてカバーする
4. **保守性**: コードの変更に対して壊れにくいテストを書く

## フロントエンドコンポーネントの準備

### data-testid属性の命名規則

テスト用の要素を特定するために、`data-testid`属性を使用します。命名規則は以下の通りです：

- ページ全体: `{ページ名}-page`
  - 例: `stories-page`, `login-page`
- フォーム: `{機能}-form`
  - 例: `story-form`, `login-form`
- 入力フィールド: `{フィールド名}-input`
  - 例: `title-input`, `email-input`
- ボタン: `{アクション}-button`
  - 例: `submit-button`, `cancel-button`
- リスト項目: `{項目タイプ}-item-{id}`
  - 例: `story-item-123`
- ダイアログ: `{機能}-dialog`
  - 例: `delete-dialog`, `confirm-dialog`
- ローディング表示: `loading-indicator`
- エラーメッセージ: `error-message` または `error-alert`

### 重要なコンポーネントへの属性追加

以下のコンポーネントには必ず`data-testid`属性を追加してください：

1. **ページコンテナ**:
```tsx
<div className="container" data-testid="stories-page">
  {/* ページの内容 */}
</div>
```

2. **フォーム要素**:
```tsx
<form onSubmit={handleSubmit} data-testid="story-form">
  {/* フォームの内容 */}
</form>
```

3. **入力フィールド**:
```tsx
<Input
  name="title"
  value={title}
  onChange={handleChange}
  data-testid="title-input"
/>
```

4. **ボタン**:
```tsx
<Button
  type="submit"
  disabled={isLoading}
  data-testid="submit-button"
>
  送信
</Button>
```

5. **ダイアログ**:
```tsx
<DialogContent data-testid="delete-dialog">
  {/* ダイアログの内容 */}
</DialogContent>
```

6. **ローディング表示**:
```tsx
<div data-testid="loading-indicator">
  <Loader2 className="h-8 w-8 animate-spin" />
</div>
```

7. **エラーメッセージ**:
```tsx
<Alert variant="destructive" data-testid="error-alert">
  {errorMessage}
</Alert>
```

## Cypressテストの実装

### セレクタの使用方法

テスト対象の要素を選択する際は、以下の優先順位でセレクタを使用してください：

1. `data-testid`属性（最優先）:
```typescript
cy.get('[data-testid="submit-button"]').click();
```

2. 要素の役割（必要な場合のみ）:
```typescript
cy.get('[role="dialog"]').should('be.visible');
```

3. クラス名やID（`data-testid`が使えない場合のみ）:
```typescript
cy.get('.story-card').first().click();
```

4. テキスト内容（最終手段）:
```typescript
cy.contains('小説を削除').click();
```

### テストの構造

テストは以下の構造で実装することをお勧めします：

```typescript
describe('機能名', () => {
  before(() => {
    // テスト全体の前処理
    // 例: テストデータの準備
  });

  beforeEach(() => {
    // 各テストの前処理
    // 例: ページへのアクセス
  });

  it('テストケース1の説明', () => {
    // 操作
    // 検証
  });

  it('テストケース2の説明', () => {
    // 操作
    // 検証
  });

  after(() => {
    // テスト全体の後処理
    // 例: テストデータのクリーンアップ
  });
});
```

### 非同期処理の取り扱い

APIリクエストなどの非同期処理を含むテストでは、明示的な待機を設定してください：

```typescript
// 要素が表示されるまで待機
cy.get('[data-testid="stories-page"]', { timeout: 10000 }).should('exist');

// APIレスポンス後の要素変化を待機
cy.intercept('GET', '/api/stories').as('getStories');
cy.visit('/stories');
cy.wait('@getStories');
```

## ヘッドレステスト実行

ヘッドレスモードでテストを実行するには、以下のコマンドを使用します：

```bash
# 特定のテストスペックを実行
npx cypress run --spec "cypress/e2e/stories/edit-delete-story.cy.ts"

# 全テストを実行
npx cypress run
```

テストをブラウザUIで確認したい場合：

```bash
npx cypress open
```

## 実装例

### フロントエンドコンポーネント例

```tsx
// stories/new/page.tsx
export default function NewStoryPage() {
  // ...
  return (
    <div className="container mx-auto py-8" data-testid="new-story-page">
      <h1>新規小説作成</h1>
      
      {error && (
        <Alert variant="destructive" data-testid="error-alert">
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <StoryForm 
        onSubmit={handleCreateStory}
        isSubmitting={isLoading}
        data-testid="create-story-form"
      />
    </div>
  );
}
```

### フォームコンポーネント例

```tsx
// components/forms/story-form.tsx
export function StoryForm({ 
  onSubmit, 
  defaultValues,
  ...props 
}: StoryFormProps) {
  // ...
  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
        className="space-y-6"
        data-testid="story-form"
        {...props}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>タイトル</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  data-testid="title-input" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* その他のフィールド */}
        
        <Button 
          type="submit" 
          disabled={isSubmitting}
          data-testid="submit-button"
        >
          {isSubmitting ? '送信中...' : submitButtonText || '送信'}
        </Button>
      </form>
    </Form>
  );
}
```

### Cypressテスト例

```typescript
// cypress/e2e/stories/edit-delete-story.cy.ts
describe('小説編集機能', () => {
  const testStoryTitle = `テスト小説 ${Date.now()}`;

  before(() => {
    // テストデータ作成
    cy.visit('/stories');
    cy.get('[data-testid="create-story-button"]').click();
    cy.get('[data-testid="story-form"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="title-input"]').type(testStoryTitle);
    cy.get('[data-testid="catchphrase-input"]').type('テスト用キャッチフレーズ');
    cy.get('[data-testid="submit-button"]').click();
  });

  it('編集ボタンをクリックすると編集ページに遷移する', () => {
    cy.contains(testStoryTitle)
      .parents('[data-testid^="story-card-"]')
      .within(() => {
        cy.get('[data-testid^="edit-story-"]').click();
      });
    
    cy.url().should('include', '/edit');
    cy.get('[data-testid="edit-story-page"]').should('exist');
  });

  it('編集フォームにデータが正しく表示され、編集可能', () => {
    // テスト実装
  });
});
```

## 参考資料

- [Cypress 公式ドキュメント](https://docs.cypress.io/)
- [テスト対象属性のベストプラクティス](https://testing-library.com/docs/queries/bytestid/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
