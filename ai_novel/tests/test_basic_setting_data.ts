/**
 * 基本設定作成用データAPIテストスクリプト
 * コマンドラインからパラメータを入力または引数で指定し、APIをテストします
 *
 * 実行方法:
 * 1. インタラクティブモード:
 *    npx ts-node test_basic_setting_data.ts --story-id 1
 *
 * 2. パラメータを指定:
 *    npx ts-node test_basic_setting_data.ts --story-id 1 --theme "冒険" --time-and-place "現代 都市"
 *
 * 3. ランダムデータ生成:
 *    npx ts-node test_basic_setting_data.ts --story-id 1 --random
 *
 * 4. 自動テスト (エラー時に終了コード1を返す):
 *    npx ts-node test_basic_setting_data.ts --story-id 1 --test
 *
 * 5. バックエンドに直接アクセス:
 *    npx ts-node test_basic_setting_data.ts --story-id 1 --backend-direct
 *
 * 6. フロントエンドとバックエンドの結果を比較:
 *    npx ts-node test_basic_setting_data.ts --story-id 1 --compare
 */

import * as readline from 'readline';
import fetch from 'node-fetch';

// APIのベースURL
const FRONTEND_API_URL = 'http://localhost:3000'; // /apiを取り除く
const BACKEND_API_URL = 'http://localhost:8001/api';

