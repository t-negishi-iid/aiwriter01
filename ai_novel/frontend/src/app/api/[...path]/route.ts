import { NextRequest, NextResponse } from 'next/server';

/**
 * バックエンドAPIへのリクエストを処理する共通関数
 */
async function handleApiRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  const path = params.path.join('/');

  // Dockerコンテナ内では'ai_novel_backend'、ローカル開発では'localhost:8001'を使用
  // 環境変数から取得するか、デフォルト値を使用
  const backendHost = process.env.BACKEND_HOST || 'localhost';
  const backendPort = process.env.BACKEND_PORT || '8001';
  const backendUrl = `http://${backendHost}:${backendPort}/api/${path}`;

  console.log(`API Proxy: Forwarding ${method} request to: ${backendUrl}`);

  try {
    // リクエストオプションの準備
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // タイムアウト設定はfetchには直接設定できないため、AbortControllerで実装する必要がある
    };

    // GET/DELETEメソッド以外の場合、リクエストボディを設定
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        const body = await request.json().catch(() => ({}));
        options.body = JSON.stringify(body);
        console.log(`API Proxy: Request body: ${JSON.stringify(body).substring(0, 200)}...`);
      } catch (error) {
        console.error('Request body parsing error:', error);
        // ボディのパースに失敗しても処理を継続
      }
    }

    // タイムアウト用のAbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒タイムアウト

    options.signal = controller.signal;

    // バックエンドAPIへリクエスト
    console.log(`API Proxy: Sending ${method} request to: ${backendUrl} with options:`, JSON.stringify(options));
    const response = await fetch(backendUrl, options);
    console.log(`API Proxy: Received response with status: ${response.status} ${response.statusText}`);

    // タイムアウトをクリア
    clearTimeout(timeoutId);

    // レスポンスの処理
    const text = await response.text();
    console.log(`API Proxy: Response text (first 200 chars): ${text.substring(0, 200)}...`);
    
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error(`API Proxy: JSON parse error:`, parseError);
      console.error(`API Proxy: Raw response text: ${text.substring(0, 500)}...`);
      return NextResponse.json(
        { error: `レスポンスのJSONパースに失敗しました`, details: parseError instanceof Error ? parseError.message : String(parseError) },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`API ${method} Error:`, error);
    console.error(`API Proxy: Error details:`, error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : String(error));

    // エラーの種類に応じたレスポンスを返す
    if (error instanceof TypeError && error.message.includes('abort')) {
      return NextResponse.json(
        { error: `バックエンドAPIへのリクエストがタイムアウトしました` },
        { status: 504 } // Gateway Timeout
      );
    }

    return NextResponse.json(
      { error: `バックエンドAPIへの${method}リクエストに失敗しました`, details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// GET リクエストハンドラー
export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleApiRequest(request, params, 'GET');
}

// POST リクエストハンドラー
export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleApiRequest(request, params, 'POST');
}

// PATCH リクエストハンドラー
export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleApiRequest(request, params, 'PATCH');
}

// DELETE リクエストハンドラー
export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleApiRequest(request, params, 'DELETE');
}
