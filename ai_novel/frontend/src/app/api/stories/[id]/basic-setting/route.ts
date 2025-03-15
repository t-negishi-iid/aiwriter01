import { NextRequest, NextResponse } from 'next/server';

/**
 * 基本設定データを取得するAPI
 * 
 * @param request - NextRequest
 * @param params - URLパラメータ（storyId）
 * @returns NextResponse
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const storyId = params.id;
    console.log(`[TRACE] 基本設定データ取得API - storyId: ${storyId} - ${new Date().toISOString()}`);
    
    // バックエンドAPIのURLを構築
    const apiUrl = process.env.BACKEND_API_URL || 'http://localhost:8001/api';
    const endpoint = `/stories/${storyId}/basic-setting/`;
    const url = `${apiUrl}${endpoint}`;
    
    console.log(`[TRACE] バックエンドAPIリクエスト: ${url} - ${new Date().toISOString()}`);
    
    // バックエンドAPIを直接呼び出し
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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
    
    // バックエンドからのレスポンスをそのまま返す
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[TRACE] 基本設定データ取得エラー: ${error} - ${new Date().toISOString()}`);
    
    // エラーレスポンスを返す
    return NextResponse.json(
      {
        success: false,
        message: `基本設定データの取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
        errors: { detail: ['サーバーエラーが発生しました'] }
      },
      { status: 500 }
    );
  }
}

// POST リクエストハンドラー
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // IDを取得
    const storyId = params.id;

    // リクエストボディを取得
    const body = await request.json().catch(() => ({}));

    // バックエンドの対応するエンドポイントにリクエスト
    const backendHost = process.env.BACKEND_HOST || 'localhost';
    const backendPort = process.env.BACKEND_PORT || '8001';
    const backendUrl = `http://${backendHost}:${backendPort}/api/stories/${storyId}/basic-setting/`;

    console.log(`BasicSetting API: Forwarding POST request to ${backendUrl}`);
    console.log(`Request body:`, body);

    // タイムアウト処理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒タイムアウト

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // レスポンスの処理
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    // バックエンドのレスポンスをそのまま返す
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('BasicSetting API POST error:', error);

    // タイムアウトエラーの場合
    if (error instanceof TypeError && error.message.includes('abort')) {
      return NextResponse.json(
        { error: 'バックエンドAPIへの接続がタイムアウトしました' },
        { status: 504 } // Gateway Timeout
      );
    }

    // その他のエラー
    return NextResponse.json(
      {
        error: '基本設定の作成に失敗しました',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
