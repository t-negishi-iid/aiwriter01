import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface ElementOption {
  text: string;
  description: string;
}

interface ElementCategory {
  title: string;
  options: ElementOption[];
  usage: string;
  effectiveScenes: string[];
}

export async function GET() {
  try {
    // マークダウンファイルのパス
    const filePath = path.join(
      process.cwd(),
      'src/app/tools/basic-setting-data/data/03_details/情緒的・感覚的要素パターン.md'
    );
    
    // ファイルの内容を読み込む
    const content = await fs.readFile(filePath, 'utf8');
    
    // 内容を解析
    const categories = parseEmotionalElements(content);
    
    return NextResponse.json({
      count: categories.length,
      next: null,
      previous: null,
      results: categories,
      status: 'success'
    });
  } catch (error) {
    console.error('情緒的・感覚的要素データの読み込みエラー:', error);
    return NextResponse.json({
      count: 0,
      next: null,
      previous: null,
      results: [],
      status: 'error',
      error: {
        message: '情緒的・感覚的要素データの読み込みに失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      }
    }, { status: 500 });
  }
}

function parseEmotionalElements(content: string): ElementCategory[] {
  const lines = content.split('\n');
  const categories: ElementCategory[] = [];
  
  let currentCategory: ElementCategory | null = null;
  let currentSection: string | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // カテゴリの開始（## で始まる行）
    if (line.startsWith('## ') && line !== '## 要素の組み合わせについての補足') {
      // 前のカテゴリがあれば保存
      if (currentCategory) {
        categories.push(currentCategory);
      }
      
      // 新しいカテゴリを開始
      currentCategory = {
        title: line.substring(3).trim(),
        options: [],
        usage: '',
        effectiveScenes: []
      };
      
      currentSection = null;
      continue;
    }
    
    if (!currentCategory) continue;
    
    // セクションの開始（### で始まる行）
    if (line.startsWith('### ')) {
      currentSection = line.substring(4).trim();
      continue;
    }
    
    // 主な要素セクション内の選択肢を処理
    if (currentSection === '主な要素' && line.startsWith('- ')) {
      const optionText = line.substring(2).trim();
      const match = optionText.match(/^(.+?)（(.+?)）$/);
      
      if (match) {
        currentCategory.options.push({
          text: match[1].trim(),
          description: match[2].trim()
        });
      } else {
        currentCategory.options.push({
          text: optionText,
          description: ''
        });
      }
      
      continue;
    }
    
    // 代表的な活用法セクション内のテキストを処理
    if (currentSection === '代表的な活用法' && line && !line.startsWith('-') && !line.startsWith('#')) {
      currentCategory.usage += line + ' ';
      continue;
    }
    
    // 効果的な使用場面セクション内のリストを処理
    if (currentSection === '効果的な使用場面' && line.startsWith('- ')) {
      currentCategory.effectiveScenes.push(line.substring(2).trim());
      continue;
    }
  }
  
  // 最後のカテゴリを追加
  if (currentCategory) {
    categories.push(currentCategory);
  }
  
  return categories;
}
