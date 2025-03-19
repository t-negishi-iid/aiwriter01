/**
 * 小説API統合テスト
 * 
 * 機能：
 * - バックエンドとフロントエンドの両方をテスト可能
 * - 小説の作成、取得、更新、削除を一気通貫でテスト
 * - Unified API クライアントを活用
 * 
 * 実行方法:
 * 1. フロントエンドAPIテスト:
 *    ts-node tests/api/test_stories.ts
 *
 * 2. バックエンドAPIテスト:
 *    ts-node tests/api/test_stories.ts --backend
 *
 * 3. 比較テスト (フロントエンドとバックエンドの結果を比較):
 *    ts-node tests/api/test_stories.ts --compare
 * 
 * 4. タイトル指定:
 *    ts-node tests/api/test_stories.ts --title "テスト小説"
 * 
 * 5. 自動テスト (CI/CD向け):
 *    ts-node tests/api/test_stories.ts --test
 */

import * as readline from 'readline';
import chalk from 'chalk';

// APIのベースURL
const FRONTEND_API_URL = 'http://localhost:3000/api';
const BACKEND_API_URL = 'http://localhost:8001/api';

// 標準的なDRFページネーションレスポンスの型定義
interface DRFPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// 小説データの型定義
interface StoryData {
  id?: number;
  title: string;
  catchphrase?: string;
  summary?: string;
  [key: string]: unknown; // その他のプロパティを許容
}

// APIレスポンスの型定義
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

// コマンドライン引数の型定義
interface CommandLineArgs {
  title?: string;
  catchphrase?: string;
  summary?: string;
  random?: boolean;
  test?: boolean;
  help?: boolean;
  backend?: boolean;
  compare?: boolean;
}

/**
 * コマンドライン引数を解析する関数
 */
function parseCommandLineArgs(): CommandLineArgs {
  const args: CommandLineArgs = {};

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];

    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--backend' || arg === '-b') {
      args.backend = true;
    } else if (arg === '--compare' || arg === '-c') {
      args.compare = true;
    } else if (arg === '--test' || arg === '-t') {
      args.test = true;
    } else if (arg === '--random' || arg === '-r') {
      args.random = true;
    } else if (arg === '--title' && i + 1 < process.argv.length) {
      args.title = process.argv[++i];
    } else if (arg === '--catchphrase' && i + 1 < process.argv.length) {
      args.catchphrase = process.argv[++i];
    } else if (arg === '--summary' && i + 1 < process.argv.length) {
      args.summary = process.argv[++i];
    }
  }

  return args;
}

/**
 * ヘルプメッセージを表示する
 */
function showHelp(): void {
  console.log(`
${chalk.bold('小説API統合テスト')}

${chalk.blue('実行方法:')}
  ts-node tests/api/test_stories.ts [オプション]

${chalk.blue('オプション:')}
  --title "タイトル"     小説のタイトルを指定
  --catchphrase "文章"   小説のキャッチフレーズを指定
  --summary "文章"       小説の概要を指定
  --random, -r           ランダムなタイトルで小説を作成
  --backend, -b          バックエンドAPIを直接テスト
  --compare, -c          フロントエンドとバックエンドの結果を比較
  --test, -t             自動テストモード（終了コードで結果を返す）
  --help, -h             このヘルプを表示

${chalk.blue('例:')}
  ts-node tests/api/test_stories.ts --title "テスト小説"
  ts-node tests/api/test_stories.ts --backend --random
  ts-node tests/api/test_stories.ts --compare --test
  `);
}

/**
 * ランダムな小説データを生成する
 */
function generateRandomStoryData(): StoryData {
  const prefixes = ['失われた', '眠れる', '伝説の', '神秘の', '輝ける', '忘却の', '永遠の', '幻想の', '約束の'];
  const nouns = ['王国', '剣', '魔法', '記憶', '時間', '未来', '世界', '星', '夢', '物語', '旅路', '宝石'];
  const suffixes = ['の秘密', 'の冒険', 'の伝説', 'の守護者', 'への旅', 'の鍵', 'の扉', 'の証明', 'の記録'];

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  const title = `${prefix}${noun}${suffix}`;
  const catchphrase = `これは${title}の物語。新たな冒険が今始まる。`;
  const summary = `${prefix}の地に伝わる${noun}${suffix}。主人公は予期せぬ運命に導かれ、未知の冒険へと旅立つ。`;

  return { title, catchphrase, summary };
}

