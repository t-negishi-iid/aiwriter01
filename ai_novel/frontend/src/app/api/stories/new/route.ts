import { NextRequest, NextResponse } from 'next/server';

/**
 * 小説作成用APIエンドポイント - レガシー
 *
 * このエンドポイントは後方互換性のためだけに残されています。
 * 新しいAPIルートは /api/stories?action=create を使用してください。
 *
 * このルートは一時的な移行措置として、新しいエンドポイントにリダイレクトします。
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディをクローン
    const clonedRequest = request.clone();
    const body = await clonedRequest.json().catch(() => ({}));

    console.log(`[非推奨] /api/stories/new エンドポイントが使用されました。`);
    console.log(`新しい /api/stories?action=create エンドポイントにリダイレクトします。`);

    // 新しいエンドポイントへのリクエストを作成
    const response = await fetch(`${request.nextUrl.origin}/api/stories?action=create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body)
    });

    // 新しいエンドポイントからのレスポンスをそのまま返す
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'X-API-Note': '非推奨のエンドポイント。今後は /api/stories?action=create を使用してください。'
      }
    });
  } catch (error) {
    console.error('Stories creation legacy API error:', error);

    return NextResponse.json(
      {
        error: '小説作成リクエストに失敗しました',
        details: error instanceof Error ? error.message : String(error),
        apiNote: '非推奨のエンドポイント。今後は /api/stories?action=create を使用してください。',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
