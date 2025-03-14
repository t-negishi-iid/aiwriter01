import { NextRequest, NextResponse } from 'next/server';

/**
 * 小説ごとの疎通確認用APIエンドポイント
 * フロントエンドの /api/story-is-live?id=xxx にリクエストを受け付け、
 * バックエンドの /api/stories/{id}/is_live/ エンドポイントにリクエストを転送します
 */

export async function GET(request: NextRequest) {
  try {
    // URLからクエリパラメータを取得
    const searchParams = request.nextUrl.searchParams;
    const storyId = searchParams.get('id');

    if (!storyId) {
      return NextResponse.json({ error: '小説IDが指定されていません' }, { status: 400 });
    }

    // バックエンドの対応するエンドポイントにリクエスト
    const backendHost = process.env.BACKEND_HOST || 'localhost';
    const backendPort = process.env.BACKEND_PORT || '8001';
    const backendUrl = `http://${backendHost}:${backendPort}/api/stories/${storyId}/is_live/`;

    console.log(`StoryIsLive API: Forwarding GET request to ${backendUrl}`);

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
    console.error('StoryIsLive API GET error:', error);

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
        error: '小説生存確認に失敗しました',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
