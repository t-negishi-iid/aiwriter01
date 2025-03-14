// ***********************************************
// commands.ts
// カスタムコマンドをここで定義
// ***********************************************

// TypeScript対応のために型定義を拡張
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * ホームページに移動
       */
      visitHome(): Chainable<Element>;

      /**
       * 新規小説作成ページに移動
       */
      visitNewStoryPage(): Chainable<Element>;

      /**
       * ランダムな小説タイトルを生成して返す
       */
      generateRandomTitle(): Chainable<string>;

      /**
       * 小説を作成する
       * @param title 小説のタイトル
       */
      createStory(title: string): Chainable<Element>;

      /**
       * 小説が正常に作成されたことを確認
       */
      verifyStoryCreated(): Chainable<Element>;

      /**
       * 小説詳細ページに移動（クエリパラメータ形式）
       * @param storyId 小説ID
       */
      visitStoryDetail(storyId: number | string): Chainable<Element>;

      /**
       * 基本設定データ作成ページに移動
       * @param storyId 小説ID
       */
      visitBasicSettingDataPage(storyId: number | string): Chainable<Element>;

      /**
       * 基本設定データを作成する
       * @param storyId 小説ID
       * @param data 基本設定データ
       */
      createBasicSettingData(storyId: number | string, data: any): Chainable<Element>;
    }
  }
}

// ホームページにアクセス
Cypress.Commands.add('visitHome', () => {
  cy.visit('/');
});

// 新規小説作成ページにアクセス
Cypress.Commands.add('visitNewStoryPage', () => {
  cy.visit('/stories/new');
});

// ランダムな小説タイトルを生成
Cypress.Commands.add('generateRandomTitle', () => {
  const prefixes = ['失われた', '眠れる', '伝説の', '神秘の', '輝ける', '忘却の', '永遠の', '幻想の', '約束の'];
  const nouns = ['王国', '剣', '魔法', '記憶', '時間', '未来', '世界', '星', '夢', '物語', '旅路', '宝石'];
  const suffixes = ['の秘密', 'の冒険', 'の伝説', 'の守護者', 'への旅', 'の鍵', 'の扉', 'の証明', 'の記録'];

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  const title = `${prefix}${noun}${suffix}`;
  cy.wrap(title);
});

// 小説を作成する
Cypress.Commands.add('createStory', (title: string) => {
  // タイトル入力フィールドにテキストを入力
  cy.get('input#title').clear().type(title);

  // 作成ボタンをクリック - 有効状態のボタンを探す
  // テキスト内容で特定（もっとも確実な方法）
  cy.contains('button', '小説を作成')
    .should('be.enabled')
    .click();
});

// 小説が正常に作成されたことを確認
Cypress.Commands.add('verifyStoryCreated', () => {
  // 成功メッセージの確認やリダイレクト先の確認など
  // 実装例：リダイレクト先のURLがクエリパラメータ形式 /stories?id={id} であることを確認
  cy.url().should('match', /\/stories\?id=\d+$/);

  // もしくは成功メッセージを確認
  // cy.contains('小説が作成されました').should('be.visible');
});

// 小説詳細ページに移動（クエリパラメータ形式）
Cypress.Commands.add('visitStoryDetail', (storyId: number | string) => {
  cy.visit(`/stories?id=${storyId}`);
});

// 基本設定データ作成ページに移動
Cypress.Commands.add('visitBasicSettingDataPage', (storyId: number | string) => {
  cy.visit(`/stories/${storyId}/basic-setting-data`);
});

// 基本設定データを作成する
Cypress.Commands.add('createBasicSettingData', (storyId: number | string, data: any) => {
  // 基本設定データ作成ページに移動
  cy.visitBasicSettingDataPage(storyId);

  // フォームに入力
  if (data.theme) cy.get('input[name="theme"]').clear().type(data.theme);
  if (data.timeAndPlace) cy.get('input[name="timeAndPlace"]').clear().type(data.timeAndPlace);
  if (data.worldSetting) cy.get('input[name="worldSetting"]').clear().type(data.worldSetting);
  if (data.plotPattern) cy.get('input[name="plotPattern"]').clear().type(data.plotPattern);

  // 感情表現（複数選択可能なフィールド）
  if (data.emotionalExpressions && Array.isArray(data.emotionalExpressions)) {
    // 具体的な実装はUIコンポーネントによって異なる
    // 例: マルチセレクト、チェックボックス、カスタムUIなど
  }

  // 送信ボタンをクリック
  cy.contains('button', '作成').click();
});

export { };
