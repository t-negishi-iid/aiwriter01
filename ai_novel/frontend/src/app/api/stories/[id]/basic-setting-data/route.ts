import { NextRequest, NextResponse } from 'next/server';

/**
 * 基本設定作成用データのAPIエンドポイント
 * フロントエンドの /api/stories/[id]/basic-setting-data/ にリクエストを受け付け、
 * バックエンドの /api/stories/{id}/basic-setting-data/ エンドポイントにリクエストを転送します
 */

// GET リクエストハンドラー
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // IDを取得
    const storyId = params.id;

    // バックエンドの対応するエンドポイントにリクエスト
    const backendHost = process.env.BACKEND_HOST || 'localhost';
    const backendPort = process.env.BACKEND_PORT || '8001';
    const backendUrl = `http://${backendHost}:${backendPort}/api/stories/${storyId}/basic-setting-data/`;

    console.log(`BasicSettingData API: Forwarding GET request to ${backendUrl}`);

    // タイムアウト処理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒タイムアウト

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // レスポンスの処理
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    // バックエンドのレスポンスをそのまま返す
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('BasicSettingData API GET error:', error);

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
        error: '基本設定作成用データの取得に失敗しました',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
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
    const backendUrl = `http://${backendHost}:${backendPort}/api/stories/${storyId}/basic-setting-data/`;

    console.log(`BasicSettingData API: Forwarding POST request to ${backendUrl}`);
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
    console.error('BasicSettingData API POST error:', error);

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
        error: '基本設定作成用データの作成に失敗しました',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
