#!/usr/bin/env node

/**
 * エピソード関連APIのテストスクリプト
 */
const axios = require('axios');

// 基本設定
const BACKEND_API_URL = 'http://localhost:8000/api';
const storyId = process.argv[2] || '1';
const actNumber = process.argv[3] || '1';

console.log('==================================================');
console.log(`エピソードAPIテスト開始`);
console.log('==================================================');
console.log(`ストーリーID: ${storyId}`);
console.log(`幕番号: ${actNumber}`);
console.log('--------------------------------------------------');

// APIリクエスト関数
async function apiRequest(url, method = 'GET', data = null) {
  try {
    const options = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      options.data = data;
    }
    
    const response = await axios(options);
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status || 500
    };
  }
}

// エピソード一覧取得テスト
async function testListEpisodes() {
  console.log('\n=== エピソード一覧取得テスト ===');
  
  const url = `${BACKEND_API_URL}/stories/${storyId}/acts/${actNumber}/episodes/`;
  console.log(`GET ${url}`);
  
  const result = await apiRequest(url);
  
  if (!result.success) {
    console.error('❌ エピソード一覧取得に失敗しました:', result.error);
    return;
  }
  
  console.log(`✓ エピソード一覧取得成功: ${result.data.count}件のエピソードが存在します`);
  console.log('エピソード一覧:');
  result.data.results.forEach((ep, index) => {
    console.log(`- [${index}] ID=${ep.id}, 番号=${ep.episode_number}, タイトル="${ep.title}"`);
  });
  
  return result.data.results;
}

// エピソード作成テスト
async function testCreateEpisode() {
  console.log('\n=== エピソード作成テスト ===');
  
  const url = `${BACKEND_API_URL}/stories/${storyId}/acts/${actNumber}/episodes/`;
  const timestamp = new Date().toISOString();
  const data = {
    title: `テストエピソード (${timestamp})`,
    content: `これはテスト用に自動生成されたエピソードです。作成日時: ${timestamp}`
  };
  
  console.log(`POST ${url}`);
  console.log('リクエストデータ:', data);
  
  const result = await apiRequest(url, 'POST', data);
  
  if (!result.success) {
    console.error('❌ エピソード作成に失敗しました:', result.error);
    return null;
  }
  
  console.log(`✓ エピソード作成成功: ID=${result.data.id}, タイトル="${result.data.title}"`);
  return result.data;
}

// エピソード更新テスト
async function testUpdateEpisode(episodeId) {
  if (!episodeId) {
    console.log('⚠️ エピソード更新テストをスキップします: エピソードIDが指定されていません');
    return;
  }
  
  console.log('\n=== エピソード更新テスト ===');
  
  const url = `${BACKEND_API_URL}/stories/${storyId}/acts/${actNumber}/episodes/${episodeId}/`;
  const timestamp = new Date().toISOString();
  const data = {
    title: `更新されたエピソード (${timestamp})`,
    content: `これは更新されたエピソードの内容です。更新日時: ${timestamp}`
  };
  
  console.log(`PATCH ${url}`);
  console.log('更新データ:', data);
  
  const result = await apiRequest(url, 'PATCH', data);
  
  if (!result.success) {
    console.error('❌ エピソード更新に失敗しました:', result.error);
    return;
  }
  
  console.log(`✓ エピソード更新成功: ID=${result.data.id}, 新タイトル="${result.data.title}"`);
}

// エピソード並び替えテスト
async function testReorderEpisode(episodes) {
  if (!episodes || episodes.length < 2) {
    console.log('⚠️ エピソード並び替えテストをスキップします: 十分なエピソードがありません');
    return;
  }
  
  console.log('\n=== エピソード並び替えテスト ===');
  
  // 2番目のエピソードを先頭に移動
  const targetEpisode = episodes[1];
  const url = `${BACKEND_API_URL}/stories/${storyId}/acts/${actNumber}/episodes/${targetEpisode.id}/`;
  const data = { episode_number: 1 };
  
  console.log(`PATCH ${url}`);
  console.log(`エピソード "${targetEpisode.title}" (ID=${targetEpisode.id}) を位置1に移動`);
  
  const result = await apiRequest(url, 'PATCH', data);
  
  if (!result.success) {
    console.error('❌ エピソード並び替えに失敗しました:', result.error);
    return;
  }
  
  console.log('✓ エピソード並び替え成功');
  console.log('並び替え後のエピソード一覧:');
  result.data.results.forEach((ep, index) => {
    console.log(`- [${index}] ID=${ep.id}, 番号=${ep.episode_number}, タイトル="${ep.title}"`);
  });
}

// エピソード削除テスト
async function testDeleteEpisode(episodeId) {
  if (!episodeId) {
    console.log('⚠️ エピソード削除テストをスキップします: エピソードIDが指定されていません');
    return;
  }
  
  console.log('\n=== エピソード削除テスト ===');
  
  const url = `${BACKEND_API_URL}/stories/${storyId}/acts/${actNumber}/episodes/${episodeId}/`;
  
  console.log(`DELETE ${url}`);
  
  const result = await apiRequest(url, 'DELETE');
  
  if (!result.success) {
    console.error('❌ エピソード削除に失敗しました:', result.error);
    return;
  }
  
  console.log(`✓ エピソード削除成功: ID=${episodeId}`);
  
  // 削除確認
  const checkResult = await apiRequest(url);
  
  if (!checkResult.success && checkResult.status === 404) {
    console.log(`✓ エピソードの削除が確認できました: ID=${episodeId} (404 Not Found)`);
  } else {
    console.error(`❌ エピソードが削除されていません: ID=${episodeId}`);
  }
}

// Dify APIによるエピソード一括生成テスト
async function testBulkCreateEpisodes() {
  console.log('\n=== エピソード一括生成テスト ===');
  
  const url = `${BACKEND_API_URL}/stories/${storyId}/acts/${actNumber}/episodes/create/`;
  const data = {
    episode_count: 2,
    basic_setting_id: 1  // 実際のテストでは有効なbasic_setting_idを指定
  };
  
  console.log(`POST ${url}`);
  console.log('リクエストデータ:', data);
  
  const result = await apiRequest(url, 'POST', data);
  
  if (!result.success) {
    console.error('❌ エピソード一括生成に失敗しました:', result.error);
    return;
  }
  
  console.log(`✓ エピソード一括生成成功`);
  console.log('生成されたエピソード:');
  result.data.results.forEach((ep, index) => {
    console.log(`- [${index}] ID=${ep.id}, 番号=${ep.episode_number}, タイトル="${ep.title}"`);
  });
}

// メインテスト実行
async function runTests() {
  try {
    // エピソード一覧取得
    const episodes = await testListEpisodes();
    
    // エピソード作成
    const newEpisode = await testCreateEpisode();
    
    // エピソード更新
    if (newEpisode) {
      await testUpdateEpisode(newEpisode.id);
    }
    
    // エピソード並び替え
    await testReorderEpisode(episodes);
    
    // エピソード一括生成
    await testBulkCreateEpisodes();
    
    // エピソード一覧の最終状態を表示
    await testListEpisodes();
    
    // クリーンアップ（作成したエピソードを削除）
    if (newEpisode) {
      await testDeleteEpisode(newEpisode.id);
    }
    
    console.log('\n==================================================');
    console.log('エピソードAPIテスト完了');
    console.log('==================================================');
  } catch (error) {
    console.error('❌ テスト実行中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// テスト実行
runTests();
