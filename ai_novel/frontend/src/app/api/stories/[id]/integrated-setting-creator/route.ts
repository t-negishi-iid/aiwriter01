import { NextRequest, NextResponse } from 'next/server';

/**
 * 統合設定クリエイターデータを取得・保存するAPI
 * 
 * @param request - NextRequest
 * @param params - URLパラメータ（id）
 * @returns NextResponse
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  try {
    console.log(`[TRACE] 統合設定クリエイターデータを取得中... storyId: ${id} - ${new Date().toISOString()}`);
    
    // バックエンドAPIを呼び出し
    const apiUrl = process.env.BACKEND_API_URL || 'http://localhost:8001/api';
    
    // まず統合設定クリエイターのエンドポイントを試す
    let endpoint = `/stories/${id}/integrated-setting-creator/`;
    let url = `${apiUrl}${endpoint}`;
    
    console.log(`[TRACE] バックエンドAPIリクエスト: ${url} - ${new Date().toISOString()}`);
    
    let response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // キャッシュを無効化
    });
    
    // 405エラー（メソッドが許可されていない）の場合は、別のエンドポイントを試す
    if (response.status === 405) {
      console.log(`[TRACE] 405エラー、別のエンドポイントを試します - ${new Date().toISOString()}`);
      
      // 基本設定データのエンドポイントを試す
      endpoint = `/stories/${id}/basic-setting/`;
      url = `${apiUrl}${endpoint}`;
      
      console.log(`[TRACE] 代替バックエンドAPIリクエスト: ${url} - ${new Date().toISOString()}`);
      
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });
    }
    
    console.log(`[TRACE] バックエンドAPIレスポンス受信 - ステータス: ${response.status} - ${new Date().toISOString()}`);
    
    // 404エラーの場合は、空のデータを返す
    if (response.status === 404) {
      console.log(`[TRACE] 404エラー、空のデータを返します - ${new Date().toISOString()}`);
      return NextResponse.json({
        success: true,
        data: {
          basic_setting_data: "",
          integrated_setting_data: ""
        }
      });
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TRACE] バックエンドAPIエラー: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`${response.status} ${response.statusText}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`[TRACE] バックエンドAPIレスポンス: ${JSON.stringify(data).substring(0, 200)}... - ${new Date().toISOString()}`);
    
    // バックエンドからのレスポンスをそのまま返す
    return NextResponse.json({
      success: true,
      data: data
    });
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

/**
 * 統合設定クリエイターデータを保存するAPI
 * 
 * @param request - NextRequest
 * @param params - URLパラメータ（id）
 * @returns NextResponse
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  try {
    console.log(`[TRACE] 統合設定クリエイターデータを保存中... storyId: ${id} - ${new Date().toISOString()}`);
    
    // リクエストボディを取得
    const requestData = await request.json();
    console.log(`[TRACE] リクエストデータ: ${JSON.stringify(requestData).substring(0, 200)}... - ${new Date().toISOString()}`);
    
    // バックエンドAPIを呼び出し
    const apiUrl = process.env.BACKEND_API_URL || 'http://localhost:8001/api';
    // エンドポイントが/で始まっていない場合は追加
    const normalizedEndpoint = `/stories/${id}/integrated-setting-creator/`;
    const url = `${apiUrl}${normalizedEndpoint}`;
    
    console.log(`[TRACE] バックエンドAPIリクエスト: ${url} - ${new Date().toISOString()}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
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
    console.error(`[TRACE] 統合設定クリエイターデータ保存エラー: ${error} - ${new Date().toISOString()}`);
    
    // エラーレスポンスを返す
    return NextResponse.json(
      {
        success: false,
        message: `統合設定クリエイターデータの保存に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
        errors: { detail: ['サーバーエラーが発生しました'] }
      },
      { status: 500 }
    );
  }
}
