/**
 * 基本設定の幕別あらすじ更新APIテストスクリプト
 *
 * 実行方法:
 * 1. インタラクティブモード:
 *    ts-node test_basic_setting_act_update.ts --story-id=24 --act-number=1
 *
 * 2. バックエンド直接アクセス:
 *    ts-node test_basic_setting_act_update.ts --story-id=24 --act-number=1 --backend-direct
 *
 * 3. 比較テスト:
 *    ts-node test_basic_setting_act_update.ts --story-id=24 --act-number=1 --compare
 *
 * 4. 自動テスト (エラー時に終了コード1を返す):
 *    ts-node test_basic_setting_act_update.ts --story-id=24 --act-number=1 --test
 */

import * as readline from 'readline';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

// APIのベースURL
//const FRONTEND_API_URL = 'http://localhost:3000/api'; フロントエンドテストは不要
const BACKEND_API_URL = 'http://localhost:8001/api';

// デフォルト設定
const DEFAULT_STORY_ID = '24';
const DEFAULT_ACT_NUMBER = '1';
const DEFAULT_CONTENT = '更新するあらすじ内容のテストデータです。このテキストは自動テスト用です。';

// コマンドライン引数の解析
interface CommandLineArgs {
  test?: boolean;
  help?: boolean;
  backendDirect?: boolean;  // バックエンドに直接アクセスするかどうか
  compareMode?: boolean;    // フロントエンドとバックエンドの両方をテストして比較
  storyId?: string;         // 小説ID
  actNumber?: string;       // 幕番号（1, 2, 3）
  content?: string;         // 更新内容
  saveOutput?: boolean;     // 出力を保存するかどうか
}

/**
 * コマンドライン引数を解析する関数
 * @returns パース済みの引数オブジェクト
 */
function parseCommandLineArgs(): CommandLineArgs {
  const args: CommandLineArgs = {};

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];

    if (arg === '--test') {
      args.test = true;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--backend-direct' || arg === '-b') {
      args.backendDirect = true;
    } else if (arg === '--compare' || arg === '-c') {
      args.compareMode = true;
    } else if (arg === '--save-output' || arg === '-s') {
      args.saveOutput = true;
    } else if (arg.startsWith('--story-id=')) {
      args.storyId = arg.split('=')[1];
    } else if (arg.startsWith('--act-number=')) {
      args.actNumber = arg.split('=')[1];
    } else if (arg.startsWith('--content=')) {
      args.content = arg.split('=')[1];
    }
  }

  // デフォルト値の設定
  if (!args.storyId) args.storyId = DEFAULT_STORY_ID;
  if (!args.actNumber) args.actNumber = DEFAULT_ACT_NUMBER;
  if (!args.content) args.content = DEFAULT_CONTENT;

  return args;
}

/**
 * ヘルプメッセージを表示する関数
 */
function showHelp() {
  console.log(`
使用方法:
  ts-node test_basic_setting_act_update.ts [オプション]

オプション:
  --story-id=<ID>       テスト対象の小説ID (デフォルト: ${DEFAULT_STORY_ID})
  --act-number=<NUM>    更新対象の幕番号 (1, 2, 3) (デフォルト: ${DEFAULT_ACT_NUMBER})
  --content=<TEXT>      更新するあらすじの内容 (デフォルト: テスト文章)
  --backend-direct, -b  バックエンドに直接リクエストを送信
  --compare, -c         フロントエンドとバックエンドの両方をテストして結果を比較
  --test                テストモードで実行（エラー時に終了コード1で終了）
  --save-output, -s     テスト結果をJSONファイルに保存
  --help, -h            このヘルプメッセージを表示

例:
  ts-node test_basic_setting_act_update.ts --story-id=24 --act-number=1
  ts-node test_basic_setting_act_update.ts --story-id=24 --act-number=2 --content="新しいあらすじ"
  ts-node test_basic_setting_act_update.ts --story-id=24 --act-number=3 --backend-direct
  `);
}

/**
 * 基本設定の幕別あらすじを更新するAPIにリクエストを送信する関数
 * @param apiUrl 使用するAPIのベースURL
 * @param storyId 小説ID
 * @param actNumber 幕番号（1, 2, 3）
 * @param content 更新内容
 * @param apiLabel APIの表示ラベル（ログ出力用）
 * @returns API応答
 */
