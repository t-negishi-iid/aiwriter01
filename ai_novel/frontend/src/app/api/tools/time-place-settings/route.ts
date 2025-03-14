import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface TimePlaceSetting {
  title: string;
  examples: string[];
  content?: string; 
}

interface Category {
  title: string;
  settings: TimePlaceSetting[];
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src/app/tools/basic-setting-data/data/03_details/時代と場所パターン.md');
    
    const content = await fs.readFile(filePath, 'utf8');
    
    const categories = parseTimePlaceSettings(content);
    
    return NextResponse.json({
      count: categories.length,
      next: null,
      previous: null,
      results: categories,
      status: 'success'
    });
  } catch (error) {
    console.error('時代と場所データの読み込みエラー:', error);
    return NextResponse.json({
      count: 0,
      next: null,
      previous: null,
      results: [],
      status: 'error',
      error: {
        message: '時代と場所データの読み込みに失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      }
    }, { status: 500 });
  }
}

function parseTimePlaceSettings(content: string): Category[] {
  const lines = content.split('\n');
  const categories: Category[] = [];
  
  let currentCategory: Category | null = null;
  let currentSetting: TimePlaceSetting | null = null;
  let collectingExamples = false;
  let exampleContent = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('# ')) {
      if (currentSetting && exampleContent) {
        currentSetting.content = exampleContent.trim();
        exampleContent = '';
      }
      
      currentCategory = {
        title: line.substring(2).trim(),
        settings: []
      };
      
      categories.push(currentCategory);
      currentSetting = null;
      collectingExamples = false;
      continue;
    }
    
    if (!currentCategory) continue;
    
    if (line.startsWith('## ')) {
      if (currentSetting && exampleContent) {
        currentSetting.content = exampleContent.trim();
        exampleContent = '';
      }
      
      currentSetting = {
        title: line.substring(3).trim(),
        examples: []
      };
      
      currentCategory.settings.push(currentSetting);
      collectingExamples = false;
      continue;
    }
    
    if (!currentSetting) continue;
    
    if (line.startsWith('### 代表作品')) {
      collectingExamples = true;
      exampleContent += line + '\n';
      continue;
    }
    
    if (collectingExamples && line.startsWith('- ')) {
      currentSetting.examples.push(line.substring(2).trim());
      exampleContent += line + '\n';
    } else if (line) {
      exampleContent += line + '\n';
    } else {
      exampleContent += '\n';
    }
  }
  
  if (currentSetting && exampleContent) {
    currentSetting.content = exampleContent.trim();
  }
  
  return categories;
}
