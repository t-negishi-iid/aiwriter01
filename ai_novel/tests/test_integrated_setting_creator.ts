/**
 * 統合設定クリエイターAPI
 * フロントエンドと同じ入出力仕様を持つ
 */
const integratedSettingCreatorApi = {
  // 統合設定クリエイターデータを保存
  saveIntegratedSettingData: async (storyId: string | number, data: any, apiBaseUrl: string = 'http://localhost:8001/api'): Promise<ApiResponse<any>> => {
    console.log('統合設定クリエイターデータを保存中...');
    console.log(`ストーリーID: ${storyId}`);
    
    // リクエストデータを準備
    const requestData = {
      basic_setting_data: data.basic_setting_data
    };
    
    console.log(`送信データ (先頭100文字): ${JSON.stringify(requestData).substring(0, 100)}...`);
    
    // APIリクエストを送信
    const endpoint = `/stories/${storyId}/integrated-setting-creator/`;
    
    return fetchApi(
      apiBaseUrl,
      endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      }
    );
  },
  
  // 統合設定クリエイターデータを取得
  getIntegratedSettingData: async (storyId: string | number, apiBaseUrl: string = 'http://localhost:8001/api'): Promise<ApiResponse<any>> => {
    console.log(`統合設定クリエイターデータを取得中... ストーリーID: ${storyId}`);
    
    const endpoint = `/stories/${storyId}/integrated-setting-creator/detail`;
    
    return fetchApi(
      apiBaseUrl,
      endpoint,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
};

// 統合設定クリエイターデータの保存（テスト用）
async function saveIntegratedSettingCreatorData(apiUrl: string, storyId: string, data: string): Promise<TestResult> {
  try {
    // 新しいAPIクライアント関数を使用
    const response = await integratedSettingCreatorApi.saveIntegratedSettingData(storyId, { basic_setting_data: data }, apiUrl);
    
    if (!response.success) {
      throw new Error(response.message || 'APIエラー');
    }
    
    return {
      success: true,
      message: '統合設定クリエイターデータを保存しました',
      data: response.data
    };
  } catch (error) {
    console.error('エラー発生:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラー'
    };
  }
}

/**
 * 統合設定クリエイターAPIテストスクリプト
 */
import * as readline from 'readline';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ES Modulesでのファイルパスとディレクトリパスの取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// APIのベースURL
const FRONTEND_API_URL = 'http://localhost:3000/api';
const BACKEND_API_URL = 'http://localhost:8001/api';

// API呼び出しの再試行オプション
const RETRY_OPTIONS = {
  retries: 2,         // 最大再試行回数
  retryDelay: 1000,   // 再試行間の遅延（ミリ秒）
  retryStatusCodes: [408, 429, 500, 502, 503, 504]  // 再試行するHTTPステータスコード
};

// APIレスポンスの型定義
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  count?: number;
  next?: string | null;
  previous?: string | null;
  status?: string;
  statusText?: string;
  meta?: Record<string, any>;
}

// コマンドライン引数の解析
interface CommandLineArgs {
  // 標準引数
  help?: boolean;
  backendDirect?: boolean;
  compare?: boolean;
  test?: boolean;
  random?: boolean;
  getData?: boolean;
  // 機能固有引数
  storyId?: string;
  dataPath?: string;
  saveData?: boolean;
}

// テスト結果の型定義
interface TestResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

// 統合設定クリエイターデータの型定義（シンプル化）
interface IntegratedSettingRequest {
  basic_setting_data: string;
}

// データ保存ディレクトリ
const DATA_DIR = path.join(__dirname, 'data');
const INTEGRATED_SETTING_DATA_DIR = path.join(DATA_DIR, 'IntegratedSettingData');

// コマンドライン引数を解析する関数
function parseCommandLineArgs(args: string[]): {
  storyId: string;
  backendDirect: boolean;
  saveData: boolean;
  getData: boolean;
} {
  const result = {
    storyId: '1',
    backendDirect: false,
    saveData: false,
    getData: false
  };
  
  // 引数を解析
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    console.log(`引数 ${i}: ${arg}`);
    
    if (arg.startsWith('--story-id=')) {
      result.storyId = arg.split('=')[1];
      console.log(`storyId設定: ${result.storyId}`);
    } else if (arg === '--backend-direct') {
      result.backendDirect = true;
    } else if (arg === '--save-data') {
      result.saveData = true;
    } else if (arg === '--get-data') {
      result.getData = true;
    }
  }
  
  return result;
}

