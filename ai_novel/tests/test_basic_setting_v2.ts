/**
 * 基本設定APIテストスクリプト
 * 指定した小説IDの基本設定を取得または作成します
 *
 * 実行方法:
 * 1. インタラクティブモード:
 *    ts-node test_basic_setting_v2.ts
 *
 * 2. 小説IDを指定して基本設定を取得:
 *    ts-node test_basic_setting_v2.ts --id 1
 *
 * 3. 小説IDと基本設定作成用データIDを指定して基本設定を作成:
 *    ts-node test_basic_setting_v2.ts --id 1 --action create --data-id 1
 *
 * 4. 自動テスト (エラー時に終了コード1を返す):
 *    ts-node test_basic_setting_v2.ts --id 1 --test
 *
 * 5. バックエンドに直接アクセス:
 *    ts-node test_basic_setting_v2.ts --id 1 --backend-direct
 *
 * 6. フロントエンドとバックエンドの結果を比較:
 *    ts-node test_basic_setting_v2.ts --id 1 --compare
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
  id?: string;          // 小説ID
  action?: string;      // アクション (create)
  dataId?: string;      // 基本設定作成用データID
  test?: boolean;       // テストモード
  help?: boolean;       // ヘルプ表示
  backendDirect?: boolean; // バックエンド直接アクセス
  compareMode?: boolean;   // フロントとバックの比較
  random?: boolean;        // ランダムデータ使用
}

/**
 * コマンドライン引数を解析する関数
 * @returns パース済みの引数オブジェクト
 */