// コマンドライン引数の解析
interface CommandLineArgs {
  storyId?: string;
  theme?: string;
  timeAndPlace?: string;
  worldSetting?: string;
  plotPattern?: string;
  emotionalExpressions?: string[];
  random?: boolean;
  test?: boolean;
  help?: boolean;
  backendDirect?: boolean;
  compareMode?: boolean;
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
    } else if (arg === '--story-id' && i + 1 < process.argv.length) {
      args.storyId = process.argv[++i];
    } else if (arg === '--theme' && i + 1 < process.argv.length) {
      args.theme = process.argv[++i];
    } else if (arg === '--time-and-place' && i + 1 < process.argv.length) {
      args.timeAndPlace = process.argv[++i];
    } else if (arg === '--world-setting' && i + 1 < process.argv.length) {
      args.worldSetting = process.argv[++i];
    } else if (arg === '--plot-pattern' && i + 1 < process.argv.length) {
      args.plotPattern = process.argv[++i];
    } else if (arg === '--emotional-expressions' && i + 1 < process.argv.length) {
      args.emotionalExpressions = process.argv[++i].split(',');
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
  npx ts-node test_basic_setting_data.ts [オプション]

オプション:
  --story-id <id>               小説IDを指定（必須）
  --theme <テーマ>              テーマを指定
  --time-and-place <時代と場所>  時代と場所を指定
  --world-setting <世界設定>     世界設定を指定
  --plot-pattern <プロット>      プロットパターンを指定
  --emotional-expressions <感情表現> カンマ区切りで感情表現を指定
  --random                      ランダムなデータで基本設定データを作成
  --test                        テストモードで実行（エラー時に終了コード1で終了）
  --backend-direct, -b          バックエンドに直接リクエストを送信
  --compare, -c                 フロントエンドとバックエンドの両方をテストして結果を比較
  --help, -h                    このヘルプメッセージを表示

例:
  npx ts-node test_basic_setting_data.ts --story-id 1 --theme "冒険" --time-and-place "現代 都市"
  npx ts-node test_basic_setting_data.ts --story-id 1 --random --test
  npx ts-node test_basic_setting_data.ts --story-id 1 --backend-direct
  npx ts-node test_basic_setting_data.ts --story-id 1 --compare
  `);
}

/**
 * ランダムな基本設定用データを生成する関数
 * @returns ランダムに生成されたデータオブジェクト
 */
function generateRandomData(): any {
  const themes = ['冒険', '友情', '成長', '愛', '復讐', '信頼', '裏切り', '希望', '絶望', '正義'];
  const times = ['古代', '中世', '近代', '現代', '未来', '架空時代'];
  const places = ['都市', '村落', '荒野', '異世界', '宇宙', '海中', '山岳', '島', '学校', '会社'];
  const worldSettings = ['魔法世界', '科学技術社会', 'ポストアポカリプス', 'ファンタジー', 'SF', '歴史', '現実'];
  const plotPatterns = ['英雄の旅', '成長物語', '恋愛成就', '復讐譚', '謎解き', '救済物語', '自己発見'];
  const emotions = ['喜び', '悲しみ', '怒り', '恐怖', '驚き', '嫌悪', '期待', '信頼', '興味', '不安'];
  const loveExpressions = ['純愛', '初恋', '片思い', '再会', '別れ', '結ばれる', '家族愛', '友情から愛へ'];
  const atmospheres = ['明るい', '暗い', '神秘的', '緊張感', '幻想的', '現実的', '郷愁', '未来的'];
  const sensualExpressions = ['視覚的', '聴覚的', '触覚的', '味覚的', '嗅覚的'];
  const mentalElements = ['記憶', '夢', '幻覚', '妄想', '洞察', '直感', '第六感'];
  const socialElements = ['階級', '差別', '対立', '協力', '共存', '革命', '保守'];
  const pastMysteries = ['隠された真実', '封印された過去', '忘れられた記憶', '古い予言', '失われた遺産'];

  // ランダムな感情表現を2〜4個選択
  const randomEmotions: string[] = [];
  const emotionCount = Math.floor(Math.random() * 3) + 2; // 2〜4個
  for (let i = 0; i < emotionCount; i++) {
    const emotion = emotions[Math.floor(Math.random() * emotions.length)];
    if (!randomEmotions.includes(emotion)) {
      randomEmotions.push(emotion);
    }
  }

  // 他の要素も1〜3個ランダムに選択する関数
  const getRandomElements = (array: string[], count: number = 2): string[] => {
    const result: string[] = [];
    const max = Math.min(Math.floor(Math.random() * count) + 1, array.length);
    for (let i = 0; i < max; i++) {
      const element = array[Math.floor(Math.random() * array.length)];
      if (!result.includes(element)) {
        result.push(element);
      }
    }
    return result;
  };

  return {
    theme: themes[Math.floor(Math.random() * themes.length)],
    timeAndPlace: `${times[Math.floor(Math.random() * times.length)]} ${places[Math.floor(Math.random() * places.length)]}`,
    worldSetting: worldSettings[Math.floor(Math.random() * worldSettings.length)],
    plotPattern: plotPatterns[Math.floor(Math.random() * plotPatterns.length)],
    emotionalExpressions: randomEmotions,
    loveExpressions: getRandomElements(loveExpressions),
    atmosphere: getRandomElements(atmospheres),
    sensualExpressions: getRandomElements(sensualExpressions),
    mentalElements: getRandomElements(mentalElements),
    socialElements: getRandomElements(socialElements),
    pastMysteries: getRandomElements(pastMysteries)
  };
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
 * 基本設定作成用データAPIにリクエストを送信する関数
 * @param storyId 小説ID
 * @param params リクエストパラメータ
 * @param apiUrl 使用するAPIのベースURL
 * @param apiLabel APIの表示ラベル（ログ出力用）
 * @returns API応答
 */
async function createBasicSettingData(storyId: string, params: any, apiUrl: string, apiLabel: string = 'API') {
  try {
    console.log(`🔄 ${apiLabel}: 小説ID「${storyId}」の基本設定データを作成中...`);

    // バックエンド/フロントエンドでエンドポイントを区別
    let endpoint;
    if (apiUrl === BACKEND_API_URL) {
      // バックエンドの場合はそのままのパスを使用（REST形式）
      endpoint = `${apiUrl}/stories/${storyId}/basic-setting-data/`;
    } else {
      // フロントエンドの場合はクエリパラメータ形式を使用
      endpoint = `${apiUrl}/api/stories?id=${storyId}&action=basic-setting-data`;
    }

    // API用のリクエストパラメータを構築 - スネークケースに統一
    const requestParams = {
      theme: params.theme,
      time_and_place: params.timeAndPlace,
      world_setting: params.worldSetting,
      plot_pattern: params.plotPattern,
      emotional_expressions: params.emotionalExpressions || [],
      love_expressions: params.loveExpressions || [],
      atmosphere: params.atmosphere || [],
      sensual_expressions: params.sensualExpressions || [],
      mental_elements: params.mentalElements || [],
      social_elements: params.socialElements || [],
      past_mysteries: params.pastMysteries || []
    };

    console.log(`送信パラメータ:`, JSON.stringify(requestParams, null, 2));

    // APIリクエストを実行
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestParams),
    });

    // レスポンスをJSON形式で取得
    const data = await response.json();

    // APIの成功/失敗を確認
    if (response.ok) {
      console.log(`✅ ${apiLabel}: 基本設定データが正常に作成されました`);
      return { success: true, data, status: response.status };
    } else {
      console.error(`❌ ${apiLabel}: 基本設定データ作成に失敗しました: ${data.error || data.detail || '不明なエラー'}`);
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
 */
async function main() {
  try {
    const args = parseCommandLineArgs();

    // ヘルプ表示
    if (args.help) {
      showHelp();
      return;
    }

    console.log('=== 基本設定作成用データAPIテスト ===');

    // 小説IDの確認
    if (!args.storyId) {
      console.error('❌ 小説IDが指定されていません。--story-id パラメータで指定してください。');
      console.log('使い方の詳細は --help で確認できます。');
      if (args.test) process.exit(1);
      return;
    }

    // パラメータの準備
    let params: any;

    if (args.random) {
      // ランダムデータ生成
      params = generateRandomData();
      console.log(`🎲 ランダム生成されたパラメータ:`);
      console.log(JSON.stringify(params, null, 2));
    } else if (args.theme && args.timeAndPlace && args.worldSetting && args.plotPattern) {
      // コマンドライン引数からパラメータを取得
      params = {
        theme: args.theme,
        timeAndPlace: args.timeAndPlace,
        worldSetting: args.worldSetting,
        plotPattern: args.plotPattern,
        emotionalExpressions: args.emotionalExpressions || [],
        // デフォルト値を設定して必須フィールドにデータを入れる
        loveExpressions: ["純愛", "友情から愛へ"],
        atmosphere: ["明るい", "神秘的"],
        sensualExpressions: ["視覚的", "聴覚的"],
        mentalElements: ["記憶", "洞察"],
        socialElements: ["協力", "共存"],
        pastMysteries: ["隠された真実"]
      };
      console.log(`📚 指定されたパラメータ:`);
      console.log(JSON.stringify(params, null, 2));
    } else {
      // インタラクティブモードでパラメータを取得
      console.log('\n📝 基本設定作成用データのパラメータを入力してください:');

      const theme = await promptUser('テーマ: ');
      const timeAndPlace = await promptUser('時代と場所: ');
      const worldSetting = await promptUser('作品世界と舞台設定: ');
      const plotPattern = await promptUser('プロットパターン: ');
      const emotionalExpressionsInput = await promptUser('感情表現（カンマ区切り）: ');
      const loveExpressionsInput = await promptUser('愛情表現（カンマ区切り）: ');
      const atmosphereInput = await promptUser('雰囲気演出（カンマ区切り）: ');
      const sensualExpressionsInput = await promptUser('官能表現（カンマ区切り）: ');
      const mentalElementsInput = await promptUser('精神的要素（カンマ区切り）: ');
      const socialElementsInput = await promptUser('社会的要素（カンマ区切り）: ');
      const pastMysteriesInput = await promptUser('過去の謎（カンマ区切り）: ');

      // 入力文字列を配列に変換する関数
      const stringToArray = (input: string): string[] => {
        return input ? input.split(',').map(item => item.trim()).filter(item => item !== '') : [];
      };

      params = {
        theme,
        timeAndPlace,
        worldSetting,
        plotPattern,
        emotionalExpressions: stringToArray(emotionalExpressionsInput),
        loveExpressions: stringToArray(loveExpressionsInput),
        atmosphere: stringToArray(atmosphereInput),
        sensualExpressions: stringToArray(sensualExpressionsInput),
        mentalElements: stringToArray(mentalElementsInput),
        socialElements: stringToArray(socialElementsInput),
        pastMysteries: stringToArray(pastMysteriesInput)
      };
    }

    // モードに応じてAPIリクエストを送信
    if (args.compareMode) {
      // フロントエンドとバックエンドの両方にリクエストして比較
      console.log('\n🔍 フロントエンドとバックエンドの両方をテストします...');

      const frontendResult = await createBasicSettingData(args.storyId, params, FRONTEND_API_URL, 'フロントエンド');
      const backendResult = await createBasicSettingData(args.storyId, params, BACKEND_API_URL, 'バックエンド');

      const isMatch = compareResults(frontendResult, backendResult);

      if (args.test) {
        process.exit(isMatch ? 0 : 1);
      }
    } else {
      // 単一のAPIにリクエスト
      const apiUrl = args.backendDirect ? BACKEND_API_URL : FRONTEND_API_URL;
      const apiLabel = args.backendDirect ? 'バックエンド' : 'フロントエンド';

      console.log(`\n🔍 ${apiLabel}APIを使用します (${apiUrl})`);

      const result = await createBasicSettingData(args.storyId, params, apiUrl, apiLabel);

      // 結果の詳細表示
      if (result.success) {
        console.log('\n✅ 基本設定データの作成に成功しました');
        console.log('\n📝 作成された基本設定データの詳細:');
        console.log(JSON.stringify(result.data, null, 2));

        if (args.test) {
          process.exit(0);
        }
      } else {
        console.error('\n❌ 基本設定データの作成に失敗しました');
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
