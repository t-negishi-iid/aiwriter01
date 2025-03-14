import { NextResponse } from 'next/server';

/**
 * フロントエンドとバックエンド間の疎通確認用エンドポイント
 * localhost:3000/api/is_live にアクセスすると、
 * バックエンドの localhost:8001/api/is_live にリクエストを送信し、
 * そのレスポンスをそのまま返します。
 *
 * このエンドポイントはAIエージェントが疎通を確認するために使用します。
 */
export async function GET() {
  try {
    // バックエンドの疎通確認エンドポイントにリクエスト
    const backendHost = process.env.BACKEND_HOST || 'localhost';
    const backendPort = process.env.BACKEND_PORT || '8001';
    const backendUrl = `http://${backendHost}:${backendPort}/api/is_live/`;

    console.log(`Connectivity check: Forwarding request to ${backendUrl}`);

    // タイムアウト処理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // レスポンスの処理
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    // 接続成功の場合、バックエンドのレスポンスをそのまま返す
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Connectivity check failed:', error);

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
        error: 'バックエンドAPIとの疎通確認に失敗しました',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
