import { NextRequest, NextResponse } from 'next/server';

/**
 * 統合設定クリエイターの詳細データを取得するAPI
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
    console.log(`[TRACE] 統合設定クリエイターデータを取得中... storyId: ${storyId} - ${new Date().toISOString()}`);
    
    // バックエンドAPIのURLを構築
    const apiUrl = process.env.BACKEND_API_URL || 'http://localhost:8001/api';
    const endpoint = `/stories/${storyId}/integrated-setting-creator/detail/`;
    const url = `${apiUrl}${endpoint}`;
    
    console.log(`[TRACE] バックエンドAPIリクエスト: ${url} - ${new Date().toISOString()}`);
    
    // バックエンドAPIを直接呼び出し
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // キャッシュを無効化
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
    console.error(`[TRACE] 統合設定クリエイターデータ取得エラー: ${error} - ${new Date().toISOString()}`);
    
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
