/**
 * 基本設定データMarkdown取得・保存スクリプト
 * 基本設定（BasicSetting）のテストに必要なMarkdownファイルを取得・保存します
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
  // 標準引数
  help?: boolean;
  backendDirect?: boolean;
  test?: boolean;
  // 機能固有引数
  storyId?: string;
  outputDir?: string;
}

// データ保存ディレクトリ
const DATA_DIR = path.join(__dirname, 'data');
const BASIC_SETTING_DATA_DIR = path.join(DATA_DIR, 'BasicSettingData');

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
      case '--test':
        args.test = true;
        break;
      default:
        // 値を取る引数の処理
        if (arg.startsWith('--story-id=')) {
          args.storyId = arg.split('=')[1];
        } else if (arg.startsWith('--output-dir=')) {
          args.outputDir = arg.split('=')[1];
        } else if (arg === '--story-id' && i + 1 < process.argv.length) {
          args.storyId = process.argv[++i];
        } else if (arg === '--output-dir' && i + 1 < process.argv.length) {
          args.outputDir = process.argv[++i];
        }
        break;
    }
  }

  return args;
}

// ヘルプの表示
function showHelp() {
  console.log(`
基本設定データMarkdown取得・保存スクリプト

使用方法:
  npx ts-node test_basic_setting_data_markdown.ts [オプション]

オプション:
  --help, -h              このヘルプを表示
  --backend-direct, -b    バックエンドに直接アクセス
  --test                  自動テストモード（終了コード0/1で結果を返す）
  --story-id=<ID>         テスト対象のストーリーID
  --output-dir=<DIR>      出力ディレクトリ（デフォルト: ./data/BasicSettingData）
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

// 基本設定データの取得
async function getBasicSettingData(apiUrl: string, storyId: string): Promise<any> {
  try {
    console.log('基本設定データを取得中...');
    
    const response = await fetch(`${apiUrl}/stories/${storyId}/basic-setting-data/`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`基本設定データの取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

// 統合設定クリエイターデータの取得
async function getIntegratedSettingData(apiUrl: string, storyId: string): Promise<any> {
  try {
    console.log('統合設定クリエイターデータを取得中...');
    
    const response = await fetch(`${apiUrl}/stories/${storyId}/integrated-setting-creator/detail/`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`APIエラー: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`統合設定クリエイターデータの取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

// 基本設定データをMarkdownに変換
function convertBasicSettingDataToMarkdown(data: any): string {
  if (!data) return '';
  
  let markdown = '# 基本設定データ\n\n';
  
  // 基本情報
  markdown += `## 基本情報\n\n`;
  markdown += `- ID: ${data.id}\n`;
  markdown += `- 作成日時: ${data.created_at}\n\n`;
  
  // テーマ
  if (data.theme) {
    markdown += `## テーマ\n\n${data.theme}\n\n`;
  }
  
  // 時代と場所
  if (data.time_and_place) {
    markdown += `## 時代と場所\n\n${data.time_and_place}\n\n`;
  }
  
  // 世界観と舞台設定
  if (data.world_setting) {
    markdown += `## 世界観と舞台設定\n\n${data.world_setting}\n\n`;
  }
  
  // プロットパターン
  if (data.plot_pattern) {
    markdown += `## プロットパターン\n\n${data.plot_pattern}\n\n`;
  }
  
  // 愛情表現
  if (data.love_expressions && data.love_expressions.length > 0) {
    markdown += `## 愛情表現\n\n`;
    for (const expression of data.love_expressions) {
      markdown += `- ${expression}\n`;
    }
    markdown += '\n';
  }
  
  // 感情表現
  if (data.emotional_expressions && data.emotional_expressions.length > 0) {
    markdown += `## 感情表現\n\n`;
    for (const expression of data.emotional_expressions) {
      markdown += `- ${expression}\n`;
    }
    markdown += '\n';
  }
  
  // 雰囲気
  if (data.atmosphere && data.atmosphere.length > 0) {
    markdown += `## 雰囲気\n\n`;
    for (const item of data.atmosphere) {
      markdown += `- ${item}\n`;
    }
    markdown += '\n';
  }
  
  // 感覚表現
  if (data.sensual_expressions && data.sensual_expressions.length > 0) {
    markdown += `## 感覚表現\n\n`;
    for (const expression of data.sensual_expressions) {
      markdown += `- ${expression}\n`;
    }
    markdown += '\n';
  }
  
  // 精神的要素
  if (data.mental_elements && data.mental_elements.length > 0) {
    markdown += `## 精神的要素\n\n`;
    for (const element of data.mental_elements) {
      markdown += `- ${element}\n`;
    }
    markdown += '\n';
  }
  
  // 社会的要素
  if (data.social_elements && data.social_elements.length > 0) {
    markdown += `## 社会的要素\n\n`;
    for (const element of data.social_elements) {
      markdown += `- ${element}\n`;
    }
    markdown += '\n';
  }
  
  // 過去の謎
  if (data.past_mysteries && data.past_mysteries.length > 0) {
    markdown += `## 過去の謎\n\n`;
    for (const mystery of data.past_mysteries) {
      markdown += `- ${mystery}\n`;
    }
    markdown += '\n';
  }
  
  return markdown;
}

// 統合設定クリエイターデータをMarkdownに変換
function convertIntegratedSettingDataToMarkdown(data: any): string {
  if (!data || !data.basic_setting_data) return '';
  
  const settingData = data.basic_setting_data;
  let markdown = '# 統合設定クリエイターデータ\n\n';
  
  // 基本情報
  markdown += `## 基本情報\n\n`;
  markdown += `- ID: ${data.id}\n`;
  markdown += `- 作成日時: ${data.created_at}\n\n`;
  
  // テーマ
  if (settingData.theme && settingData.theme.title) {
    markdown += `## テーマ\n\n${settingData.theme.title}\n\n`;
    if (settingData.theme.description) {
      markdown += `${settingData.theme.description}\n\n`;
    }
  }
  
  // 時代と場所
  if (settingData.timePlace && settingData.timePlace.title) {
    markdown += `## 時代と場所\n\n${settingData.timePlace.title}\n\n`;
    if (settingData.timePlace.description) {
      markdown += `${settingData.timePlace.description}\n\n`;
    }
  }
  
  // 世界観と舞台設定
  if (settingData.worldSetting && settingData.worldSetting.title) {
    markdown += `## 世界観と舞台設定\n\n${settingData.worldSetting.title}\n\n`;
    if (settingData.worldSetting.description) {
      markdown += `${settingData.worldSetting.description}\n\n`;
    }
  }
  
  // プロットパターン
  if (settingData.plotPattern && settingData.plotPattern.title) {
    markdown += `## プロットパターン\n\n${settingData.plotPattern.title}\n\n`;
    if (settingData.plotPattern.description) {
      markdown += `${settingData.plotPattern.description}\n\n`;
    }
  }
  
  // 情緒的要素
  if (settingData.emotionalElements && settingData.emotionalElements.selectedElements) {
    // カテゴリごとに分類
    const categorizedElements: Record<string, string[]> = {};
    for (const element of settingData.emotionalElements.selectedElements) {
      if (!categorizedElements[element.category]) {
        categorizedElements[element.category] = [];
      }
      categorizedElements[element.category].push(element.element);
    }
    
    // カテゴリごとに出力
    for (const category in categorizedElements) {
      markdown += `## ${category}\n\n`;
      for (const element of categorizedElements[category]) {
        markdown += `- ${element}\n`;
      }
      markdown += '\n';
    }
  }
  
  // 過去の謎
  if (settingData.pastMystery && settingData.pastMystery.events) {
    markdown += `## 過去の謎\n\n`;
    for (const event of settingData.pastMystery.events) {
      markdown += `- ${event}\n`;
    }
    markdown += '\n';
  }
  
  return markdown;
}

// データの保存
async function saveDataToFiles(storyId: string, outputDir: string, basicSettingData: any, integratedSettingData: any): Promise<boolean> {
  try {
    // 出力ディレクトリの作成
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR);
    }
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    // 基本設定データの保存
    if (basicSettingData) {
      // JSONデータの保存
      const jsonPath = path.join(outputDir, `story_${storyId}_basic_setting_data.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(basicSettingData, null, 2), 'utf8');
      console.log(`基本設定データのJSONを保存しました: ${jsonPath}`);
      
      // Markdownデータの保存
      const markdown = convertBasicSettingDataToMarkdown(basicSettingData);
      const mdPath = path.join(outputDir, `story_${storyId}_basic_setting_data.md`);
      fs.writeFileSync(mdPath, markdown, 'utf8');
      console.log(`基本設定データのMarkdownを保存しました: ${mdPath}`);
    }
    
    // 統合設定クリエイターデータの保存
    if (integratedSettingData) {
      // JSONデータの保存
      const jsonPath = path.join(outputDir, `story_${storyId}_integrated_setting_data.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(integratedSettingData, null, 2), 'utf8');
      console.log(`統合設定クリエイターデータのJSONを保存しました: ${jsonPath}`);
      
      // Markdownデータの保存
      const markdown = convertIntegratedSettingDataToMarkdown(integratedSettingData);
      const mdPath = path.join(outputDir, `story_${storyId}_integrated_setting_data.md`);
      fs.writeFileSync(mdPath, markdown, 'utf8');
      console.log(`統合設定クリエイターデータのMarkdownを保存しました: ${mdPath}`);
    }
    
    return true;
  } catch (error) {
    console.error(`データの保存に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// テストの実行
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
  
  // 出力ディレクトリの決定
  const outputDir = args.outputDir || BASIC_SETTING_DATA_DIR;
  
  // 基本設定データの取得
  const basicSettingData = await getBasicSettingData(apiUrl, storyId);
  
  // 統合設定クリエイターデータの取得
  const integratedSettingData = await getIntegratedSettingData(apiUrl, storyId);
  
  // データの保存
  if (basicSettingData || integratedSettingData) {
    return await saveDataToFiles(storyId, outputDir, basicSettingData, integratedSettingData);
  } else {
    console.error('基本設定データと統合設定クリエイターデータの両方の取得に失敗しました');
    return false;
  }
}

// メイン処理
async function main() {
  const args = parseCommandLineArgs();
  
  // ヘルプの表示
  if (args.help) {
    showHelp();
    return;
  }
  
  // テストの実行
  const success = await runTest(args);
  
  // 自動テストモードの場合は終了コードを設定
  if (args.test) {
    process.exit(success ? 0 : 1);
  }
}

// スクリプトの実行
main().catch(error => {
  console.error('予期しないエラーが発生しました:', error);
  process.exit(1);
});