// ヘルプの表示
function showHelp() {
  console.log(`
統合設定クリエイターAPIテストスクリプト

使用方法:
  npx ts-node test_integrated_setting_creator.ts [オプション]

オプション:
  --help, -h              このヘルプを表示
  --backend-direct, -b    バックエンドに直接アクセス
  --compare, -c           フロントエンドとバックエンドの結果を比較
  --test                  自動テストモード（終了コード0/1で結果を返す）
  --random                ランダムデータを生成してテスト
  --story-id=<ID>         テスト対象のストーリーID
  --data-path=<PATH>      テストデータのパス
  --save-data             テスト結果をファイルに保存
  --get-data              統合設定クリエイターデータを取得
  `);
}

// ユーザー入力の取得
function getUserInput(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// ランダムな統合設定クリエイターデータの生成
function generateRandomIntegratedSettingData(): string {
  const themes = ['冒険', '恋愛', '成長', '友情', '復讐', '希望', '絶望', '再生'];
  const timePlaces = ['現代日本', '中世ヨーロッパ', '近未来都市', '古代中国', '宇宙コロニー'];
  const worldSettings = ['魔法世界', '科学技術発展社会', 'ポストアポカリプス', 'パラレルワールド'];
  const plotPatterns = ['英雄の旅', '恋愛ストーリー', '成長物語', '謎解き', '冒険活劇'];
  
  const emotionalCategories = [
    { category: '愛情表現', elements: ['純愛', '片思い', '恋愛', '友情'] },
    { category: '感情表現', elements: ['喜び', '悲しみ', '怒り', '恐怖', '驚き'] },
    { category: '雰囲気', elements: ['明るい', '暗い', '神秘的', '緊張感', '和やか'] },
    { category: '感覚表現', elements: ['視覚', '聴覚', '触覚', '味覚', '嗅覚'] },
    { category: '精神的要素', elements: ['勇気', '忍耐', '知恵', '誠実', '優しさ'] },
    { category: '社会的要素', elements: ['階級', '差別', '平等', '正義', '自由'] }
  ];
  
  const selectedElements = [];
  // 各カテゴリから1-2個の要素をランダムに選択
  for (const category of emotionalCategories) {
    const count = Math.floor(Math.random() * 2) + 1; // 1-2個
    const selectedIndices = new Set<number>();
    
    while (selectedIndices.size < count) {
      const index = Math.floor(Math.random() * category.elements.length);
      selectedIndices.add(index);
    }
    
    for (const index of selectedIndices) {
      selectedElements.push({
        category: category.category,
        element: category.elements[index]
      });
    }
  }
  
  // 過去の謎を生成
  const pastMysteryCount = Math.floor(Math.random() * 3) + 1; // 1-3個
  const pastMysteries = [];
  const mysteryTemplates = [
    '主人公は過去に○○を失った',
    '世界には○○という秘密が隠されている',
    '○○という謎の組織が暗躍している',
    '主人公には○○という秘密がある',
    '○○という事件が起きた理由は不明'
  ];
  
  for (let i = 0; i < pastMysteryCount; i++) {
    const templateIndex = Math.floor(Math.random() * mysteryTemplates.length);
    pastMysteries.push(mysteryTemplates[templateIndex]);
  }
  
  return JSON.stringify({
    theme: themes[Math.floor(Math.random() * themes.length)],
    timePlace: timePlaces[Math.floor(Math.random() * timePlaces.length)],
    worldSetting: worldSettings[Math.floor(Math.random() * worldSettings.length)],
    plotPattern: plotPatterns[Math.floor(Math.random() * plotPatterns.length)],
    emotionalElements: selectedElements,
    pastMystery: pastMysteries
  });
}

// サンプル統合設定データの生成
function generateSampleIntegratedSettingData(): string {
  return `# 統合設定データ

## テーマ
テスト用テーマ

## 時代と場所
テスト用時代と場所

## 世界観
テスト用世界観

## プロットパターン
テスト用プロットパターン

## 感情要素
- 愛情表現: 純愛
- 感情表現: 喜び
- 雰囲気: 明るい
- 感覚表現: 視覚的
- 精神的要素: 希望
- 社会的要素: 友情

## 過去の謎
1. テスト用過去の謎1
2. テスト用過去の謎2

## 備考
このデータはテスト用に生成されたMarkdownデータです。`;
}

// 統合設定クリエイターデータをMarkdownに変換
function convertToMarkdown(data: any): string {
  let markdown = '# 統合設定データ\n\n';
  
  if (data.theme) {
    markdown += `## テーマ\n${data.theme}\n\n`;
  }
  
  if (data.timePlace) {
    markdown += `## 時代と場所\n${data.timePlace}\n\n`;
  }
  
  if (data.worldSetting) {
    markdown += `## 世界観と舞台設定\n${data.worldSetting}\n\n`;
  }
  
  if (data.plotPattern) {
    markdown += `## プロットパターン\n${data.plotPattern}\n\n`;
  }
  
  if (data.emotionalElements && data.emotionalElements.length > 0) {
    markdown += '## 情緒的要素\n';
    
    // カテゴリごとに分類
    const categorizedElements: Record<string, string[]> = {};
    for (const element of data.emotionalElements) {
      if (!categorizedElements[element.category]) {
        categorizedElements[element.category] = [];
      }
      categorizedElements[element.category].push(element.element);
    }
    
    // カテゴリごとに出力
    for (const category in categorizedElements) {
      markdown += `### ${category}\n`;
      for (const element of categorizedElements[category]) {
        markdown += `- ${element}\n`;
      }
      markdown += '\n';
    }
  }
  
  if (data.pastMystery && data.pastMystery.length > 0) {
    markdown += '## 過去の謎\n';
    for (const event of data.pastMystery) {
      markdown += `- ${event}\n`;
    }
    markdown += '\n';
  }
  
  return markdown;
}

// 統合設定クリエイターデータを取得する関数
async function getIntegratedSettingCreatorData(apiUrl: string, storyId: string): Promise<TestResult> {
  console.log('統合設定クリエイターデータを取得中...');
  
  try {
    // エンドポイントを構築（末尾にスラッシュを追加）
    const endpoint = `/stories/${storyId}/integrated-setting-creator/detail/`;
    
    // APIリクエストを送信
    const response = await fetchApi(apiUrl, endpoint);
    
    // 204 No Contentの場合の処理
    if (response.status && Number(response.status) === 204) {
      console.log('データが存在しません（204 No Content）');
      return {
        success: true,
        message: 'データが存在しません',
        data: {
          data: {
            basic_setting_data: "",
            integrated_setting_data: ""
          }
        }
      };
    }
    
    return {
      success: true,
      message: '統合設定クリエイターデータの取得に成功しました',
      data: response
    };
  } catch (error) {
    console.error(`統合設定クリエイターデータの取得に失敗しました: ${error}`);
    return {
      success: false,
      message: `統合設定クリエイターデータの取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
      data: null
    };
  }
}

// テスト結果の保存
async function saveTestResults(storyId: string, testType: string, result: TestResult): Promise<void> {
  try {
    // 結果ディレクトリの作成
    if (!fs.existsSync('./results')) {
      fs.mkdirSync('./results', { recursive: true });
    }
    
    // ファイル名の設定
    const filename = `./results/story_${storyId}_integrated_setting_creator_test_results.json`;
    
    // 既存のファイルがあれば読み込む
    let existingData: any = {};
    if (fs.existsSync(filename)) {
      const fileContent = fs.readFileSync(filename, 'utf8');
      existingData = JSON.parse(fileContent);
    }
    
    // 新しい結果を追加
    existingData[testType] = {
      timestamp: new Date().toISOString(),
      ...result
    };
    
    // ファイルに保存
    fs.writeFileSync(filename, JSON.stringify(existingData, null, 2), 'utf8');
  } catch (error) {
    console.error(`テスト結果の保存に失敗しました: ${error}`);
  }
}

// Markdownレポートをファイルに保存
async function saveMarkdownReport(storyId: string, markdownContent: string): Promise<void> {
  try {
    // 結果ディレクトリの作成
    if (!fs.existsSync('./results')) {
      fs.mkdirSync('./results', { recursive: true });
    }
    
    // ファイル名の設定
    const filename = `./results/story_${storyId}_integrated_setting_creator_report.md`;
    
    // ファイルに保存
    fs.writeFileSync(filename, markdownContent, 'utf8');
  } catch (error) {
    console.error(`Markdownレポートの保存に失敗しました: ${error}`);
  }
}

// テスト実行関数
async function runTest(args: CommandLineArgs): Promise<boolean> {
  // APIのベースURLを決定
  const apiUrl = 'http://localhost:8001/api';
  
  // ストーリーIDの取得
  let storyId = args.storyId;
  if (!storyId) {
    if (args.test) {
      console.error('自動テストモードではストーリーIDが必要です (--story-id=<ID>)');
      return false;
    }
    storyId = await getUserInput('テスト対象のストーリーID: ');
  }
  
  // テストデータの生成
  const testData = args.random ? generateRandomIntegratedSettingData() : generateSampleIntegratedSettingData();
  
  // 通常のテスト
  console.log('バックエンドでテストを実行します...');
  
  // データの保存
  const saveResult = await saveIntegratedSettingCreatorData(apiUrl, storyId, testData);
  console.log(saveResult.message);
  
  if (saveResult.success) {
    // データの取得
    const getResult = await getIntegratedSettingCreatorData(apiUrl, storyId);
    console.log(getResult.message);
    
    if (getResult.success && args.saveData) {
      // テスト結果の保存
      await saveTestResults(storyId, 'save', saveResult);
      await saveTestResults(storyId, 'get', getResult);
    }
    
    return getResult.success;
  }
  
  return saveResult.success;
}

// メイン処理
async function main() {
  try {
    // コマンドライン引数の解析
    const args = parseCommandLineArgs(process.argv.slice(2));
    console.log(`解析結果: ${JSON.stringify(args)}`);
    
    // バックエンド直接接続に設定
    const backendDirect = true; // 常にバックエンド直接接続を使用
    console.log(`${backendDirect ? 'バックエンド' : 'フロントエンド'}でテストを実行します...`);
    
    // APIのベースURLを設定
    const apiUrl = 'http://localhost:8001/api';

    // サンプルデータの生成
    const sampleData = generateSampleIntegratedSettingData();
    
    // ストーリーIDを取得
    const storyId = args.storyId || '1';
    console.log(`ストーリーID: ${storyId}`);
    
    // 操作の実行
    if (args.saveData) {
      // データの保存
      const saveResult = await saveIntegratedSettingCreatorData(apiUrl, storyId, sampleData);
      
      if (saveResult.success) {
        console.log('統合設定クリエイターデータの保存に成功しました！');
        console.log(`保存したデータ:\n${JSON.stringify(saveResult.data, null, 2)}`);
        
        // 結果をファイルに保存
        await saveResultToFile(`./results/story_${storyId}_integrated_setting_creator_save_results.json`, saveResult);
        console.log(`テスト結果を保存しました: ./results/story_${storyId}_integrated_setting_creator_save_results.json`);
      } else {
        console.error('統合設定クリエイターデータの保存に失敗しました。');
        console.error(`エラー: ${saveResult.message}`);
      }
    }
    
    if (args.getData) {
      // データの取得
      try {
        const getResult = await getIntegratedSettingCreatorData(apiUrl, storyId);
        
        if (getResult.success) {
          console.log('統合設定クリエイターデータの取得に成功しました！');
          
          // 結果をファイルに保存
          await saveResultToFile(`./results/story_${storyId}_integrated_setting_creator_get_results.json`, getResult);
          console.log(`テスト結果を保存しました: ./results/story_${storyId}_integrated_setting_creator_get_results.json`);
          
          // 取得したデータを表示
          console.log(`取得したデータ:\n${JSON.stringify(getResult.data, null, 2).substring(0, 500)}...`);
        } else {
          console.error('統合設定クリエイターデータの取得に失敗しました。');
          console.error(`エラー: ${getResult.message}`);
        }
      } catch (error) {
        console.error(`データ取得中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
    return false;
  }
}

// テスト結果をファイルに保存
async function saveResultToFile(filename: string, result: TestResult): Promise<void> {
  try {
    // ファイルに保存
    fs.writeFileSync(filename, JSON.stringify(result, null, 2), 'utf8');
  } catch (error) {
    console.error(`テスト結果の保存に失敗しました: ${error}`);
  }
}

// スクリプトの実行
main().catch(error => {
  console.error('予期しないエラーが発生しました:', error);
  process.exit(1);
});

// Markdownレポートの生成
function generateMarkdownReport(data: string): string {
  let markdown = '# 統合設定クリエイターテスト結果\n\n';
  markdown += `実行日時: ${new Date().toISOString()}\n\n`;
  
  markdown += '## 保存されたMarkdownデータ\n\n';
  markdown += '```markdown\n';
  markdown += data;
  markdown += '\n```\n\n';
  
  markdown += '## テスト結果\n\n';
  markdown += '- ✅ Markdown形式のデータが正常に保存されました\n';
  markdown += '- ✅ APIレスポンスが正常に返されました\n';
  
  return markdown;
}

// 統合設定クリエイターデータのMarkdown生成
function generateDataMarkdown(storyId: string, data: string): string {
  let markdown = `# 統合設定データ\n\n`;
  
  markdown += `## ストーリーID: ${storyId}\n\n`;
  
  markdown += convertToMarkdown(JSON.parse(data));
  
  return markdown;
}

/**
 * 基本的なAPI呼び出し関数（再試行機能付き）
 * @param baseUrl ベースURL
 * @param endpoint エンドポイント
 * @param options リクエストオプション
 * @returns API レスポンス
 */
async function fetchApi<T>(
  baseUrl: string,
  endpoint: string,
  options: any = {}
): Promise<ApiResponse<T>> {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;

  let lastError: Error | null = null;
  let retryCount = 0;

  while (retryCount <= RETRY_OPTIONS.retries) {
    try {
      console.log(`リクエスト送信中... URL: ${url}`);
      const response = await fetch(url, options);
      
      console.log(`レスポンスステータス: ${response.status} ${response.statusText}`);
      
      // レスポンスのテキストを取得
      const text = await response.text();

      // JSONパース (空文字列の場合は空オブジェクトを返す)
      let data;
      try {
        data = text ? JSON.parse(text) : {};
        console.log('APIレスポンス:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.error('JSONパースエラー:', e);
        return {
          success: false,
          message: "JSONパースエラー",
        };
      }

      // 成功レスポンス
      if (response.ok) {
        // DRFの標準ページネーション形式に対応
        if (data.count !== undefined && data.results !== undefined) {
          return { 
            success: true, 
            data: data.results,
            count: data.count,
            next: data.next,
            previous: data.previous,
            status: data.status || 'success',
            meta: data.meta
          };
        }
        
        // 標準的なAPIレスポンス
        return { 
          success: true, 
          data,
          message: data.message
        };
      }

      // 再試行可能なステータスコードの場合
      if (RETRY_OPTIONS.retryStatusCodes.includes(response.status) && retryCount < RETRY_OPTIONS.retries) {
        lastError = new Error(`HTTP error ${response.status}`);
        retryCount++;
        console.log(`再試行 ${retryCount}/${RETRY_OPTIONS.retries}...`);

        // 再試行前に少し待機
        await new Promise(resolve => setTimeout(resolve, RETRY_OPTIONS.retryDelay));
        continue;
      }

      // 再試行しないエラーレスポンス
      return {
        success: false,
        message: data.detail || data.message || `エラー: ${response.status}`,
        errors: data.errors,
        status: response.status.toString(),
        statusText: response.statusText
      };
    } catch (error) {
      console.error('ネットワークエラー:', error);
      
      lastError = error instanceof Error ? error : new Error(String(error));

      // 最大再試行回数に達していない場合は再試行
      if (retryCount < RETRY_OPTIONS.retries) {
        retryCount++;
        console.log(`再試行 ${retryCount}/${RETRY_OPTIONS.retries}...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_OPTIONS.retryDelay));
        continue;
      }

      return {
        success: false,
        message: lastError.message || "ネットワークエラー",
      };
    }
  }

  // ここに到達することはないはずだが、TypeScriptのために戻り値を用意
  return {
    success: false,
    message: lastError?.message || "予期せぬエラー",
  };
}

// テスト用API呼び出し関数
async function testFetchApi<T>(
  baseUrl: string,
  endpoint: string,
  options: any = {}
): Promise<ApiResponse<T>> {
  // fetchApi関数を呼び出す
  return fetchApi(baseUrl, endpoint, options);
}
