/**
 * 小説作成APIテストスクリプト
 * コマンドラインから小説名を入力または引数で指定し、フロントエンドAPIを通じて小説を作成します
 *
 * 実行方法:
 * 1. インタラクティブモード:
 *    ts-node test_stories_new.ts
 *
 * 2. 小説名を指定:
 *    ts-node test_stories_new.ts --title "小説のタイトル"
 *
 * 3. ランダムタイトル生成:
 *    ts-node test_stories_new.ts --random
 *
 * 4. 自動テスト (エラー時に終了コード1を返す):
 *    ts-node test_stories_new.ts --title "テスト小説" --test
 *
 * 5. バックエンドに直接アクセス:
 *    ts-node test_stories_new.ts --backend-direct
 *
 * 6. フロントエンドとバックエンドの結果を比較:
 *    ts-node test_stories_new.ts --compare
 */

import * as readline from 'readline';
import fetch from 'node-fetch';

// APIのベースURL
const FRONTEND_API_URL = 'http://localhost:3000/api';
const BACKEND_API_URL = 'http://localhost:8001/api';

// コマンドライン引数の解析
interface CommandLineArgs {
  title?: string;
  random?: boolean;
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

    if (arg === '--random') {
      args.random = true;
    } else if (arg === '--test') {
      args.test = true;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--backend-direct' || arg === '-b') {
      args.backendDirect = true;
    } else if (arg === '--compare' || arg === '-c') {
      args.compareMode = true;
    } else if (arg === '--title' && i + 1 < process.argv.length) {
      args.title = process.argv[++i];
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
  ts-node test_stories_new.ts [オプション]

オプション:
  --title "タイトル"    小説のタイトルを指定して作成
  --random             ランダムなタイトルで小説を作成
  --test               テストモードで実行（エラー時に終了コード1で終了）
  --backend-direct, -b バックエンドに直接リクエストを送信
  --compare, -c        フロントエンドとバックエンドの両方をテストして結果を比較
  --help, -h           このヘルプメッセージを表示

例:
  ts-node test_stories_new.ts --title "冒険の書"
  ts-node test_stories_new.ts --random --test
  ts-node test_stories_new.ts --backend-direct
  ts-node test_stories_new.ts --compare --title "テスト小説"
  `);
}

/**
 * ランダムな小説タイトルを生成する関数
 * @returns ランダムに生成された小説タイトル
 */
function generateRandomTitle(): string {
  const prefixes = ['失われた', '眠れる', '伝説の', '神秘の', '輝ける', '忘却の', '永遠の', '幻想の', '約束の'];
  const nouns = ['王国', '剣', '魔法', '記憶', '時間', '未来', '世界', '星', '夢', '物語', '旅路', '宝石'];
  const suffixes = ['の秘密', 'の冒険', 'の伝説', 'の守護者', 'への旅', 'の鍵', 'の扉', 'の証明', 'の記録'];

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  return `${prefix}${noun}${suffix}`;
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
 * 小説作成APIにリクエストを送信する関数
 * このロジックは、後にReactフックとして再利用可能
 *
 * @param title 小説のタイトル
 * @param apiUrl 使用するAPIのベースURL
 * @param apiLabel APIの表示ラベル（ログ出力用）
 * @returns API応答
 */
async function createStory(title: string, apiUrl: string, apiLabel: string = 'API') {
  try {
    console.log(`🔄 ${apiLabel}: 小説「${title}」を作成中...`);

    // 適切なエンドポイントを決定
    // バックエンドは/api/stories/、フロントエンドは/api/stories?action=create
    const endpoint = apiUrl === BACKEND_API_URL
      ? `${apiUrl}/stories/`  // バックエンドAPIの場合
      : `${apiUrl}/stories?action=create`;  // フロントエンドAPIの場合（クエリパラメータ形式）

    // APIリクエストを実行
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    // レスポンスをJSON形式で取得
    const data = await response.json();

    // APIの成功/失敗を確認
    if (response.ok) {
      console.log(`✅ ${apiLabel}: 小説「${title}」が正常に作成されました`);
      return { success: true, data, status: response.status };
    } else {
      console.error(`❌ ${apiLabel}: 小説作成に失敗しました: ${data.error || data.detail || '不明なエラー'}`);
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

  // 最終判定
  if (statusMatch && successMatch) {
    console.log('\n🟢 結果: 一致しています');
    return true;
  } else {
    console.log('\n🔴 結果: 不一致です');
    return false;
  }
}

/**
 * メイン実行関数
 * このパターンはReactのカスタムフックと似た構造で、
 * 後でフロントエンドに移植しやすくなっています
 */
async function main() {
  try {
    const args = parseCommandLineArgs();

    // ヘルプ表示
    if (args.help) {
      showHelp();
      return;
    }

    console.log('=== 小説作成APIテスト ===');

    // タイトルの取得
    let title: string;

    if (args.title) {
      // コマンドライン引数からタイトルを取得
      title = args.title;
      console.log(`📚 指定されたタイトル: "${title}"`);
    } else if (args.random) {
      // ランダムタイトル生成
      title = generateRandomTitle();
      console.log(`🎲 ランダム生成されたタイトル: "${title}"`);
    } else {
      // ユーザーからの入力を求める
      title = await promptUser('作成する小説のタイトルを入力してください: ');
    }

    if (!title.trim()) {
      console.error('❌ タイトルが入力されていません。プログラムを終了します。');
      if (args.test) process.exit(1);
      return;
    }

    // モードに応じてAPIリクエストを送信
    if (args.compareMode) {
      // フロントエンドとバックエンドの両方にリクエストして比較
      console.log('\n🔍 フロントエンドとバックエンドの両方をテストします...');

      const frontendResult = await createStory(title, FRONTEND_API_URL, 'フロントエンド');
      const backendResult = await createStory(title, BACKEND_API_URL, 'バックエンド');

      const isMatch = compareResults(frontendResult, backendResult);

      if (args.test) {
        process.exit(isMatch ? 0 : 1);
      }
    } else {
      // 単一のAPIにリクエスト
      const apiUrl = args.backendDirect ? BACKEND_API_URL : FRONTEND_API_URL;
      const apiLabel = args.backendDirect ? 'バックエンド' : 'フロントエンド';

      console.log(`\n🔍 ${apiLabel}APIを使用します (${apiUrl})`);

      const result = await createStory(title, apiUrl, apiLabel);

      // 結果の詳細表示
      if (result.success) {
        console.log('\n✅ 小説の作成に成功しました');
        console.log('\n📝 作成された小説の詳細:');
        console.log(JSON.stringify(result.data, null, 2));

        if (args.test) {
          process.exit(0);
        }
      } else {
        console.error('\n❌ 小説の作成に失敗しました');
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
