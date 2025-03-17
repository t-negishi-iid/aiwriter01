/**
 * プロット一覧APIテストスクリプト
 *
 * 実行方法:
 * 1. インタラクティブモード:
 *    ts-node test_get_plots.ts --story-id=1
 *
 * 2. バックエンド直接アクセス:
 *    ts-node test_get_plots.ts --story-id=1 --backend-direct
 *
 * 3. 比較テスト:
 *    ts-node test_get_plots.ts --story-id=1 --compare
 *
 * 4. 自動テスト (エラー時に終了コード1を返す):
 *    ts-node test_get_plots.ts --story-id=1 --test
 */

import * as readline from 'readline';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

// APIのベースURL
const FRONTEND_API_URL = 'http://localhost:3000/api';
const BACKEND_API_URL = 'http://localhost:8001/api';

// コマンドライン引数の解析
interface CommandLineArgs {
  test?: boolean;
  help?: boolean;
  backendDirect?: boolean; // バックエンドに直接アクセスするかどうか
  compareMode?: boolean;   // フロントエンドとバックエンドの両方をテストして比較
  storyId?: string;        // 小説ID
  saveOutput?: boolean;    // 出力を保存するかどうか
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
    }
  }

  return args;
}

/**
 * ヘルプメッセージを表示する関数
 */
function showHelp() {
  console.log(`
使用方法:
  ts-node test_get_plots.ts --story-id=<ID> [オプション]

必須オプション:
  --story-id=<ID>       テスト対象の小説ID

オプション:
  --backend-direct, -b  バックエンドに直接リクエストを送信
  --compare, -c         フロントエンドとバックエンドの両方をテストして結果を比較
  --test                テストモードで実行（エラー時に終了コード1で終了）
  --save-output, -s     テスト結果をJSONファイルに保存
  --help, -h            このヘルプメッセージを表示

例:
  ts-node test_get_plots.ts --story-id=1
  ts-node test_get_plots.ts --story-id=1 --backend-direct
  ts-node test_get_plots.ts --story-id=1 --compare --test
  ts-node test_get_plots.ts --story-id=1 --save-output
  `);
}

/**
 * プロット一覧APIにリクエストを送信する関数
 * @param apiUrl 使用するAPIのベースURL
 * @param storyId 小説ID
 * @param apiLabel APIの表示ラベル（ログ出力用）
 * @returns API応答
 */
