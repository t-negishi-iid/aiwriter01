import { NextRequest, NextResponse } from 'next/server';
import { unifiedStoryApi } from '@/lib/unified-api-client';

/**
 * 小説関連のAPIエンドポイント - 統一API使用版
 * クエリパラメータ形式でアクションを指定：
 * - /api/stories?action=create - 小説作成 (POSTメソッドも使用可能)
 * - /api/stories?id=123 - 小説詳細取得
 * - /api/stories?action=update&id=123 - 小説更新 (PUTメソッドも使用可能)
 * - /api/stories?action=delete&id=123 - 小説削除 (DELETEメソッドも使用可能)
 * - /api/stories - 小説一覧取得
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    console.log(`Stories API (統一API使用): GET request with id=${id}, action=${action}`);

    // 小説IDとアクションが指定されている場合
    if (id && action) {
      if (action === 'delete') {
        // 削除操作
        const result = await unifiedStoryApi.deleteStory(id);
        return NextResponse.json(result);
      } else if (action === 'update') {
        // 更新操作（GETでupdateは通常使用しません）
        return NextResponse.json(
          { error: 'Update action requires PUT method' },
          { status: 400 }
        );
      }
      // その他の特殊アクション（将来的な拡張用）
    }
    // 小説IDのみが指定されている場合（個別取得）
    else if (id) {
      const result = await unifiedStoryApi.getStory(id);
      return NextResponse.json(result);
    }
    // IDもアクションも指定されていない場合（一覧取得）
    else {
      const result = await unifiedStoryApi.getStories();
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Stories API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    console.log(`Stories API (統一API使用): POST request with action=${action}`);

    // リクエストボディを取得
    const data = await request.json();
    
    // actionが'create'または未指定の場合は作成操作
    if (!action || action === 'create') {
      const result = await unifiedStoryApi.createStory(data);
      return NextResponse.json(result);
    }
    
    // その他のアクションは未サポート
    return NextResponse.json(
      { error: `Unsupported action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Stories API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    console.log(`Stories API (統一API使用): PUT request with id=${id}`);

    if (!id) {
      return NextResponse.json(
        { error: 'ID parameter is required for update operation' },
        { status: 400 }
      );
    }

    // リクエストボディを取得
    const data = await request.json();
    
    // 更新操作を実行
    const result = await unifiedStoryApi.updateStory(id, data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Stories API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    console.log(`Stories API (統一API使用): DELETE request with id=${id}`);

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required for DELETE operation' },
        { status: 400 }
      );
    }

    // デバッグ情報を出力
    console.log(`DELETE操作を実行します: ID=${id}`);
    
    try {
      // 削除操作を実行
      await unifiedStoryApi.deleteStory(id);
      
      // 成功した場合は204レスポンスを返す（バックエンドと同じステータスコード）
      return new NextResponse(null, { status: 204 });
    } catch (deleteError) {
      console.error('Delete operation failed:', deleteError);
      return NextResponse.json(
        { 
          error: deleteError instanceof Error ? deleteError.message : '削除操作に失敗しました', 
          details: JSON.stringify(deleteError)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Stories API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    );
  }
}
