/**
 * エピソードの並び替えテストフロー
 */
async function runEpisodesReorderingTestFlow(
  storyId: number | string,
  actId: number | string, 
  useBackend: boolean
): Promise<boolean> {
  const apiUrl = useBackend ? BACKEND_API_URL : FRONTEND_API_URL;
  const apiLabel = useBackend ? 'Backend' : 'Frontend';
  console.log(`\n=== ${apiLabel} エピソード並び替えテスト ===`);
  
  try {
    // ステップ1: エピソード一覧を取得して確認
    console.log(`\nSTEP 1: 並び替え前のエピソード一覧を取得`);
    const listResult = await makeApiRequest<DRFPaginatedResponse<EpisodeData>>(
      `${apiUrl}/stories/${storyId}/acts/${actId}/episodes/`
    );
    
    if (!listResult.success || !listResult.data) {
      console.error('❌ エピソード一覧取得に失敗しました:', listResult.error);
      return false;
    }
    
    const initialEpisodes = listResult.data.results;
    console.log(`✓ エピソード一覧取得成功: ${initialEpisodes.length}件のエピソードが存在します`);
    
    // エピソード数が不足している場合は新規作成
    if (initialEpisodes.length < 5) {
      console.log('エピソード数が不足しているため、新規エピソードを作成します');
      for (let i = initialEpisodes.length; i < 5; i++) {
        const timestamp = new Date().toISOString();
        const newEpisodeData = {
          title: `テストエピソード ${i+1} ${timestamp}`,
          content: `これはテストエピソード ${i+1} の内容です。作成日時: ${timestamp}`,
          raw_content: `これはテストエピソード ${i+1} の生コンテンツです。作成日時: ${timestamp}`
        };
        
        const createResult = await makeApiRequest<EpisodeData>(
          `${apiUrl}/stories/${storyId}/acts/${actId}/episodes/new/`,
          'POST',
          newEpisodeData
        );
        
        if (!createResult.success || !createResult.data) {
          console.error(`❌ エピソード ${i+1} の作成に失敗しました:`, createResult.error);
          return false;
        }
        
        console.log(`✓ エピソード ${i+1} の作成成功: ID=${createResult.data.id}`);
      }
      
      // 更新されたエピソード一覧を取得
      const updatedListResult = await makeApiRequest<DRFPaginatedResponse<EpisodeData>>(
        `${apiUrl}/stories/${storyId}/acts/${actId}/episodes/`
      );
      
      if (!updatedListResult.success || !updatedListResult.data) {
        console.error('❌ 更新されたエピソード一覧取得に失敗しました:', updatedListResult.error);
        return false;
      }
      
      console.log(`✓ 更新されたエピソード一覧取得成功: ${updatedListResult.data.results.length}件のエピソードが存在します`);
    }
    
    // 再度エピソード一覧を取得
    const refreshedListResult = await makeApiRequest<DRFPaginatedResponse<EpisodeData>>(
      `${apiUrl}/stories/${storyId}/acts/${actId}/episodes/`
    );
    
    if (!refreshedListResult.success || !refreshedListResult.data) {
      console.error('❌ 最新のエピソード一覧取得に失敗しました:', refreshedListResult.error);
      return false;
    }
    
    const episodes = refreshedListResult.data.results;
    
    // 最低5つのエピソードがあることを確認
    if (episodes.length < 5) {
      console.error(`❌ テストに必要な数のエピソードがありません。5つ必要ですが、${episodes.length}つしかありません。`);
      return false;
    }
    
    // エピソード一覧を表示
    console.log('現在のエピソード一覧:');
    episodes.forEach((ep, index) => {
      console.log(`- [${index}] ID=${ep.id}, 番号=${ep.episode_number}, タイトル="${ep.title}"`);
    });
    
    // 中央のエピソードを特定（インデックス2 = 3番目のエピソード）
    const middleIndex = 2; // 0から始まるインデックスで、3番目は2
    const middleEpisode = episodes[middleIndex];
    
    if (!middleEpisode || middleEpisode.id === undefined) {
      console.error('❌ 中央エピソードが不明です');
      return false;
    }
    
    console.log(`\n中央エピソード: "${middleEpisode.title}" (ID=${middleEpisode.id}, 現在位置=${middleEpisode.episode_number})`);
    
    // テスト1: 中央エピソードを前方へ移動（1つ前へ）
    console.log(`\nテスト1: 中央エピソードを前方へ移動（現在位置-1）`);
    const newPosition1 = Number(middleEpisode.episode_number) - 1;
    
    const moveForwardResult = await updateEpisodeNumber(
      storyId,
      actId, 
      middleEpisode.id,
      newPosition1,
      apiUrl
    );
    
    if (!moveForwardResult.success || !moveForwardResult.data) {
      console.error('❌ エピソードの前方移動に失敗しました:', moveForwardResult.error);
      return false;
    }
    
    console.log('✓ エピソードの前方移動成功');
    console.log('並び替え後のエピソード一覧:');
    moveForwardResult.data.results.forEach((ep) => {
      console.log(`- ID=${ep.id}, 番号=${ep.episode_number}, タイトル="${ep.title}"`);
    });
    
    // 位置が正しく更新されたか確認
    const movedEpisode1 = moveForwardResult.data.results.find(ep => ep.id === middleEpisode.id);
    if (movedEpisode1 && movedEpisode1.episode_number !== undefined && movedEpisode1.episode_number === newPosition1) {
      console.log(`✓ エピソード ID=${middleEpisode.id} が正しく位置 ${newPosition1} に移動しました`);
    } else {
      console.error(`❌ エピソードの移動が正しく反映されていません。期待:${newPosition1}, 実際:${movedEpisode1?.episode_number}`);
      return false;
    }
    
    // テスト2: 中央エピソードを後方へ移動（元の位置+1）
    console.log(`\nテスト2: 中央エピソードを後方へ移動（元の位置+1）`);
    const newPosition2 = Number(middleEpisode.episode_number) + 1;
    
    const moveBackwardResult = await updateEpisodeNumber(
      storyId,
      actId, 
      middleEpisode.id,
      newPosition2,
      apiUrl
    );
    
    if (!moveBackwardResult.success || !moveBackwardResult.data) {
      console.error('❌ エピソードの後方移動に失敗しました:', moveBackwardResult.error);
      return false;
    }
    
    console.log('✓ エピソードの後方移動成功');
    console.log('並び替え後のエピソード一覧:');
    moveBackwardResult.data.results.forEach((ep) => {
      console.log(`- ID=${ep.id}, 番号=${ep.episode_number}, タイトル="${ep.title}"`);
    });
    
    // 位置が正しく更新されたか確認
    const movedEpisode2 = moveBackwardResult.data.results.find(ep => ep.id === middleEpisode.id);
    if (movedEpisode2 && movedEpisode2.episode_number !== undefined && movedEpisode2.episode_number === newPosition2) {
      console.log(`✓ エピソード ID=${middleEpisode.id} が正しく位置 ${newPosition2} に移動しました`);
    } else {
      console.error(`❌ エピソードの移動が正しく反映されていません。期待:${newPosition2}, 実際:${movedEpisode2?.episode_number}`);
      return false;
    }
    
    // テスト3: 中央エピソードを先頭へ移動
    console.log(`\nテスト3: 中央エピソードを先頭へ移動（位置1）`);
    const newPosition3 = 1;
    
    const moveToFirstResult = await updateEpisodeNumber(
      storyId,
      actId, 
      middleEpisode.id,
      newPosition3,
      apiUrl
    );
    
    if (!moveToFirstResult.success || !moveToFirstResult.data) {
      console.error('❌ エピソードの先頭移動に失敗しました:', moveToFirstResult.error);
      return false;
    }
    
    console.log('✓ エピソードの先頭移動成功');
    console.log('並び替え後のエピソード一覧:');
    moveToFirstResult.data.results.forEach((ep) => {
      console.log(`- ID=${ep.id}, 番号=${ep.episode_number}, タイトル="${ep.title}"`);
    });
    
    // 位置が正しく更新されたか確認
    const movedEpisode3 = moveToFirstResult.data.results.find(ep => ep.id === middleEpisode.id);
    if (movedEpisode3 && movedEpisode3.episode_number !== undefined && movedEpisode3.episode_number === newPosition3) {
      console.log(`✓ エピソード ID=${middleEpisode.id} が正しく位置 ${newPosition3} に移動しました`);
    } else {
      console.error(`❌ エピソードの移動が正しく反映されていません。期待:${newPosition3}, 実際:${movedEpisode3?.episode_number}`);
      return false;
    }
    
    // テスト4: 中央エピソードを最後へ移動
    console.log(`\nテスト4: 中央エピソードを最後へ移動（位置${episodes.length}）`);
    const newPosition4 = episodes.length;
    
    const moveToLastResult = await updateEpisodeNumber(
      storyId,
      actId, 
      middleEpisode.id,
      newPosition4,
      apiUrl
    );
    
    if (!moveToLastResult.success || !moveToLastResult.data) {
      console.error('❌ エピソードの最後移動に失敗しました:', moveToLastResult.error);
      return false;
    }
    
    console.log('✓ エピソードの最後移動成功');
    console.log('並び替え後のエピソード一覧:');
    moveToLastResult.data.results.forEach((ep) => {
      console.log(`- ID=${ep.id}, 番号=${ep.episode_number}, タイトル="${ep.title}"`);
    });
    
    // 位置が正しく更新されたか確認
    const movedEpisode4 = moveToLastResult.data.results.find(ep => ep.id === middleEpisode.id);
    if (movedEpisode4 && movedEpisode4.episode_number !== undefined && movedEpisode4.episode_number === newPosition4) {
      console.log(`✓ エピソード ID=${middleEpisode.id} が正しく位置 ${newPosition4} に移動しました`);
    } else {
      console.error(`❌ エピソードの移動が正しく反映されていません。期待:${newPosition4}, 実際:${movedEpisode4?.episode_number}`);
      return false;
    }
    
    console.log('\n✓ 全てのエピソード並び替えテストが成功しました');
    return true;
  } catch (error) {
    console.error('❌ 複数エピソードの並び替えテスト中にエラーが発生しました:', error);
    return false;
  }
}

