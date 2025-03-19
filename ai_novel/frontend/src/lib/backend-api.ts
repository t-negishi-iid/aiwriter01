/**
 * バックエンドAPIとの通信を行うユーティリティ関数
 */

/**
 * バックエンドAPIにリクエストを送信する
 * 
 * @param endpoint - APIエンドポイント
 * @param options - フェッチオプション
 * @returns レスポンス
 */
export async function fetchBackendApi(endpoint: string, options: RequestInit = {}) {
  const apiUrl = process.env.BACKEND_API_URL || 'http://localhost:8001/api';
  // エンドポイントが/で始まっていない場合は追加
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // 末尾のスラッシュを追加（バックエンドAPIとの互換性のため）
  const finalEndpoint = normalizedEndpoint.endsWith('/') ? normalizedEndpoint : `${normalizedEndpoint}/`;
  const url = `${apiUrl}${finalEndpoint}`;
  
  console.log(`[TRACE] バックエンドAPIリクエスト: ${url} - ${new Date().toISOString()}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    console.log(`[TRACE] バックエンドAPIレスポンス受信 - ステータス: ${response.status} - ${new Date().toISOString()}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TRACE] バックエンドAPIエラー: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`${response.status} ${response.statusText}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`[TRACE] バックエンドAPIレスポンス: ${JSON.stringify(data).substring(0, 200)}... - ${new Date().toISOString()}`);
    return data;
  } catch (error) {
    console.error(`[TRACE] バックエンドAPI呼び出しエラー: ${error} - ${new Date().toISOString()}`);
    throw error;
  }
}