async function updateBasicSettingAct(
  apiUrl: string,
  storyId: string,
  actNumber: string,
  content: string,
  apiLabel: string = 'API'
) {
  try {
    console.log(`🔍 ${apiLabel}: 小説ID ${storyId} の第${actNumber}幕あらすじを更新中...`);

    // エンドポイント
    const endpoint = `${apiUrl}/stories/${storyId}/basic-setting-act/${actNumber}/`;
    console.log(`📡 リクエストURL: ${endpoint}`);
    console.log(`📝 リクエスト内容: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`);

    // APIリクエストを実行
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    console.log(`📊 ステータスコード: ${response.status} (${response.statusText})`);

    // レスポンスをJSON形式で取得
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = null;
      console.log('📋 レスポンスボディ: JSONではありません');
    }

    if (response.ok) {
      // 結果を表示
      console.log(`✅ ${apiLabel}: 基本設定の第${actNumber}幕あらすじ更新成功`);
      console.log('📋 更新結果:');
      console.log(JSON.stringify(data, null, 2));

      return {
        success: true,
        status: response.status,
        data
      };
    } else {
      // エラーを表示
      console.error(`❌ ${apiLabel}: エラーレスポンス`);
      console.error('📋 エラー内容:');
      console.error(JSON.stringify(data, null, 2));

      return {
        success: false,
        status: response.status,
        data
      };
    }
  } catch (error) {
    console.error(`❌ ${apiLabel}: リクエスト実行エラー:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 最新の基本設定を取得する関数
 * @param apiUrl 使用するAPIのベースURL
 * @param storyId 小説ID
 * @param apiLabel APIの表示ラベル（ログ出力用）
 * @returns API応答
 */
async function getLatestBasicSetting(apiUrl: string, storyId: string, apiLabel: string = 'API') {
  try {
    console.log(`🔍 ${apiLabel}: 小説ID ${storyId} の最新基本設定を取得中...`);

    // エンドポイント
    const endpoint = `${apiUrl}/stories/${storyId}/latest-basic-setting/`;
    console.log(`📡 リクエストURL: ${endpoint}`);

    // APIリクエストを実行
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log(`📊 ステータスコード: ${response.status} (${response.statusText})`);

    // レスポンスをJSON形式で取得
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = null;
      console.log('📋 レスポンスボディ: JSONではありません');
    }

    if (response.ok) {
      // 結果を表示
      console.log(`✅ ${apiLabel}: 最新基本設定取得成功`);
      if (data) {
        console.log('📋 取得結果:');
        // 各幕のあらすじだけ表示
        const overviews = {
          act1_overview: data.act1_overview,
          act2_overview: data.act2_overview,
          act3_overview: data.act3_overview
        };
        console.log(JSON.stringify(overviews, null, 2));
      }

      return {
        success: true,
        status: response.status,
        data
      };
    } else {
      // エラーを表示
      console.error(`❌ ${apiLabel}: エラーレスポンス`);
      console.error('📋 エラー内容:');
      console.error(JSON.stringify(data, null, 2));

      return {
        success: false,
        status: response.status,
        data
      };
    }
  } catch (error) {
    console.error(`❌ ${apiLabel}: リクエスト実行エラー:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 2つのレスポンスを比較する関数
 * @param frontendResult フロントエンドのレスポンス
 * @param backendResult バックエンドのレスポンス
 * @returns 比較結果（一致する場合はtrue）
 */
function compareResults(frontendResult: any, backendResult: any): boolean {
  console.log('\n🔍 フロントエンドとバックエンドの応答を比較します...');

  // 両方成功した場合のみ比較
  if (frontendResult.success && backendResult.success) {
    // ステータスコードの比較
    const statusMatch = frontendResult.status === backendResult.status;
    console.log(`📊 ステータスコード: ${statusMatch ? '✅ 一致' : '❌ 不一致'} (フロントエンド: ${frontendResult.status}, バックエンド: ${backendResult.status})`);

    // データの比較
    let dataMatch = false;
    try {
      // フィールドの比較
      const frontendData = frontendResult.data;
      const backendData = backendResult.data;

      // バックエンドとフロントエンドで同じデータが返ってくるか確認
      if (frontendData && backendData) {
        const fieldsToCompare = ['id', 'act1_overview', 'act2_overview', 'act3_overview'];
        const mismatchedFields = [];

        for (const field of fieldsToCompare) {
          if (JSON.stringify(frontendData[field]) !== JSON.stringify(backendData[field])) {
            mismatchedFields.push(field);
          }
        }

        dataMatch = mismatchedFields.length === 0;
        if (!dataMatch) {
          console.log(`📋 データ: ❌ 不一致 (不一致フィールド: ${mismatchedFields.join(', ')})`);
        } else {
          console.log('📋 データ: ✅ 一致');
        }
      } else {
        console.log('📋 データ: ❌ 不一致 (データが不完全)');
      }
    } catch (error) {
      console.error('📋 データ比較エラー:', error);
    }

    // 全体の一致判定
    const overallMatch = statusMatch && dataMatch;
    if (overallMatch) {
      console.log('🎉 フロントエンドとバックエンドの応答は完全に一致しています！');
    } else {
      console.log('⚠️ フロントエンドとバックエンドの応答に違いがあります');
    }

    return overallMatch;
  } else {
    console.log('⚠️ エラーが発生したため比較できません');
    return false;
  }
}

/**
 * 結果をファイルに保存する関数
 * @param data 保存するデータ
 * @param storyId 小説ID
 * @param actNumber 幕番号
 */
function saveToFile(data: any, storyId: string, actNumber: string) {
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const filename = `test_basic_setting_act_${storyId}_act${actNumber}_${timestamp}.json`;
  const filepath = path.join(process.cwd(), filename);

  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`📁 テスト結果を保存しました: ${filepath}`);
}

/**
 * バックエンドAPIを直接呼び出して基本設定の幕別あらすじを更新するテスト関数
 * BasicSettingとActDetailの分離が正しく行われているかを検証
 */
async function testBasicSettingActUpdate(storyId: string, actNumber: string, content: string): Promise<any> {
  console.log(`[テスト開始] 基本設定の第${actNumber}幕あらすじ更新テスト (ストーリーID: ${storyId})`);
  console.log('更新内容:', content.substring(0, 30) + (content.length > 30 ? '...' : ''));

  try {
    // Step 1: 更新前の基本設定データを取得
    console.log('Step 1: 更新前の基本設定データを取得中...');
    const beforeBasicSetting = await fetchApi(`${BACKEND_API_URL}/stories/${storyId}/latest-basic-setting/`);
    console.log('取得成功: 更新前の基本設定');

    // 更新前の詳細あらすじ (ActDetail) も取得
    console.log('更新前の詳細あらすじ (ActDetail) を取得中...');
    const beforeActDetails = await fetchApi(`${BACKEND_API_URL}/stories/${storyId}/acts/`);
    console.log('取得成功: 更新前の詳細あらすじ');

    // Step 2: 基本設定の特定の幕のあらすじを更新
    console.log(`Step 2: 基本設定の第${actNumber}幕あらすじを更新中...`);
    const updateResponse = await fetchApi(`${BACKEND_API_URL}/stories/${storyId}/basic-setting-act/${actNumber}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    // エラー応答の検証
    if (updateResponse.error) {
      throw new Error(`API エラー: ${updateResponse.error}`);
    }

    console.log('更新成功: 応答', updateResponse);

    // Step 3: 更新後の基本設定データを取得
    console.log('Step 3: 更新後の基本設定データを取得中...');
    const afterBasicSetting = await fetchApi(`${BACKEND_API_URL}/stories/${storyId}/latest-basic-setting/`);
    console.log('取得成功: 更新後の基本設定');

    // 更新後の詳細あらすじ (ActDetail) も取得
    console.log('更新後の詳細あらすじ (ActDetail) を取得中...');
    const afterActDetails = await fetchApi(`${BACKEND_API_URL}/stories/${storyId}/acts/`);
    console.log('取得成功: 更新後の詳細あらすじ');

    // Step 4: 更新前後の比較検証
    console.log('Step 4: 更新結果の検証...');
    
    // 基本設定の対応するフィールドを取得
    const beforeContent = getActContent(beforeBasicSetting, parseInt(actNumber));
    const afterContent = getActContent(afterBasicSetting, parseInt(actNumber));
    
    console.log('更新前の内容:', beforeContent?.substring(0, 30) + (beforeContent && beforeContent.length > 30 ? '...' : ''));
    console.log('更新後の内容:', afterContent?.substring(0, 30) + (afterContent && afterContent.length > 30 ? '...' : ''));
    
    // 検証1: 基本設定の内容が更新されているか
    const basicSettingUpdated = afterContent === content;
    console.log('検証1: 基本設定の内容が更新されているか:', basicSettingUpdated ? '✅ 成功' : '❌ 失敗');
    
    // 検証2: ActDetailが更新されていないことを確認（分離の検証）
    const actDetailChanged = JSON.stringify(beforeActDetails) !== JSON.stringify(afterActDetails);
    console.log('検証2: ActDetailが更新されていないか (分離の検証):', !actDetailChanged ? '✅ 成功' : '❌ 失敗');
    
    // テスト結果
    const testResult = {
      success: basicSettingUpdated && !actDetailChanged,
      basicSettingUpdated,
      actDetailChanged,
      beforeBasicSetting,
      afterBasicSetting,
      beforeActDetails,
      afterActDetails,
      updateResponse
    };
    
    console.log(`[テスト結果] ${testResult.success ? '✅ 成功' : '❌ 失敗'}`);
    return testResult;

  } catch (error) {
    console.error('テストエラー:', error);
    throw error;
  }
}

/**
 * 基本設定から特定の幕のあらすじを取得するヘルパー関数
 */
function getActContent(basicSetting: any, actNumber: number): string | null {
  if (!basicSetting) return null;
  
  switch (actNumber) {
    case 1:
      return basicSetting.act1_overview || null;
    case 2:
      return basicSetting.act2_overview || null;
    case 3:
      return basicSetting.act3_overview || null;
    default:
      return null;
  }
}

/**
 * APIリクエストを送信するヘルパー関数
 */
async function fetchApi(url: string, options: any = {}): Promise<any> {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API呼び出しエラー:', error);
    throw error;
  }
}

/**
 * メインの実行関数
 */
async function main() {
  // コマンドライン引数を解析
  const args = parseCommandLineArgs();

  // ヘルプ表示
  if (args.help) {
    showHelp();
    return;
  }

  console.log('==============================');
  console.log('🔍 基本設定の幕別あらすじ更新テスト');
  console.log('==============================');
  console.log(`小説ID: ${args.storyId}`);
  console.log(`更新対象: 第${args.actNumber}幕あらすじ`);
  console.log(`更新内容: ${args.content!.substring(0, 30)}${args.content!.length > 30 ? '...' : ''}`);
  console.log(`モード: ${args.backendDirect ? 'バックエンド直接' : args.compareMode ? '比較モード' : 'インタラクティブ'}`);
  console.log('------------------------------');

  // テスト実行
  try {
    // テストモードの場合は、基本設定とActDetailの分離テストを実行
    if (args.test) {
      console.log('\n🧪 基本設定とActDetailの分離検証テストを実行します...');
      const testResult = await testBasicSettingActUpdate(args.storyId!, args.actNumber!, args.content!);
      
      // テストが失敗した場合は終了コード1で終了
      if (!testResult.success) {
        console.error('❌ テストに失敗しました。詳細はログを確認してください。');
        process.exit(1);
      } else {
        console.log('✅ すべてのテストが成功しました！');
        
        // 結果を保存
        if (args.saveOutput) {
          const outputDir = path.join(__dirname, 'test_results');
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
          
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const outputFile = path.join(outputDir, `basic_setting_act_update_test_${timestamp}.json`);
          fs.writeFileSync(outputFile, JSON.stringify(testResult, null, 2));
          console.log(`テスト結果を保存しました: ${outputFile}`);
        }
        
        process.exit(0);
      }
      return;
    }

    // 更新前の基本設定を取得
    console.log('\n📋 更新前の基本設定を取得します...');
    const apiUrl = args.backendDirect ? BACKEND_API_URL : 'http://localhost:3000/api';
    const beforeUpdateResult = await getLatestBasicSetting(apiUrl, args.storyId!, `${args.backendDirect ? 'バックエンド' : 'フロントエンド'}`);

    // 更新実行
    let frontendResult: any;
    let backendResult: any;
    if (args.compareMode) {
      // 比較モード: フロントエンドとバックエンドの両方でテスト
      frontendResult = await updateBasicSettingAct(
        'http://localhost:3000/api',
        args.storyId!,
        args.actNumber!,
        args.content!,
        'フロントエンド'
      );
      
      backendResult = await updateBasicSettingAct(
        BACKEND_API_URL,
        args.storyId!,
        args.actNumber!,
        args.content!,
        'バックエンド'
      );
      
      // 比較結果の出力
      console.log('\n📊 比較結果:');
      console.log('------------------------------');
      console.log('フロントエンド応答:', frontendResult?.success ? '✅ 成功' : '❌ 失敗');
      console.log('バックエンド応答:', backendResult?.success ? '✅ 成功' : '❌ 失敗');
      
      if (JSON.stringify(frontendResult) === JSON.stringify(backendResult)) {
        console.log('✅ 両方の応答が一致しています');
      } else {
        console.log('❌ 応答が一致しません');
        console.log('フロントエンド応答:', frontendResult);
        console.log('バックエンド応答:', backendResult);
      }
    } else {
      // 単一モード: バックエンドまたはフロントエンドで1回テスト
      const result = await updateBasicSettingAct(
        apiUrl,
        args.storyId!,
        args.actNumber!,
        args.content!,
        args.backendDirect ? 'バックエンド' : 'フロントエンド'
      );
      
      // 結果を保存
      if (args.saveOutput && result) {
        const outputDir = path.join(__dirname, 'test_results');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputFile = path.join(outputDir, `basic_setting_act_update_${timestamp}.json`);
        fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
        console.log(`結果を保存しました: ${outputFile}`);
      }
    }
    
    // 更新後の基本設定を取得して確認
    console.log('\n📋 更新後の基本設定を取得します...');
    const afterUpdateResult = await getLatestBasicSetting(apiUrl, args.storyId!, `${args.backendDirect ? 'バックエンド' : 'フロントエンド'}`);
    
    if (beforeUpdateResult?.data && afterUpdateResult?.data) {
      console.log('\n📊 更新結果の確認:');
      console.log('------------------------------');
      
      const beforeData = beforeUpdateResult.data;
      const afterData = afterUpdateResult.data;
      
      // 幕番号に応じたフィールド名
      const actField = `act${args.actNumber}_overview`;
      
      if (beforeData && afterData) {
        console.log(`更新前の第${args.actNumber}幕あらすじ: ${beforeData[actField]?.substring(0, 50)}${beforeData[actField]?.length > 50 ? '...' : ''}`);
        console.log(`更新後の第${args.actNumber}幕あらすじ: ${afterData[actField]?.substring(0, 50)}${afterData[actField]?.length > 50 ? '...' : ''}`);

        const isUpdated = afterData[actField] === args.content;
        if (isUpdated) {
          console.log('✅ あらすじが正常に更新されました');
        } else {
          console.log('❌ あらすじが更新されていません');
        }
      }
    }
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    if (args.test) {
      process.exit(1);
    }
  }
}

// スクリプトの実行
main().catch(error => {
  console.error('❌ 予期しないエラーが発生しました:', error);
  process.exit(1);
});

// フロントエンドでの使用例コード
/*
// 基本設定の幕別あらすじ更新
const updateBasicSettingAct = async (storyId: string, actNumber: number, content: string) => {
  try {
    const response = await fetchApi(`/stories/${storyId}/basic-setting-act/${actNumber}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    console.log(`基本設定の第${actNumber}幕のあらすじを更新しました`);
    return response;
  } catch (error) {
    console.error('基本設定更新エラー:', error);
    throw error;
  }
};

// 使用例
updateBasicSettingAct('24', 1, '新しいあらすじ内容')
  .then(result => console.log('更新結果:', result))
  .catch(error => console.error('エラー:', error));
*/
