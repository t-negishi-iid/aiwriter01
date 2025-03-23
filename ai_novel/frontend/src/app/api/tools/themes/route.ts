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
    
    // ファイルの内容を読み込む
    const content = await fs.readFile(filePath, 'utf8');
    
    // カテゴリとテーマを抽出する
    const categories = parseCategories(content);
    
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
