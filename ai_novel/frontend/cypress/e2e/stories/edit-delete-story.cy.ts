/**
 * 小説編集・削除機能のE2Eテスト
 *
 * 小説の編集と削除操作をヘッドレスブラウザでテストします。
 * このテストは、以下のシナリオをカバーします：
 * 1. 小説一覧ページから編集ページへの遷移
 * 2. 小説編集フォームの操作
 * 3. 小説の編集実行と保存確認
 * 4. 小説の削除操作
 * 5. 削除確認ダイアログの操作
 */

describe('小説編集機能', () => {
  // テストデータの準備
  const testStoryTitle = `テスト小説 ${Date.now()}`;
  
  before(() => {
    // 小説一覧ページに直接アクセス（ログインプロセスをスキップ）
    cy.visit('/stories');
    // ページタイトルの存在を確認する（data-testidではなく、タイトル要素の存在で確認）
    cy.contains('h1', '小説一覧').should('be.visible');
    
    // 新規作成ボタンを探す（正確なセレクタに変更）
    cy.contains('button', '新規作成').click();
    
    // フォームが表示されるまで待機（フォームの存在をより一般的な方法で確認）
    cy.get('form').should('be.visible');
    
    // タイトル入力フィールド（より一般的なセレクタに変更）
    cy.get('input[placeholder*="タイトル"]').clear().type(testStoryTitle);
    cy.get('input[placeholder*="キャッチ"]').clear().type('テスト用キャッチフレーズ');
    cy.get('textarea[placeholder*="概要"]').clear().type('テスト用概要文');
    
    // 送信ボタン（より一般的なセレクタに変更）
    cy.contains('button', '保存').click();
    
    // 小説一覧ページに移動していることを確認
    cy.url().should('include', '/stories');
    cy.contains('h1', '小説一覧').should('be.visible');
    
    // 作成された小説のタイトルが表示されていることを確認
    cy.contains(testStoryTitle).should('be.visible');
  });

  it('編集ボタンをクリックすると編集ページに遷移する', () => {
    // テスト小説のタイトルを見つけて、その近くの編集ボタンをクリック
    cy.contains(testStoryTitle)
      .parents('div')
      .within(() => {
        cy.get('button').contains('編集').click();
      });
    
    // 編集ページに遷移することを確認
    cy.url().should('include', '/edit');
    
    // 編集ページのフォームが表示されることを確認
    cy.get('form').should('be.visible');
  });

  it('編集フォームにデータが正しく表示され、編集可能', () => {
    // 小説一覧ページにアクセス
    cy.visit('/stories');
    cy.contains('h1', '小説一覧').should('be.visible');
    
    // テスト小説のタイトルを見つけて、その近くの編集ボタンをクリック
    cy.contains(testStoryTitle)
      .parents('div')
      .within(() => {
        cy.get('button').contains('編集').click();
      });
    
    // フォームが表示されるまで待機
    cy.get('form').should('be.visible');
    
    // タイトル入力フィールドに既存の値が入っていることを確認
    cy.get('input[placeholder*="タイトル"]')
      .should('be.visible')
      .and('have.value', testStoryTitle);
    
    // タイトルを編集
    const updatedTitle = `編集済み小説 ${Date.now()}`;
    cy.get('input[placeholder*="タイトル"]').clear().type(updatedTitle);
    
    // 概要を編集
    cy.get('textarea[placeholder*="概要"]')
      .should('be.visible')
      .clear()
      .type('編集済みの概要文です');
    
    // 更新ボタンをクリック
    cy.contains('button', '保存').click();
    
    // 小説一覧ページにリダイレクトされることを確認
    cy.url().should('include', '/stories');
    cy.contains('h1', '小説一覧').should('be.visible');
    
    // 編集した小説のタイトルが一覧に表示されることを確認
    cy.contains(updatedTitle).should('be.visible');
  });
});

describe('小説削除機能', () => {
  const testDeleteTitle = `削除テスト小説 ${Date.now()}`;
  
  before(() => {
    // 小説一覧ページに直接アクセス（ログインプロセスをスキップ）
    cy.visit('/stories');
    cy.contains('h1', '小説一覧').should('be.visible');
    
    // 新規作成ボタンを探す（正確なセレクタに変更）
    cy.contains('button', '新規作成').click();
    
    // フォームが表示されるまで待機（フォームの存在をより一般的な方法で確認）
    cy.get('form').should('be.visible');
    
    // タイトル入力フィールド（より一般的なセレクタに変更）
    cy.get('input[placeholder*="タイトル"]').clear().type(testDeleteTitle);
    cy.get('input[placeholder*="キャッチ"]').clear().type('削除テスト用');
    cy.get('textarea[placeholder*="概要"]').clear().type('この小説は削除テスト用です');
    
    // 送信ボタン（より一般的なセレクタに変更）
    cy.contains('button', '保存').click();
    
    // 小説一覧ページに移動していることを確認
    cy.url().should('include', '/stories');
    cy.contains('h1', '小説一覧').should('be.visible');
  });

  it('削除ボタンをクリックすると確認ダイアログが表示される', () => {
    // 作成した小説のタイトルを見つける
    cy.contains(testDeleteTitle)
      .should('be.visible')
      .parents('div')
      .within(() => {
        // 削除ボタンをクリック
        cy.get('button').contains('削除').click();
      });
    
    // 確認ダイアログが表示されることを確認
    cy.contains('本当に削除しますか？').should('be.visible');
    
    // キャンセルボタンをクリック
    cy.contains('button', 'キャンセル').click();
    
    // ダイアログが閉じることを確認
    cy.contains('本当に削除しますか？').should('not.exist');
    
    // 小説がまだ一覧に表示されていることを確認
    cy.contains(testDeleteTitle).should('be.visible');
  });

  it('確認ダイアログで「削除」を選択すると小説が削除される', () => {
    // 作成した小説のタイトルを見つける
    cy.contains(testDeleteTitle)
      .should('be.visible')
      .parents('div')
      .within(() => {
        // 削除ボタンをクリック
        cy.get('button').contains('削除').click();
      });
    
    // 確認ダイアログで「削除」ボタンをクリック
    cy.contains('button', '削除').click();
    
    // 削除した小説が一覧から消えていることを確認（少し待機）
    cy.wait(1000); // API処理を待つ
    cy.contains(testDeleteTitle).should('not.exist');
  });
});