function parseCommandLineArgs(): CommandLineArgs {
  const args: CommandLineArgs = {};

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];

    if (arg === '--id' && i + 1 < process.argv.length) {
      args.id = process.argv[++i];
    } else if (arg === '--action' && i + 1 < process.argv.length) {
      args.action = process.argv[++i];
    } else if (arg === '--data-id' && i + 1 < process.argv.length) {
      args.dataId = process.argv[++i];
    } else if (arg === '--random') {
      args.random = true;
    } else if (arg === '--test') {
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
  ts-node test_basic_setting_v2.ts [オプション]

オプション:
  --id <id>              小説IDを指定
  --action <action>      アクションを指定 (create)
  --data-id <id>         基本設定作成用データIDを指定 (createアクション時に必要)
  --random               ランダムなデータでテスト
  --test                 テストモードで実行（エラー時に終了コード1で終了）
  --backend-direct, -b   バックエンドに直接リクエストを送信
  --compare, -c          フロントエンドとバックエンドの両方をテストして結果を比較
  --help, -h             このヘルプメッセージを表示

例:
  ts-node test_basic_setting_v2.ts --id 1
  ts-node test_basic_setting_v2.ts --id 1 --action create --data-id 1
  ts-node test_basic_setting_v2.ts --id 1 --test
  ts-node test_basic_setting_v2.ts --id 1 --backend-direct
  ts-node test_basic_setting_v2.ts --id 1 --compare
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
 * テスト結果をファイルに保存する関数
 * @param data 保存するデータ
 * @param storyId 小説ID
 * @param dataType データの種類 ('BasicSetting', 'BasicSettingData', etc.)
 * @param id データID (オプション)
 */
function saveTestData(data: any, storyId: string, dataType: string, id?: string): void {
  try {
    // 保存先ディレクトリを決定
    const dataDir = path.join(__dirname, 'data', dataType);

    // ディレクトリが存在することを確認
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // ファイル名を決定（ID付きまたはなし）
    const fileName = id
      ? `story_${storyId}_${dataType.toLowerCase()}_${id}.json`
      : `story_${storyId}_${dataType.toLowerCase()}.json`;

    const filePath = path.join(dataDir, fileName);

    // データをJSON形式で保存
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`✅ テストデータを保存しました: ${filePath}`);
  } catch (error) {
    console.error(`❌ データ保存エラー: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 保存されたテストデータを読み込む関数
 * @param storyId 小説ID
 * @param dataType データの種類 ('BasicSetting', 'BasicSettingData', etc.)
 * @param id データID (オプション)
 * @returns 読み込んだデータ、またはエラー時にnull
 */
function loadTestData(storyId: string, dataType: string, id?: string): any | null {
  try {
    // ファイル名を決定
    const fileName = id
      ? `story_${storyId}_${dataType.toLowerCase()}_${id}.json`
      : `story_${storyId}_${dataType.toLowerCase()}.json`;

    const filePath = path.join(__dirname, 'data', dataType, fileName);

    // ファイルが存在するか確認
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ テストデータが見つかりません: ${filePath}`);
      return null;
    }

    // ファイルからデータを読み込む
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`✅ テストデータを読み込みました: ${filePath}`);
    return data;
  } catch (error) {
    console.error(`❌ データ読み込みエラー: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * 基本設定を取得する関数
 * @param storyId 小説ID
 * @param apiUrl APIのベースURL
 * @param apiLabel APIの表示ラベル
 * @returns API応答
 */
async function getBasicSetting(storyId: string, apiUrl: string, apiLabel: string = 'API') {
  try {
    console.log(`🔄 ${apiLabel}: 小説ID「${storyId}」の基本設定を取得中...`);

    // エンドポイントを決定
    // フロントエンドとバックエンドで同じURLパターンを使用
    const endpoint = `${apiUrl}/stories/${storyId}/basic-setting/`;

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
      console.log(`✅ ${apiLabel}: 基本設定の取得に成功しました`);
      return { success: true, data, status: response.status };
    } else {
      console.error(`❌ ${apiLabel}: 基本設定の取得に失敗しました: ${data.error || data.detail || '不明なエラー'}`);
      return { success: false, error: data.error || data.detail, data, status: response.status };
    }
  } catch (error) {
    // ネットワークエラーなどの例外処理
    console.error(`❌ ${apiLabel}: 通信エラー: ${error instanceof Error ? error.message : String(error)}`);
    return { success: false, error: String(error) };
  }
}

/**
 * 基本設定を作成する関数
 * @param storyId 小説ID
 * @param dataId 基本設定作成用データID
 * @param apiUrl APIのベースURL
 * @param apiLabel APIの表示ラベル
 * @returns API応答
 */
async function createBasicSetting(storyId: string, dataId: string, apiUrl: string, apiLabel: string = 'API') {
  try {
    console.log(`🔄 ${apiLabel}: 小説ID「${storyId}」の基本設定を作成中...`);

    // エンドポイントの決定
    // フロントエンドとバックエンドで同じURLパターンを使用
    const endpoint = `${apiUrl}/stories/${storyId}/basic-setting/`;

    // APIリクエストを実行
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        basic_setting_data_id: parseInt(dataId)
      }),
    });

    // レスポンスをJSON形式で取得
    const data = await response.json();

    // APIの成功/失敗を確認
    if (response.ok) {
      console.log(`✅ ${apiLabel}: 基本設定の作成に成功しました`);
      return { success: true, data, status: response.status };
    } else {
      console.error(`❌ ${apiLabel}: 基本設定の作成に失敗しました: ${data.error || data.detail || '不明なエラー'}`);
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

  // レスポンスの構造比較
  let structureMatch = false;
  if (frontendResult.success && backendResult.success) {
    // 基本的な構造とフィールドの存在確認
    const frontendHasFields = frontendResult.data &&
      typeof frontendResult.data === 'object' &&
      'id' in frontendResult.data &&
      'story_setting' in frontendResult.data &&
      'characters' in frontendResult.data &&
      'plot_overview' in frontendResult.data;

    const backendHasFields = backendResult.data &&
      typeof backendResult.data === 'object' &&
      'id' in backendResult.data &&
      'story_setting' in backendResult.data &&
      'characters' in backendResult.data &&
      'plot_overview' in backendResult.data;

    structureMatch = frontendHasFields && backendHasFields;
    console.log(`データ構造: ${structureMatch ? '一致 ✓' : '不一致 ✗'}`);
  }

  // 最終判定
  const finalMatch = statusMatch && successMatch && (frontendResult.success ? structureMatch : true);
  if (finalMatch) {
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

    console.log('=== 基本設定APIテスト ===');

    // 小説IDの取得
    let storyId: string;
    if (args.id) {
      storyId = args.id;
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

    // アクションの決定
    let action = args.action || 'get';
    let dataId: string | undefined = args.dataId;

    // アクションがcreateで、データIDが指定されていない場合
    if (action === 'create' && !dataId) {
      // 保存されたBasicSettingDataがあるか確認
      const savedBasicSettingData = loadTestData(storyId, 'BasicSettingData');
      if (savedBasicSettingData && savedBasicSettingData.id) {
        dataId = String(savedBasicSettingData.id);
        console.log(`📝 保存されたBasicSettingDataを使用します: ID ${dataId}`);
      } else {
        // ユーザー入力を求める
        dataId = await promptUser('基本設定作成用データIDを入力してください: ');
        if (!dataId.trim()) {
          console.error('❌ 基本設定作成用データIDが入力されていません。プログラムを終了します。');
          if (args.test) process.exit(1);
          return;
        }
      }
    }

    // 比較モードの場合
    if (args.compareMode) {
      console.log('\n🔍 フロントエンドとバックエンドの両方をテストします...');

      let frontendResult, backendResult;

      // アクションに応じて適切なAPI呼び出し
      if (action === 'create' && dataId) {
        frontendResult = await createBasicSetting(storyId, dataId, FRONTEND_API_URL, 'フロントエンド');
        backendResult = await createBasicSetting(storyId, dataId, BACKEND_API_URL, 'バックエンド');

        // 成功した場合はデータを保存
        if (frontendResult.success) {
          saveTestData(frontendResult.data, storyId, 'BasicSetting');
        }
        if (backendResult.success) {
          saveTestData(backendResult.data, storyId, 'BasicSetting');
        }
      } else {
        frontendResult = await getBasicSetting(storyId, FRONTEND_API_URL, 'フロントエンド');
        backendResult = await getBasicSetting(storyId, BACKEND_API_URL, 'バックエンド');

        // 成功した場合はデータを保存
        if (frontendResult.success) {
          saveTestData(frontendResult.data, storyId, 'BasicSetting');
        }
        if (backendResult.success) {
          saveTestData(backendResult.data, storyId, 'BasicSetting');
        }
      }

      const isMatch = compareResults(frontendResult, backendResult);

      if (args.test) {
        process.exit(isMatch ? 0 : 1);
      }
    } else {
      // 単一のAPIにリクエスト
      const apiUrl = args.backendDirect ? BACKEND_API_URL : FRONTEND_API_URL;
      const apiLabel = args.backendDirect ? 'バックエンド' : 'フロントエンド';

      console.log(`\n🔍 ${apiLabel}APIを使用します (${apiUrl})`);

      let result;
      // アクションに応じて適切なAPI呼び出し
      if (action === 'create' && dataId) {
        result = await createBasicSetting(storyId, dataId, apiUrl, apiLabel);
      } else {
        result = await getBasicSetting(storyId, apiUrl, apiLabel);
      }

      // 結果の詳細表示
      if (result.success) {
        console.log('\n✅ 操作に成功しました');
        console.log('\n📝 基本設定の詳細:');
        console.log(JSON.stringify(result.data, null, 2));

        // 成功した結果をファイルに保存
        saveTestData(result.data, storyId, 'BasicSetting');

        if (args.test) {
          process.exit(0);
        }
      } else {
        console.error('\n❌ 操作に失敗しました');
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
