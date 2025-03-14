/**
 * 基本設定データ作成ページのE2Eテスト
 *
 * 基本設定データの作成プロセスをヘッドレスブラウザでテストします。
 * このテストは、以下のシナリオをカバーします：
 * 1. 小説詳細ページへのナビゲーション（クエリパラメータ形式）
 * 2. 基本設定データフォームへの移動
 * 3. フォームの入力と送信
 * 4. 結果の検証
 */

describe('基本設定データ作成', () => {
  // テスト用の小説IDを設定
  const storyId = 1;

  beforeEach(() => {
    // 小説詳細ページに移動（クエリパラメータ形式）
    cy.visit(`/stories?id=${storyId}`);

    // ページが正しく読み込まれたことを確認
    cy.contains('小説の概要').should('be.visible');
  });

  it('概要タブに基本設定データのセクションが表示される', () => {
    // 概要タブがデフォルトで選択されていることを確認
    cy.get('[role="tabpanel"]').should('be.visible');

    // 基本設定データの作成ボタンが表示されているか確認
    cy.contains('基本設定を作成する').should('exist');
  });

  it('基本設定データ作成ページに移動できる', () => {
    // 存在するAPIエンドポイントをモック
    cy.intercept('GET', `/api/stories?id=${storyId}*`, {
      statusCode: 200,
      body: {
        id: storyId,
        title: 'テスト小説',
      },
    }).as('getStory');

    // 基本設定を作成するボタンをクリック
    cy.contains('基本設定を作成する').click();

    // 遷移先のURLが正しいことを確認（クエリパラメータ形式）
    cy.url().should('include', `/stories/${storyId}/basic-setting-data`);

    // 基本設定データ作成ページのタイトルが表示されていることを確認
    cy.contains('基本設定データの作成').should('exist');

    // フォームが表示されていることを確認
    cy.contains('基本設定データ入力').should('exist');
  });

  // APIリクエストをシミュレートするテスト
  it('基本設定データのAPIリクエストが正しく送信される', () => {
    // 基本設定作成APIリクエストのインターセプト（クエリパラメータ形式）
    cy.intercept('POST', `/api/stories?id=${storyId}&action=basic-setting-data`, {
      statusCode: 201,
      body: {
        id: 1,
        theme: 'self_growth',
        setting: 'urban_fantasy',
        era: 'modern_japan',
        emotions: ['love_expression'],
        plot_type: 'heroic_journey',
        mystery: 'trauma_mystery',
        created_at: new Date().toISOString(),
      },
    }).as('createBasicSettingData');

    // 基本設定作成ページに移動
    cy.visit(`/stories/${storyId}/basic-setting-data`);

    // フォームが表示されていることを確認
    cy.contains('基本設定データ入力').should('be.visible');

    // フォームタブがアクティブであることを確認
    cy.get('[role="tab"][aria-selected="true"]').should('contain', 'フォーム入力');

    // Selectフィールドを選択してオプションを選ぶ（data-test属性を使用）
    // ジャンル
    cy.get('[data-test="genre-select"]').click();
    cy.get('[role="option"]').contains('ファンタジー').click();

    // テーマ
    cy.get('[data-test="theme-select"]').click();
    cy.get('[role="option"]').contains('自己成長').click();

    // 舞台設定
    cy.get('[data-test="setting-select"]').click();
    cy.get('[role="option"]').contains('アーバンファンタジー').click();

    // 時代
    cy.get('[data-test="era-select"]').click();
    cy.get('[role="option"]').contains('現代日本').click();

    // 情緒的要素
    cy.get('[data-test="emotions-select"]').click();
    cy.get('[role="option"]').contains('愛情表現').click();

    // プロットタイプ
    cy.get('[data-test="plot_type-select"]').click();
    cy.get('[role="option"]').contains('英雄の旅').click();

    // 過去の謎
    cy.get('[data-test="mystery-select"]').click();
    cy.get('[role="option"]').contains('トラウマ').click();

    // 追加情報があれば入力
    cy.get('textarea[name="additional_info"]').type('テスト追加情報');

    // 送信ボタンをクリック
    cy.contains('button', '基本設定を生成').click();

    // リクエストが正しく送信されたことを確認
    cy.wait('@createBasicSettingData');

    // 作成成功後、小説詳細ページにリダイレクトされるか確認
    cy.url().should('include', `/stories?id=${storyId}`);
  });

  // エラー処理のテスト
  it('APIエラー時にエラーメッセージが表示される', () => {
    // エラーケースをシミュレート
    cy.intercept('POST', `/api/stories?id=${storyId}&action=basic-setting-data`, {
      statusCode: 500,
      body: { error: 'サーバーエラーが発生しました' }
    }).as('apiError');

    // 基本設定作成ページに移動
    cy.visit(`/stories/${storyId}/basic-setting-data`);

    // フォームが表示されていることを確認
    cy.contains('基本設定データ入力').should('be.visible');

    // 最低限の必須項目を入力
    // ジャンル
    cy.get('[data-test="genre-select"]').click();
    cy.get('[role="option"]').contains('ファンタジー').click();

    // テーマ
    cy.get('[data-test="theme-select"]').click();
    cy.get('[role="option"]').contains('自己成長').click();

    // 舞台設定
    cy.get('[data-test="setting-select"]').click();
    cy.get('[role="option"]').contains('アーバンファンタジー').click();

    // 時代
    cy.get('[data-test="era-select"]').click();
    cy.get('[role="option"]').contains('現代日本').click();

    // 情緒的要素
    cy.get('[data-test="emotions-select"]').click();
    cy.get('[role="option"]').contains('愛情表現').click();

    // プロットタイプ
    cy.get('[data-test="plot_type-select"]').click();
    cy.get('[role="option"]').contains('英雄の旅').click();

    // 過去の謎
    cy.get('[data-test="mystery-select"]').click();
    cy.get('[role="option"]').contains('トラウマ').click();

    // 送信ボタンをクリック
    cy.contains('button', '基本設定を生成').click();

    // APIリクエストの完了を待つ
    cy.wait('@apiError');

    // エラーメッセージが表示されることを確認（トーストまたはフォームエラー）
    cy.contains(/エラー|失敗/).should('be.visible');
  });
});
