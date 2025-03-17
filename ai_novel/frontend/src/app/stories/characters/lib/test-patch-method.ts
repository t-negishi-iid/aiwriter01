/**
 * BasicSettingのPATCHメソッドテスト
 * 
 * このファイルは、BasicSettingのPATCHメソッドをテストするためのものです。
 * PATCHメソッドで登場人物設定のみを更新できることを確認します。
 */

// 環境変数の設定
const backendHost = 'localhost';
const backendPort = '8001';
const backendBaseUrl = `http://${backendHost}:${backendPort}/api`;

// テスト用パラメータ
const storyId = '20'; // テスト対象のストーリーID
const basicSettingId = '3'; // テスト対象の基本設定ID
const testCharacters = `テスト用登場人物設定 - ${new Date().toISOString()}`; // タイムスタンプ付きのテスト用データ

/**
 * APIリクエスト関数
 */
async function fetchApi(endpoint: string, options: RequestInit = {}): Promise<any> {
  // エンドポイントが/で始まっていない場合は追加
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // 末尾のスラッシュを追加（バックエンドAPIとの互換性のため）
  const finalEndpoint = normalizedEndpoint.endsWith('/') ? normalizedEndpoint : `${normalizedEndpoint}/`;

  const url = `${backendBaseUrl}${finalEndpoint}`;
  console.log(`[TEST] API呼び出し - URL: ${url} - メソッド: ${options.method || 'GET'}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log(`[TEST] レスポンスステータス: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TEST] エラーレスポンス: ${errorText}`);
      throw new Error(`API呼び出しエラー: ${response.status} ${response.statusText}`);
    }

    // 204 No Contentの場合は空オブジェクトを返す
    if (response.status === 204) {
      console.log('[TEST] 204 No Content');
      return {};
    }

    const data = await response.json();
    console.log('[TEST] レスポンスデータ:', data);
    return data;
  } catch (error) {
    console.error('[TEST] API呼び出しエラー:', error);
    throw error;
  }
}

/**
 * 最新の基本設定を取得する関数
 */
async function fetchBasicSetting(storyId: string): Promise<any> {
  console.log(`[TEST] 基本設定取得 - ストーリーID: ${storyId}`);
  return fetchApi(`/stories/${storyId}/latest-basic-setting/`);
}

/**
 * PATCHメソッドで登場人物設定のみを更新する関数
 */
async function updateCharactersWithPatch(storyId: string, basicSettingId: string, characters: string): Promise<any> {
  console.log(`[TEST] PATCH更新 - ストーリーID: ${storyId}, 基本設定ID: ${basicSettingId}`);
  
  // 更新するフィールドのみを含むオブジェクト
  const updatedFields = {
    characters: characters,
    is_edited: true
  };

  return fetchApi(`/stories/${storyId}/basic-setting/${basicSettingId}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedFields),
  });
}

/**
 * テスト実行関数
 */
async function runTest() {
  console.log('===== PATCHメソッドテスト開始 =====');
  
  try {
    // 1. 現在の基本設定を取得
    console.log('\n[STEP 1] 現在の基本設定を取得');
    const currentSetting = await fetchBasicSetting(storyId);
    console.log(`現在の登場人物設定: ${currentSetting.characters?.substring(0, 50)}...`);
    
    // 2. PATCHメソッドで登場人物設定のみを更新
    console.log('\n[STEP 2] PATCHメソッドで登場人物設定のみを更新');
    const updateResult = await updateCharactersWithPatch(storyId, currentSetting.id.toString(), testCharacters);
    console.log('更新結果:', updateResult);
    
    // 3. 更新後の基本設定を再取得して確認
    console.log('\n[STEP 3] 更新後の基本設定を再取得');
    const updatedSetting = await fetchBasicSetting(storyId);
    console.log(`更新後の登場人物設定: ${updatedSetting.characters?.substring(0, 50)}...`);
    
    // 4. 更新が正しく反映されているか確認
    console.log('\n[STEP 4] 更新結果の検証');
    const isSuccess = updatedSetting.characters === testCharacters;
    console.log(`更新成功: ${isSuccess}`);
    
    console.log('\n===== テスト完了 =====');
    console.log(`結果: ${isSuccess ? '成功' : '失敗'}`);
    
    // 5. フロントエンドに実装するコード例を表示
    console.log('\n===== フロントエンド実装コード =====');
    console.log(`
// 登場人物設定をBasicSettingに保存する関数
export async function saveCharactersToBasicSetting(storyId: string, characters: string): Promise<void> {
  if (!storyId) {
    throw new Error('ストーリーIDが指定されていません');
  }

  try {
    // 最新の作品設定を取得
    const basicSetting = await fetchBasicSetting(storyId);
    if (!basicSetting) {
      throw new Error('作品設定が見つかりませんでした');
    }

    // 更新するフィールドのみを含むオブジェクト
    const updatedFields = {
      characters: characters,
      is_edited: true
    };

    console.log('登場人物設定を保存します:', { characters: characters.substring(0, 100) + '...' });

    // 作品設定を部分更新するAPIを呼び出す（PATCHメソッド）
    await fetchApi(\`/stories/\${storyId}/basic-setting/\${basicSetting.id}/\`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedFields),
    });

  } catch (error) {
    console.error('登場人物設定の保存エラー:', error);
    throw error;
  }
}
    `);
    
  } catch (error) {
    console.error('テスト実行エラー:', error);
  }
}

// テスト実行
runTest();
