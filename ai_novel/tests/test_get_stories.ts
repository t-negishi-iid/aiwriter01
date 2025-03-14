/**
 * 小説一覧APIテストスクリプト
 *
 * 実行方法:
 * 1. インタラクティブモード:
 *    ts-node test_get_stories.ts
 *
 * 2. バックエンド直接アクセス:
 *    ts-node test_get_stories.ts --backend-direct
 *
 * 3. 比較テスト:
 *    ts-node test_get_stories.ts --compare
 *
 * 4. 自動テスト (エラー時に終了コード1を返す):
 *    ts-node test_get_stories.ts --test
 */

import * as readline from 'readline';
import fetch from 'node-fetch';

// APIのベースURL
const FRONTEND_API_URL = 'http://localhost:3000/api';
const BACKEND_API_URL = 'http://localhost:8001/api';

// コマンドライン引数の解析
interface CommandLineArgs {
  test?: boolean;
  help?: boolean;
  backendDirect?: boolean; // バックエンドに直接アクセスするかどうか
  compareMode?: boolean;   // フロントエンドとバックエンドの両方をテストして比較
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
  ts-node test_get_stories.ts [オプション]

オプション:
  --backend-direct, -b バックエンドに直接リクエストを送信
  --compare, -c        フロントエンドとバックエンドの両方をテストして結果を比較
  --test               テストモードで実行（エラー時に終了コード1で終了）
  --help, -h           このヘルプメッセージを表示

例:
  ts-node test_get_stories.ts
  ts-node test_get_stories.ts --backend-direct
  ts-node test_get_stories.ts --compare --test
  `);
}

/**
 * 小説一覧APIにリクエストを送信する関数
 * @param apiUrl 使用するAPIのベースURL
 * @param apiLabel APIの表示ラベル（ログ出力用）
 * @returns API応答
 */
async function getStories(apiUrl: string, apiLabel: string = 'API') {
  try {
    console.log(`🔍 ${apiLabel}: 小説一覧を取得中...`);

    // エンドポイント
    const endpoint = `${apiUrl}/stories/`;

    // APIリクエストを実行
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    // レスポンスをJSON形式で取得
    const data = await response.json();

    // APIの成功/失敗を確認
    if (response.ok) {
      console.log(`✅ ${apiLabel}: 小説一覧を正常に取得しました`);
      const count = Array.isArray(data) ? data.length : 'unknown';
      console.log(`📚 取得した小説数: ${count}`);
      return { success: true, data, status: response.status };
    } else {
      console.error(`❌ ${apiLabel}: 小説一覧の取得に失敗しました: ${data.error || data.detail || '不明なエラー'}`);
      return { success: false, error: data.error || data.detail, data, status: response.status };
    }
  } catch (error) {
    // ネットワークエラーなどの例外処理
    console.error(`❌ ${apiLabel}: 通信エラー: ${error instanceof Error ? error.message : String(error)}`);
    return { success: false, error: String(error) };
  }
}

/**
 * 2つのレスポンスを比較する関数
 * @param frontendResult フロントエンドのレスポンス
 * @param backendResult バックエンドのレスポンス
 */
function compareResults(frontendResult: any, backendResult: any) {
  console.log('\n📊 フロントエンドとバックエンドの比較:');

  // ステータスコードの比較
  const statusMatch = frontendResult.status === backendResult.status;
  console.log(`ステータスコード: ${statusMatch ? '一致 ✓' : '不一致 ✗'}`);
  console.log(`  フロントエンド: ${frontendResult.status}`);
  console.log(`  バックエンド: ${backendResult.status}`);

  // 成功/失敗ステータスの比較
  const successMatch = frontendResult.success === backendResult.success;
  console.log(`成功状態: ${successMatch ? '一致 ✓' : '不一致 ✗'}`);
  console.log(`  フロントエンド: ${frontendResult.success ? '成功' : '失敗'}`);
  console.log(`  バックエンド: ${backendResult.success ? '成功' : '失敗'}`);

  // データ構造の比較（単純な配列の長さのみ）
  let dataMatch = false;
  if (frontendResult.success && backendResult.success) {
    const frontendDataLength = Array.isArray(frontendResult.data) ? frontendResult.data.length : -1;
    const backendDataLength = Array.isArray(backendResult.data) ? backendResult.data.length : -1;
    dataMatch = frontendDataLength === backendDataLength;
    console.log(`データ構造: ${dataMatch ? '一致 ✓' : '不一致 ✗'}`);
    console.log(`  フロントエンド: ${frontendDataLength} 件`);
    console.log(`  バックエンド: ${backendDataLength} 件`);
  }

  // 最終判定
  const overallMatch = statusMatch && successMatch && (frontendResult.success ? dataMatch : true);
  if (overallMatch) {
    console.log('\n🟢 結果: 一致しています');
    return true;
  } else {
    console.log('\n🔴 結果: 不一致です');
    return false;
  }
}

/**
 * メイン実行関数
 */
async function main() {
  try {
    const args = parseCommandLineArgs();

    // ヘルプ表示
    if (args.help) {
      showHelp();
      return;
    }

    console.log('=== 小説一覧APIテスト ===');

    // モードに応じてAPIリクエストを送信
    if (args.compareMode) {
      // フロントエンドとバックエンドの両方にリクエストして比較
      console.log('\n🔍 フロントエンドとバックエンドの両方をテストします...');

      const frontendResult = await getStories(FRONTEND_API_URL, 'フロントエンド');
      const backendResult = await getStories(BACKEND_API_URL, 'バックエンド');

      const isMatch = compareResults(frontendResult, backendResult);

      if (args.test) {
        process.exit(isMatch ? 0 : 1);
      }
    } else {
      // 単一のAPIにリクエスト
      const apiUrl = args.backendDirect ? BACKEND_API_URL : FRONTEND_API_URL;
      const apiLabel = args.backendDirect ? 'バックエンド' : 'フロントエンド';

      console.log(`\n🔍 ${apiLabel}APIを使用します (${apiUrl})`);

      const result = await getStories(apiUrl, apiLabel);

      // 結果の詳細表示
      if (result.success) {
        console.log('\n✅ 小説一覧の取得に成功しました');
        console.log('\n📝 取得された小説の詳細:');
        console.log(JSON.stringify(result.data, null, 2));

        if (args.test) {
          process.exit(0);
        }
      } else {
        console.error('\n❌ 小説一覧の取得に失敗しました');
        if (result.data) {
          console.error('エラー詳細:');
          console.error(JSON.stringify(result.data, null, 2));
        }

        if (args.test) {
          process.exit(1);
        }
      }
    }
  } catch (error) {
    console.error(`予期せぬエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    if (parseCommandLineArgs().test) process.exit(1);
  }
}

// スクリプト実行
main().catch((error) => {
  console.error('実行エラー:', error);
  if (parseCommandLineArgs().test) process.exit(1);
});
