import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface Theme {
  title: string;
  description?: string;
  examples?: string[];
}

interface SubCategory {
  title: string;
  themes: Theme[];
}

interface CategoryWithThemes {
  title: string;
  subcategories?: SubCategory[];
  themes?: Theme[];
}

export async function GET() {
  try {
    // マークダウンファイルのパス
    const filePath = path.join(process.cwd(), 'src/app/tools/basic-setting-data/data/01_theme.md');
    const emotionalFilePath = path.join(process.cwd(), 'src/app/tools/basic-setting-data/data/03_details/情緒的・感覚的要素パターン.md');
    
    // ファイルの内容を読み込む
    const content = await fs.readFile(filePath, 'utf8');
    const emotionalContent = await fs.readFile(emotionalFilePath, 'utf8');
    
    // カテゴリとテーマを抽出する
    const categories = parseCategories(content);
    
    // 情緒的・感覚的要素のサブカテゴリを追加
    const emotionalCategory = parseEmotionalCategory(emotionalContent);
    if (emotionalCategory) {
      categories.push(emotionalCategory);
    }
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('テーマデータの読み込みエラー:', error);
    return NextResponse.json(
      { error: 'テーマデータの読み込みに失敗しました' },
      { status: 500 }
    );
  }
}

function parseCategories(content: string): CategoryWithThemes[] {
  const lines = content.split('\n');
  const categories: CategoryWithThemes[] = [];
  
  let currentCategory: CategoryWithThemes | null = null;
  let currentTheme: Theme | null = null;
  let inExamples = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // カテゴリの見出し（# で始まる行）を検出
    if (line.startsWith('# ')) {
      // 新しいカテゴリを開始
      currentCategory = {
        title: line.substring(2).trim(),
        themes: []
      };
      
      categories.push(currentCategory);
      currentTheme = null;
      inExamples = false;
      continue;
    }
    
    // テーマの見出し（## で始まる行）を検出
    if (line.startsWith('## ') && currentCategory) {
      // 新しいテーマを開始
      currentTheme = {
        title: line.substring(3).trim(),
        description: '',
        examples: []
      };
      
      currentCategory.themes!.push(currentTheme);
      inExamples = false;
      continue;
    }
    
    // 代表作品セクションを検出
    if (line === '### 代表作品') {
      inExamples = true;
      continue;
    }
    
    // 次の見出しが来たら代表作品セクションを終了
    if ((line.startsWith('#') || line.startsWith('##')) && inExamples) {
      inExamples = false;
    }
    
    // 現在のテーマがある場合の処理
    if (currentTheme) {
      // 代表作品を収集
      if (inExamples && line.startsWith('- ')) {
        if (!currentTheme.examples) {
          currentTheme.examples = [];
        }
        currentTheme.examples.push(line.substring(2).trim());
      }
      // 説明文を収集（代表作品セクション以外の通常のテキスト）
      else if (!inExamples && line && !line.startsWith('#')) {
        if (currentTheme.description) {
          currentTheme.description += ' ' + line;
        } else {
          currentTheme.description = line;
        }
      }
    }
  }
  
  return categories;
}

function parseEmotionalCategory(content: string): CategoryWithThemes | null {
  const lines = content.split('\n');
  let emotionalCategory: CategoryWithThemes | null = null;
  let currentSubCategory: SubCategory | null = null;
  let currentTheme: Theme | null = null;
  let inExamples = false;
  let inFeatures = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // メインカテゴリの見出し（# で始まる行）を検出
    if (line.startsWith('# ')) {
      emotionalCategory = {
        title: line.substring(2).trim(),
        subcategories: []
      };
      currentSubCategory = null;
      currentTheme = null;
      inExamples = false;
      inFeatures = false;
      continue;
    }
    
    if (!emotionalCategory) continue;
    
    // サブカテゴリの見出し（## で始まる行）を検出
    if (line.startsWith('## ') && emotionalCategory) {
      currentSubCategory = {
        title: line.substring(3).trim(),
        themes: []
      };
      
      emotionalCategory.subcategories!.push(currentSubCategory);
      currentTheme = null;
      inExamples = false;
      inFeatures = false;
      continue;
    }
    
    // テーマの見出し（### で始まる行）を検出
    if (line.startsWith('### ') && currentSubCategory) {
      const title = line.substring(4).trim();
      
      // 特殊なセクションの場合はスキップ
      if (title === '主な要素' || title === '代表的な活用法' || title === '効果的な使用場面') {
        if (title === '主な要素') {
          inFeatures = true;
          inExamples = false;
        } else {
          inFeatures = false;
          inExamples = false;
        }
        continue;
      }
      
      // 通常のテーマとして処理
      currentTheme = {
        title: title,
        description: '',
        examples: []
      };
      
      currentSubCategory.themes.push(currentTheme);
      inExamples = false;
      inFeatures = false;
      continue;
    }
    
    // 主な要素を収集
    if (inFeatures && line.startsWith('- ') && currentSubCategory && !currentTheme) {
      const parts = line.substring(2).split('（');
      const title = parts[0].trim();
      let description = '';
      
      if (parts.length > 1) {
        description = parts[1].replace('）', '').trim();
      }
      
      const theme: Theme = {
        title: title,
        description: description,
        examples: []
      };
      
      currentSubCategory.themes.push(theme);
      continue;
    }
  }
  
  return emotionalCategory;
}