/**
 * テスト用のエピソードを複数作成
 */
async function createTestEpisodes(
  apiUrl: string, 
  storyId: number | string, 
  actId: number | string, 
  count: number = 5
): Promise<ApiResponse<EpisodeData[]>> {
  const createdEpisodes: EpisodeData[] = [];
  let allSuccess = true;
  
  try {
    for (let i = 1; i <= count; i++) {
      const episodeData = {
        title: `テストエピソード ${i} (${new Date().toISOString().slice(0, 16)})`,
        content: `これはテスト用に自動生成されたエピソード ${i} です。作成日時: ${new Date().toISOString()}`,
        raw_content: `これはテスト用に自動生成されたエピソード ${i} の生コンテンツです。作成日時: ${new Date().toISOString()}`
      };
      
      const response = await makeApiRequest<EpisodeData>(
        `${apiUrl}/stories/${storyId}/acts/${actId}/episodes/new/`,
        'POST',
        episodeData
      );
      
      if (response.success && response.data) {
        console.log(`✓ テスト用エピソード ${i} の作成に成功しました: ID=${response.data.id}`);
        createdEpisodes.push(response.data);
      } else {
        console.error(`❌ テスト用エピソード ${i} の作成に失敗しました: ${response.error}`);
        allSuccess = false;
      }
    }
    
    return {
      success: allSuccess,
      data: createdEpisodes,
      status: 200
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      status: 500
    };
  }
}
