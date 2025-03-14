/**
 * 小説ごとの疎通確認APIテストスクリプト
 */
import * as readline from 'readline';
import fetch from 'node-fetch';

// APIのベースURL
const FRONTEND_API_URL = 'http://localhost:3000';
const BACKEND_API_URL = 'http://localhost:8001/api';

// コマンドライン引数の解析
interface CommandLineArgs {
  storyId?: string;
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
    } else if (arg === '--story-id' && i + 1 < process.argv.length) {
      args.storyId = process.argv[++i];
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
  ts-node test_story_is_live.ts [オプション]

オプション:
  --story-id <id>       小説IDを指定
  --test                テストモードで実行（エラー時に終了コード1で終了）
  --backend-direct, -b  バックエンドに直接リクエストを送信
  --compare, -c         フロントエンドとバックエンドの両方をテストして結果を比較
  --help, -h            このヘルプメッセージを表示

例:
  ts-node test_story_is_live.ts --story-id 1
  ts-node test_story_is_live.ts --story-id 1 --backend-direct
  ts-node test_story_is_live.ts --story-id 1 --compare
  `);
}

/**
 * ユーザー入力を取得する関数
 * @param question プロンプトに表示する質問
 * @returns ユーザーの入力
 */
async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise<string>((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * is_liveAPIにリクエストを送信する関数
 *
 * @param storyId 小説ID
 * @param apiUrl 使用するAPIのベースURL
 * @param apiLabel APIの表示ラベル（ログ出力用）
 * @returns API応答
 */
async function checkIsLive(storyId: string, apiUrl: string, apiLabel: string = 'API') {
  try {
    console.log(`🔄 ${apiLabel}: 小説ID「${storyId}」の生存確認中...`);

    // バックエンド/フロントエンドでエンドポイントを区別
    let endpoint;
    if (apiUrl === BACKEND_API_URL) {
      // バックエンドの場合はそのままのパスを使用
      endpoint = `${apiUrl}/stories/${storyId}/is_live/`;
    } else {
      // フロントエンドの場合はクエリパラメータを使用したエンドポイントを使用
      endpoint = `${apiUrl}/api/story-is-live?id=${storyId}`;
    }

    console.log(`📡 ${apiLabel}リクエスト: ${endpoint}`);

    // APIリクエストを実行
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // レスポンスをJSON形式で取得
    const data = await response.json();

    // APIの成功/失敗を確認
    if (response.ok) {
      console.log(`✅ ${apiLabel}: レスポンス成功 (${response.status})`);
      return { success: true, data, status: response.status };
    } else {
      console.error(`❌ ${apiLabel}: レスポンス失敗 (${response.status}): ${data.error || data.detail || '不明なエラー'}`);
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

  // レスポンスボディの比較
  let responseMatch = false;
  try {
    const frontendResults = frontendResult.data?.results;
    const backendResults = backendResult.data?.results;
    responseMatch = frontendResults === backendResults;
    console.log(`レスポンス内容: ${responseMatch ? '一致 ✓' : '不一致 ✗'}`);
    console.log(`  フロントエンド: ${frontendResults}`);
    console.log(`  バックエンド: ${backendResults}`);
  } catch (error) {
    console.log(`レスポンス内容: 比較失敗 ✗`);
    console.log(`  エラー: ${error instanceof Error ? error.message : String(error)}`);
  }

  // 最終判定
  if (statusMatch && successMatch && responseMatch) {
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

    console.log('=== 小説ごとの疎通確認APIテスト ===');

    // 小説IDの取得
    let storyId: string;

    if (args.storyId) {
      // コマンドライン引数から小説IDを取得
      storyId = args.storyId;
      console.log(`📚 指定された小説ID: "${storyId}"`);
    } else {
      // ユーザーからの入力を求める
      storyId = await promptUser('小説IDを入力してください: ');
    }

    if (!storyId.trim()) {
      console.error('❌ 小説IDが入力されていません。プログラムを終了します。');
      if (args.test) process.exit(1);
      return;
    }

    // モードに応じてAPIリクエストを送信
    if (args.compareMode) {
      // フロントエンドとバックエンドの両方にリクエストして比較
      console.log('\n🔍 フロントエンドとバックエンドの両方をテストします...');

      const frontendResult = await checkIsLive(storyId, FRONTEND_API_URL, 'フロントエンド');
      const backendResult = await checkIsLive(storyId, BACKEND_API_URL, 'バックエンド');

      const isMatch = compareResults(frontendResult, backendResult);

      if (args.test) {
        process.exit(isMatch ? 0 : 1);
      }
    } else {
      // 単一のAPIにリクエスト
      const apiUrl = args.backendDirect ? BACKEND_API_URL : FRONTEND_API_URL;
      const apiLabel = args.backendDirect ? 'バックエンド' : 'フロントエンド';

      console.log(`\n🔍 ${apiLabel}APIを使用します (${apiUrl})`);

      const result = await checkIsLive(storyId, apiUrl, apiLabel);

      // 結果の詳細表示
      if (result.success) {
        console.log('\n✅ 疎通確認に成功しました');
        console.log('\n📝 レスポンスの詳細:');
        console.log(JSON.stringify(result.data, null, 2));

        if (args.test) {
          process.exit(0);
        }
      } else {
        console.error('\n❌ 疎通確認に失敗しました');
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