async function getPlots(apiUrl: string, storyId: string, apiLabel: string = 'API') {
  try {
    console.log(`🔍 ${apiLabel}: 小説ID ${storyId} のプロット一覧を取得中...`);

    // エンドポイント
    const endpoint = `${apiUrl}/stories/${storyId}/acts/`;
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
    const data = await response.json();

    // 結果を表示
    console.log(`✅ ${apiLabel}: プロット一覧取得成功`);
    console.log('📋 取得結果:');
    console.log(JSON.stringify(data, null, 2));

    return {
      success: true,
      status: response.status,
      data
    };
  } catch (error) {
    console.error(`❌ ${apiLabel}: プロット一覧取得エラー:`, error);
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
 */
function compareResults(frontendResult: any, backendResult: any) {
  console.log('\n🔍 フロントエンドとバックエンドの応答を比較します...');

  // 両方成功した場合のみ比較
  if (frontendResult.success && backendResult.success) {
    // データ構造の比較
    const frontendData = frontendResult.data;
    const backendData = backendResult.data;

    console.log('📊 データ構造の比較:');

    // フロントエンドとバックエンドのデータ構造を比較
    const frontendKeys = Object.keys(frontendData).sort();
    const backendKeys = Object.keys(backendData).sort();

    console.log('🔑 フロントエンドのトップレベルキー:', frontendKeys.join(', '));
    console.log('🔑 バックエンドのトップレベルキー:', backendKeys.join(', '));

    // キーの一致を確認
    const missingInFrontend = backendKeys.filter(key => !frontendKeys.includes(key));
    const missingInBackend = frontendKeys.filter(key => !backendKeys.includes(key));

    if (missingInFrontend.length > 0) {
      console.log('⚠️ フロントエンドに存在しないキー:', missingInFrontend.join(', '));
    }

    if (missingInBackend.length > 0) {
      console.log('⚠️ バックエンドに存在しないキー:', missingInBackend.join(', '));
    }

    // データ数の比較（配列の場合）
    if (Array.isArray(frontendData) && Array.isArray(backendData)) {
      console.log(`📈 フロントエンド: ${frontendData.length}件のプロット`);
      console.log(`📈 バックエンド: ${backendData.length}件のプロット`);

      if (frontendData.length !== backendData.length) {
        console.log('⚠️ プロット数が一致しません');
      } else {
        console.log('✅ プロット数が一致しています');
      }
    }

    console.log('✅ 比較完了');
    return frontendData.length === backendData.length;
  } else {
    console.log('❌ 両方のAPIが成功しなかったため、比較できません');
    return false;
  }
}

/**
 * 結果をファイルに保存する関数
 * @param result 保存するデータ
 * @param storyId 小説ID
 * @param source データソース（frontend または backend）
 */
function saveResultToFile(result: any, storyId: string, source: 'frontend' | 'backend') {
  try {
    // 保存先ディレクトリを作成
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // ファイル名を生成
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(outputDir, `plots_story_${storyId}_${source}_${timestamp}.json`);

    // データを保存
    fs.writeFileSync(filename, JSON.stringify(result, null, 2), 'utf8');
    console.log(`✅ 結果を保存しました: ${filename}`);
  } catch (error) {
    console.error('❌ 結果の保存に失敗しました:', error);
  }
}

/**
 * メイン実行関数
 */
async function main() {
  // コマンドライン引数を解析
  const args = parseCommandLineArgs();

  // ヘルプを表示して終了
  if (args.help) {
    showHelp();
    return;
  }

  // 小説IDが指定されていない場合はエラー
  if (!args.storyId) {
    console.error('❌ エラー: 小説IDが指定されていません。--story-id=<ID> オプションを使用してください。');
    showHelp();
    if (args.test) process.exit(1);
    return;
  }

  let frontendResult: any = null;
  let backendResult: any = null;

  // バックエンド直接アクセスモード
  if (args.backendDirect) {
    backendResult = await getPlots(BACKEND_API_URL, args.storyId, 'バックエンド');
    
    if (args.saveOutput && backendResult.success) {
      saveResultToFile(backendResult.data, args.storyId, 'backend');
    }
    
    if (args.test && !backendResult.success) {
      process.exit(1);
    }
    return;
  }

  // 比較モード
  if (args.compareMode) {
    frontendResult = await getPlots(FRONTEND_API_URL, args.storyId, 'フロントエンド');
    backendResult = await getPlots(BACKEND_API_URL, args.storyId, 'バックエンド');
    
    if (args.saveOutput) {
      if (frontendResult.success) {
        saveResultToFile(frontendResult.data, args.storyId, 'frontend');
      }
      if (backendResult.success) {
        saveResultToFile(backendResult.data, args.storyId, 'backend');
      }
    }
    
    const comparisonSuccess = compareResults(frontendResult, backendResult);
    
    if (args.test && (!frontendResult.success || !backendResult.success || !comparisonSuccess)) {
      process.exit(1);
    }
    return;
  }

  // デフォルトモード（フロントエンドにアクセス）
  frontendResult = await getPlots(FRONTEND_API_URL, args.storyId, 'フロントエンド');
  
  if (args.saveOutput && frontendResult.success) {
    saveResultToFile(frontendResult.data, args.storyId, 'frontend');
  }
  
  if (args.test && !frontendResult.success) {
    process.exit(1);
  }
}

// スクリプト実行
main().catch((error) => {
  console.error('実行エラー:', error);
  if (parseCommandLineArgs().test) process.exit(1);
});