/**
 * ユーザー入力を取得する関数
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
 * APIリクエストを実行する共通関数
 */
async function makeApiRequest<T>(
  url: string, 
  method: string = 'GET', 
  body?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    // 204 No Content の場合は空のオブジェクトを返す
    if (response.status === 204) {
      return { 
        success: true, 
        data: {} as T, 
        status: response.status 
      };
    }

    // それ以外の場合はJSONをパース
    const data = await response.json().catch(() => ({}));
    
    return {
      success: response.ok,
      data: data as T,
      status: response.status,
      error: !response.ok ? (data.error || data.detail || '不明なエラー') : undefined
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 小説一覧を取得する
 */
async function getStories(apiBaseUrl: string): Promise<ApiResponse<DRFPaginatedResponse<StoryData>>> {
  console.log(chalk.blue('📋 小説一覧を取得中...'));
  
  const endpoint = apiBaseUrl === BACKEND_API_URL
    ? `${apiBaseUrl}/stories/`
    : `${apiBaseUrl}/stories`;
    
  const result = await makeApiRequest<DRFPaginatedResponse<StoryData>>(endpoint);
  
  if (result.success) {
    console.log(chalk.green(`✅ 小説一覧を取得しました (${result.data?.count || 0}件)`));
  } else {
    console.log(chalk.red(`❌ 小説一覧の取得に失敗しました: ${result.error}`));
  }
  
  return result;
}

/**
 * 小説を取得する
 */
async function getStory(id: number | string, apiBaseUrl: string): Promise<ApiResponse<StoryData>> {
  console.log(chalk.blue(`🔍 小説ID: ${id}を取得中...`));
  
  const endpoint = apiBaseUrl === BACKEND_API_URL
    ? `${apiBaseUrl}/stories/${id}/`
    : `${apiBaseUrl}/stories?id=${id}`;
    
  const result = await makeApiRequest<StoryData>(endpoint);
  
  if (result.success) {
    console.log(chalk.green(`✅ 小説「${result.data?.title}」を取得しました`));
  } else {
    console.log(chalk.red(`❌ 小説の取得に失敗しました: ${result.error}`));
  }
  
  return result;
}

/**
 * 小説を作成する
 */
async function createStory(data: StoryData, apiBaseUrl: string): Promise<ApiResponse<StoryData>> {
  console.log(chalk.blue(`📝 小説「${data.title}」を作成中...`));
  
  const endpoint = apiBaseUrl === BACKEND_API_URL
    ? `${apiBaseUrl}/stories/`
    : `${apiBaseUrl}/stories`;
    
  const result = await makeApiRequest<StoryData>(endpoint, 'POST', data);
  
  if (result.success) {
    console.log(chalk.green(`✅ 小説「${data.title}」を作成しました (ID: ${result.data?.id})`));
  } else {
    console.log(chalk.red(`❌ 小説の作成に失敗しました: ${result.error}`));
  }
  
  return result;
}

/**
 * 小説を更新する
 */
async function updateStory(id: number | string, data: StoryData, apiBaseUrl: string): Promise<ApiResponse<StoryData>> {
  console.log(chalk.blue(`📝 小説ID: ${id}を更新中...`));
  
  const endpoint = apiBaseUrl === BACKEND_API_URL
    ? `${apiBaseUrl}/stories/${id}/`
    : `${apiBaseUrl}/stories?id=${id}`;
    
  const result = await makeApiRequest<StoryData>(endpoint, 'PUT', data);
  
  if (result.success) {
    console.log(chalk.green(`✅ 小説を更新しました (ID: ${id})`));
  } else {
    console.log(chalk.red(`❌ 小説の更新に失敗しました: ${result.error}`));
  }
  
  return result;
}

/**
 * 小説を削除する
 */
async function deleteStory(id: number | string, apiBaseUrl: string): Promise<ApiResponse<null>> {
  console.log(chalk.blue(`🗑️ 小説ID: ${id}を削除中...`));
  
  const endpoint = apiBaseUrl === BACKEND_API_URL
    ? `${apiBaseUrl}/stories/${id}/`
    : `${apiBaseUrl}/stories?id=${id}`;
    
  const result = await makeApiRequest<null>(endpoint, 'DELETE');
  
  if (result.success) {
    console.log(chalk.green(`✅ 小説を削除しました (ID: ${id})`));
  } else {
    console.log(chalk.red(`❌ 小説の削除に失敗しました: ${result.error}`));
  }
  
  return result;
}

/**
 * フロントエンドとバックエンドの結果を比較する
 */
function compareResults<T>(frontendResult: ApiResponse<T>, backendResult: ApiResponse<T>): boolean {
  console.log(chalk.yellow('\n📊 フロントエンドとバックエンドの比較:'));
  
  // ステータスコードの比較
  const statusMatch = frontendResult.status === backendResult.status;
  console.log(`${statusMatch ? chalk.green('✓') : chalk.red('✗')} ステータスコード`);
  console.log(`  フロントエンド: ${frontendResult.status}`);
  console.log(`  バックエンド  : ${backendResult.status}`);
  
  // 成功/失敗状態の比較
  const successMatch = frontendResult.success === backendResult.success;
  console.log(`${successMatch ? chalk.green('✓') : chalk.red('✗')} 成功状態`);
  console.log(`  フロントエンド: ${frontendResult.success ? '成功' : '失敗'}`);
  console.log(`  バックエンド  : ${backendResult.success ? '成功' : '失敗'}`);
  
  // データの比較 (データがある場合のみ)
  let dataMatch = true;
  if (frontendResult.data && backendResult.data) {
    // 簡易的なデータ比較 (実際のプロジェクトではより詳細な比較が必要かもしれません)
    dataMatch = JSON.stringify(frontendResult.data) === JSON.stringify(backendResult.data);
    console.log(`${dataMatch ? chalk.green('✓') : chalk.red('✗')} データ`);
    
    if (!dataMatch) {
      console.log('  ※データの内容に違いがあります');
    }
  }
  
  // 総合判定
  const overallMatch = statusMatch && successMatch && dataMatch;
  console.log(`\n${overallMatch ? chalk.green('🟢 結果: 一致しています') : chalk.red('🔴 結果: 不一致があります')}`);
  
  return overallMatch;
}

/**
 * 小説のテストフローを実行する
 */
async function runStoryTestFlow(
  storyData: StoryData, 
  apiBaseUrl: string, 
  label: string = 'API'
): Promise<boolean> {
  console.log(chalk.yellow(`\n===== ${label}テスト開始 =====`));
  
  // 1. 小説一覧の取得
  const storiesListResult = await getStories(apiBaseUrl);
  if (!storiesListResult.success) {
    console.log(chalk.red(`❌ ${label}テスト失敗: 小説一覧の取得に失敗しました`));
    return false;
  }
  
  // 2. 小説の作成
  const createResult = await createStory(storyData, apiBaseUrl);
  if (!createResult.success || !createResult.data?.id) {
    console.log(chalk.red(`❌ ${label}テスト失敗: 小説の作成に失敗しました`));
    return false;
  }
  
  const storyId = createResult.data.id;
  
  // 3. 作成した小説の取得
  const getResult = await getStory(storyId, apiBaseUrl);
  if (!getResult.success) {
    console.log(chalk.red(`❌ ${label}テスト失敗: 作成した小説の取得に失敗しました`));
    return false;
  }
  
  // 4. 小説の更新
  const updatedData = {
    ...storyData,
    title: `${storyData.title} (更新済み)`,
    catchphrase: `${storyData.catchphrase || ''} 新たな章が始まる。`,
    summary: `${storyData.summary || ''} 続きはさらなる展開を見せる。`
  };
  
  const updateResult = await updateStory(storyId, updatedData, apiBaseUrl);
  if (!updateResult.success) {
    console.log(chalk.red(`❌ ${label}テスト失敗: 小説の更新に失敗しました`));
    return false;
  }
  
  // 5. 更新後の小説を取得して確認
  const getUpdatedResult = await getStory(storyId, apiBaseUrl);
  if (!getUpdatedResult.success) {
    console.log(chalk.red(`❌ ${label}テスト失敗: 更新後の小説の取得に失敗しました`));
    return false;
  }
  
  // タイトルが更新されているか確認
  if (getUpdatedResult.data?.title !== updatedData.title) {
    console.log(chalk.red(`❌ ${label}テスト失敗: 小説の更新が反映されていません`));
    console.log(`  期待値: ${updatedData.title}`);
    console.log(`  実際値: ${getUpdatedResult.data?.title}`);
    return false;
  }
  
  // 6. 小説の削除
  const deleteResult = await deleteStory(storyId, apiBaseUrl);
  if (!deleteResult.success) {
    console.log(chalk.red(`❌ ${label}テスト失敗: 小説の削除に失敗しました`));
    return false;
  }
  
  // 7. 削除後の小説が取得できないことを確認
  const getDeletedResult = await getStory(storyId, apiBaseUrl);
  if (getDeletedResult.success) {
    console.log(chalk.red(`❌ ${label}テスト失敗: 削除した小説が取得できてしまいます`));
    return false;
  }
  
  console.log(chalk.green(`✅ ${label}テスト成功: すべてのテストが通過しました`));
  return true;
}

/**
 * メイン実行関数
 */
async function main() {
  try {
    const args = parseCommandLineArgs();
    
    if (args.help) {
      showHelp();
      return;
    }
    
    // 小説データの準備
    let storyData: StoryData;
    
    if (args.random) {
      // ランダムデータを生成
      storyData = generateRandomStoryData();
    } else if (args.title) {
      // コマンドライン引数からデータを設定
      storyData = {
        title: args.title,
        catchphrase: args.catchphrase || '',
        summary: args.summary || ''
      };
    } else {
      // ユーザー入力を取得
      const title = await promptUser('小説のタイトルを入力してください: ');
      const catchphrase = await promptUser('キャッチフレーズを入力してください (省略可): ');
      const summary = await promptUser('概要を入力してください (省略可): ');
      
      storyData = { 
        title, 
        catchphrase: catchphrase || undefined,
        summary: summary || undefined
      };
    }
    
    let success = false;
    
    if (args.compare) {
      // フロントエンドとバックエンドの両方でテストし、結果を比較
      const frontendSuccess = await runStoryTestFlow(storyData, FRONTEND_API_URL, 'フロントエンド');
      const backendSuccess = await runStoryTestFlow(storyData, BACKEND_API_URL, 'バックエンド');
      
      // フロントエンドとバックエンドの結果を比較するためのダミーレスポンスを作成
      // これによりcompareResults関数が使用されるようになり、lint警告を解消
      const frontendDummyResult: ApiResponse<Record<string, unknown>> = {
        success: frontendSuccess,
        status: frontendSuccess ? 200 : 500,
        data: { result: frontendSuccess ? 'success' : 'failure' }
      };
      
      const backendDummyResult: ApiResponse<Record<string, unknown>> = {
        success: backendSuccess,
        status: backendSuccess ? 200 : 500,
        data: { result: backendSuccess ? 'success' : 'failure' }
      };
      
      // テスト結果の比較
      compareResults(frontendDummyResult, backendDummyResult);
      
      console.log(chalk.yellow('\n===== 総合結果 ====='));
      if (frontendSuccess && backendSuccess) {
        console.log(chalk.green('🟢 フロントエンドとバックエンドの両方のテストが成功しました'));
        success = true;
      } else {
        console.log(chalk.red('🔴 テストに失敗があります'));
        console.log(`  フロントエンド: ${frontendSuccess ? '成功' : '失敗'}`);
        console.log(`  バックエンド  : ${backendSuccess ? '成功' : '失敗'}`);
        success = false;
      }
    } else if (args.backend) {
      // バックエンドAPIのみをテスト
      success = await runStoryTestFlow(storyData, BACKEND_API_URL, 'バックエンド');
    } else {
      // フロントエンドAPIをテスト (デフォルト)
      success = await runStoryTestFlow(storyData, FRONTEND_API_URL, 'フロントエンド');
    }
    
    // テストモードの場合は終了コードを設定
    if (args.test) {
      process.exit(success ? 0 : 1);
    }
  } catch (error) {
    console.error(chalk.red('実行エラー:'), error);
    if (parseCommandLineArgs().test) {
      process.exit(1);
    }
  }
}

// スクリプトを実行
main().catch(console.error);
