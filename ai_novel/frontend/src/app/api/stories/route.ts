import { NextRequest, NextResponse } from 'next/server';

/**
 * 小説関連のAPIエンドポイント
 * クエリパラメータ形式でアクションを指定：
 * - /api/stories?action=create - 小説作成
 * - /api/stories?id=123 - 小説詳細取得
 * - /api/stories?id=123&action=basic-setting-data - 基本設定データ操作
 * - /api/stories?action=update&id=123 - 小説更新
 * - /api/stories?action=delete&id=123 - 小説削除
 * - /api/stories - 小説一覧取得
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    // 統合設定クリエイターデータの取得
    if (action === 'integrated-setting-creator-detail' && id) {
      try {
        console.log(`統合設定クリエイターデータを取得中... storyId: ${id}`);
        
        // バックエンドAPIのURLを構築
        const apiUrl = process.env.BACKEND_API_URL || 'http://localhost:8001/api';
        const endpoint = `/stories/${id}/integrated-setting-creator/detail/`;
        const url = `${apiUrl}${endpoint}`;
        
        console.log(`バックエンドAPIリクエスト: ${url}`);
        
        // バックエンドAPIを直接呼び出し
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`バックエンドAPIエラー: ${response.status} ${response.statusText}`, errorText);
          throw new Error(`${response.status} ${response.statusText}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`バックエンドAPIレスポンス: ${JSON.stringify(data).substring(0, 200)}...`);
        
        // バックエンドからのレスポンスをそのまま返す
        return NextResponse.json(data);
      } catch (error) {
        console.error('統合設定クリエイターデータ取得エラー:', error);
        
        // エラーレスポンスを返す
        return NextResponse.json(
          {
            success: false,
            message: `統合設定クリエイターデータの取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
            errors: { detail: ['サーバーエラーが発生しました'] }
          },
          { status: 500 }
        );
      }
    }

    // バックエンドの設定
    const backendHost = process.env.BACKEND_HOST || 'localhost';
    const backendPort = process.env.BACKEND_PORT || '8001';

    // バックエンドのエンドポイント構築
    let backendUrl = `http://${backendHost}:${backendPort}/api/stories/`;

    // アクションとパスのマッピング
    const actionToPathMap: Record<string, string> = {
      'basic-setting-data': 'basic-setting-data',
      'basic-setting': 'basic-setting',
      'create-character': 'create-character-detail',
      'generate-plot': 'create-plot-detail',
      'generate-episodes': 'create-episode-details',
      'generate-episode': 'create-episode-content',
      'generate-title': 'generate-title',
      'is-live': 'is_live',
      'logs': 'api-logs'
    };

    // 特定の小説とアクションが指定されている場合
    if (id && action) {
      // アクションをパスにマッピング
      const apiPath = actionToPathMap[action] || action.replace(/-/g, '');
      backendUrl = `http://${backendHost}:${backendPort}/api/stories/${id}/${apiPath}/`;

      console.log(`Mapped action '${action}' to path '${apiPath}'`);
    }
    // 小説IDのみが指定されている場合
    else if (id) {
      backendUrl += `${id}/`;
    }
    console.log(`Stories API: Forwarding GET request to ${backendUrl}`);

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
    console.error('Stories API error:', error);

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
        error: '小説取得リクエストに失敗しました',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    // リクエストボディを取得
    const body = await request.json().catch(() => ({}));

    // バックエンドの設定
    const backendHost = process.env.BACKEND_HOST || 'localhost';
    const backendPort = process.env.BACKEND_PORT || '8001';

    // バックエンドのエンドポイント構築
    let backendUrl = `http://${backendHost}:${backendPort}/api/stories/`;

    // アクションとパスのマッピング
    const actionToPathMap: Record<string, string> = {
      'basic-setting-data': 'basic-setting-data',
      'basic-setting': 'basic-setting',
      'create-character': 'create-character-detail',
      'generate-plot': 'create-plot-detail',
      'generate-episodes': 'create-episode-details',
      'generate-episode': 'create-episode-content',
      'generate-title': 'generate-title',
      'is-live': 'is_live',
      'logs': 'api-logs'
    };

    // アクションとIDが両方指定されている場合（例: 基本設定データの作成)
    if (id && action) {
      // アクションをパスにマッピング
      const apiPath = actionToPathMap[action] || action.replace(/-/g, '');
      backendUrl = `http://${backendHost}:${backendPort}/api/stories/${id}/${apiPath}/`;

      console.log(`Mapped action '${action}' to path '${apiPath}'`);
    }
    // 小説作成の場合
    else if (action === 'create') {
      // /api/stories/
      backendUrl = `http://${backendHost}:${backendPort}/api/stories/`;
    }
    // 小説IDのみが指定されている場合（更新など）
    else if (id) {
      backendUrl += `${id}/`;
    }

    console.log(`Stories API: Forwarding POST request to ${backendUrl}`);
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
    console.error('Stories API error:', error);

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
        error: '小説作成リクエストに失敗しました',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '小説IDが指定されていません' },
        { status: 400 }
      );
    }

    // リクエストボディを取得
    const body = await request.json().catch(() => ({}));

    // バックエンドの設定
    const backendHost = process.env.BACKEND_HOST || 'localhost';
    const backendPort = process.env.BACKEND_PORT || '8001';

    // バックエンドのエンドポイント構築
    const backendUrl = `http://${backendHost}:${backendPort}/api/stories/${id}/`;

    console.log(`Stories API: Forwarding PATCH request to ${backendUrl}`);
    console.log(`Request body:`, body);

    // タイムアウト処理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒タイムアウト

    const response = await fetch(backendUrl, {
      method: 'PATCH',
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
    console.error('Stories API error:', error);

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
        error: '小説更新リクエストに失敗しました',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '小説IDが指定されていません' },
        { status: 400 }
      );
    }

    // バックエンドの設定
    const backendHost = process.env.BACKEND_HOST || 'localhost';
    const backendPort = process.env.BACKEND_PORT || '8001';

    // バックエンドのエンドポイント構築
    const backendUrl = `http://${backendHost}:${backendPort}/api/stories/${id}/`;

    console.log(`Stories API: Forwarding DELETE request to ${backendUrl}`);

    // タイムアウト処理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒タイムアウト

    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // 204 No Contentの場合は空のJSONを返す
    if (response.status === 204) {
      return NextResponse.json({}, { status: 204 });
    }

    // 他のステータスコードの場合はレスポンスボディを返す
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    // バックエンドのレスポンスをそのまま返す
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Stories API error:', error);

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
        error: '小説削除リクエストに失敗しました',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
