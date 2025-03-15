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

// コマンドライン引数の解析
interface CommandLineArgs {
  // 標準引数
  help?: boolean;
  backendDirect?: boolean;
  compare?: boolean;
  test?: boolean;
  random?: boolean;
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

// コマンドライン引数の解析
function parseCommandLineArgs(): CommandLineArgs {
  const args: CommandLineArgs = {};

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    
    switch (arg) {
      case '--help':
      case '-h':
        args.help = true;
        break;
      case '--backend-direct':
      case '-b':
        args.backendDirect = true;
        break;
      case '--compare':
      case '-c':
        args.compare = true;
        break;
      case '--test':
        args.test = true;
        break;
      case '--random':
        args.random = true;
        break;
      case '--save-data':
        args.saveData = true;
        break;
      default:
        // 値を取る引数の処理
        if (arg.startsWith('--story-id=')) {
          args.storyId = arg.split('=')[1];
        } else if (arg.startsWith('--data-path=')) {
          args.dataPath = arg.split('=')[1];
        } else if (arg === '--story-id' && i + 1 < process.argv.length) {
          args.storyId = process.argv[++i];
        } else if (arg === '--data-path' && i + 1 < process.argv.length) {
          args.dataPath = process.argv[++i];
        }
        break;
    }
  }

  return args;
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

// 統合設定クリエイターデータの保存
async function saveIntegratedSettingCreatorData(apiUrl: string, storyId: string, data: string): Promise<TestResult> {
  try {
    console.log('統合設定クリエイターデータを保存中...');
    console.log(`APIエンドポイント: ${apiUrl}`);
    console.log(`ストーリーID: ${storyId}`);
    console.log(`送信データ (先頭100文字): ${data.substring(0, 100)}...`);
    
    // APIエンドポイントの構築
    const url = `${apiUrl}/stories/${storyId}/integrated-setting-creator/`;
    console.log(`リクエストURL: ${url}`);
    
    // リクエストデータを準備
    const requestData: IntegratedSettingRequest = {
      basic_setting_data: data
    };
    
    console.log('リクエスト送信中...');
    
    // APIリクエストを送信
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    console.log(`レスポンスステータス: ${response.status} ${response.statusText}`);
    
    // レスポンスの解析
    const responseData = await response.json();
    console.log('APIレスポンス:', JSON.stringify(responseData, null, 2));
    
    if (!response.ok) {
      throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
    }
    
    return {
      success: true,
      message: '統合設定クリエイターデータを保存しました',
      data: responseData
    };
  } catch (error) {
    console.error('エラー発生:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラー'
    };
  }
}

// 統合設定クリエイターデータの取得
async function getIntegratedSettingCreatorData(apiUrl: string, storyId: string): Promise<TestResult> {
  try {
    console.log('統合設定クリエイターデータを取得中...');
    
    const response = await fetch(`${apiUrl}/stories/${storyId}/integrated-setting-creator/detail/`, {
      method: 'GET'
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      return {
        success: true,
        message: '統合設定クリエイターデータの取得に成功しました',
        data: result.data
      };
    } else {
      return {
        success: false,
        message: `統合設定クリエイターデータの取得に失敗しました: ${result.message || response.statusText}`,
        data: result
      };
    }
  } catch (error) {
    console.error('エラー発生:', error);
    return {
      success: false,
      message: `エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
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
  const apiUrl = args.backendDirect ? BACKEND_API_URL : FRONTEND_API_URL;
  
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
  
  // フロントエンドとバックエンドの比較テスト
  if (args.compare) {
    return await runCompareTest(storyId, testData);
  }
  
  // 通常のテスト
  console.log(`${args.backendDirect ? 'バックエンド' : 'フロントエンド'}でテストを実行します...`);
  
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

// フロントエンドとバックエンドの比較テスト
async function runCompareTest(storyId: string, testData: string): Promise<boolean> {
  console.log('フロントエンドとバックエンドの比較テストを実行します...');
  
  // フロントエンドでのテスト
  console.log('\n--- フロントエンド ---');
  const frontendResult = await saveIntegratedSettingCreatorData(FRONTEND_API_URL, storyId, testData);
  console.log(frontendResult.message);
  
  // バックエンドでのテスト
  console.log('\n--- バックエンド ---');
  const backendResult = await saveIntegratedSettingCreatorData(BACKEND_API_URL, storyId, testData);
  console.log(backendResult.message);
  
  // 結果の比較
  const frontendSuccess = frontendResult.success;
  const backendSuccess = backendResult.success;
  
  console.log(`\n比較結果: フロントエンド(${frontendSuccess ? '成功' : '失敗'}) - バックエンド(${backendSuccess ? '成功' : '失敗'})`);
  
  return frontendSuccess && backendSuccess;
}

// メイン処理
async function main() {
  try {
    // コマンドライン引数の解析
    const args = parseCommandLineArgs();
    const { storyId, backendDirect, saveData } = args;

    if (!storyId) {
      console.error('エラー: --story-id パラメータが必要です');
      process.exit(1);
    }

    // APIのベースURLを設定
    const apiUrl = backendDirect ? 'http://localhost:8001/api' : 'http://localhost:3000/api';
    console.log(`${backendDirect ? 'バックエンド' : 'フロントエンド'}でテストを実行します...`);

    // サンプルデータの生成
    const sampleData = generateSampleIntegratedSettingData();

    // 統合設定クリエイターデータを保存
    if (saveData) {
      // モックAPIを使用（テスト用）
      const useMockApi = false;
      
      if (useMockApi) {
        console.log('モックAPIを使用してテストを実行します...');
        // モックデータを作成して保存
        const mockResult: TestResult = {
          success: true,
          message: 'モックAPIによる統合設定クリエイターデータの保存に成功しました',
          data: {
            id: 1,
            basic_setting_data: sampleData,
            created_at: new Date().toISOString()
          }
        };
        
        // 結果をファイルに保存
        await saveTestResults(storyId, 'save', mockResult);
        
        // Markdownレポートを生成して保存
        const markdownReport = generateMarkdownReport(sampleData);
        await saveMarkdownReport(storyId, markdownReport);
        
        console.log('統合設定クリエイターデータの保存に成功しました！（モックAPI）');
        console.log(`テスト結果を保存しました: ./results/story_${storyId}_integrated_setting_creator_test_results.json`);
        console.log(`Markdownレポートを保存しました: ./results/story_${storyId}_integrated_setting_creator_report.md`);
      } else {
        // 実際のAPIを使用
        const saveResult = await saveIntegratedSettingCreatorData(apiUrl, storyId, sampleData);
        
        if (saveResult.success) {
          console.log('統合設定クリエイターデータの保存に成功しました！');
          
          // 結果をファイルに保存
          await saveTestResults(storyId, 'save', saveResult);
          
          // Markdownレポートを生成して保存
          const markdownReport = generateMarkdownReport(sampleData);
          await saveMarkdownReport(storyId, markdownReport);
          
          console.log(`テスト結果を保存しました: ./results/story_${storyId}_integrated_setting_creator_test_results.json`);
          console.log(`Markdownレポートを保存しました: ./results/story_${storyId}_integrated_setting_creator_report.md`);
        } else {
          console.error(`統合設定クリエイターデータの保存に失敗しました: ${saveResult.error}`);
        }
      }
    }

  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
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
