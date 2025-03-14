/**
 * 小説一覧ページのE2Eテスト
 *
 * 小説一覧の表示と操作をヘッドレスブラウザでテストします。
 * このテストは、以下のシナリオをカバーします：
 * 1. 小説一覧ページへのナビゲーション
 * 2. 小説一覧の表示
 * 3. 新規作成ページへの遷移
 * 4. エラー状態の検証
 */

describe('小説一覧', () => {
  beforeEach(() => {
    // 各テスト前に小説一覧ページにアクセス
    cy.visit('/stories');

    // ページが正しく読み込まれるまで待機
    cy.contains('小説一覧').should('exist');
  });

  it('小説一覧ページのUIが正しく表示される', () => {
    // 新規作成ボタンが存在することを確認
    cy.contains('新しい小説を作成').should('exist');

    // 小説一覧のコンテナが存在することを確認
    cy.get('[data-testid="stories-list"]').should('exist');
  });

  it('小説一覧が読み込まれる', () => {
    // APIモックを使用しない場合は、実際のデータが表示されるかを確認
    // 小説がある場合もない場合も考慮
    cy.get('[data-testid="stories-list"]').then(($list) => {
      // 小説がある場合はリストアイテムが表示される
      // 小説がない場合は「小説がありません」のようなメッセージが表示される
      cy.wrap($list).should('be.visible');
    });
  });

  it('新規作成ボタンをクリックすると新規作成ページに遷移する', () => {
    // 新規作成ボタンをクリック
    cy.contains('新しい小説を作成').click();

    // 新規作成ページに遷移することを確認
    cy.url().should('include', '/stories/new');

    // 新規作成ページのタイトルが表示されることを確認
    cy.contains('新規小説作成').should('exist');
  });

  // APIエラー時のテスト（モックが必要）
  it('APIエラー時にエラーメッセージが表示される', () => {
    // APIエラーをシミュレート
    cy.intercept('GET', '/api/stories', {
      statusCode: 500,
      body: { error: 'サーバーエラーが発生しました' }
    }).as('getStoriesError');

    // ページを再読み込み
    cy.reload();

    // APIリクエストの完了を待機
    cy.wait('@getStoriesError');

    // エラーメッセージが表示されることを確認
    cy.contains('エラー').should('be.visible');
  });

  // ロード中の状態をテスト
  it('データ読み込み中はローディング表示がされる', () => {
    // 遅延するAPIレスポンスをシミュレート
    cy.intercept('GET', '/api/stories', (req) => {
      // 2秒後にレスポンスを返す
      req.reply((res) => {
        setTimeout(() => {
          res.send({ body: [] });
        }, 2000);
      });
    }).as('getStoriesDelayed');

    // ページを再読み込み
    cy.reload();

    // ローディング表示が表示されることを確認
    cy.get('[data-testid="loading-indicator"]').should('be.visible');

    // APIリクエストの完了を待機
    cy.wait('@getStoriesDelayed');

    // ローディング表示が非表示になることを確認
    cy.get('[data-testid="loading-indicator"]').should('not.exist');
  });
});
