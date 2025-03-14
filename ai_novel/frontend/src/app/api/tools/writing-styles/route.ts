import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface WritingStyle {
  author: string;
  structure?: string;
  techniques?: string[];
  themes?: string;
}

export async function GET() {
  try {
    // 作風パターンファイルのパス
    const filePath = path.join(process.cwd(), 'src/app/tools/basic-setting-data/data/03_details/作風パターン.md');
    
    // ファイルの内容を読み込む
    const content = await fs.readFile(filePath, 'utf8');
    
    // 作風パターンを抽出する
    const styles = parseWritingStyles(content);
    
    return NextResponse.json({
      count: styles.length,
      next: null,
      previous: null,
      results: styles,
      status: 'success'
    });
  } catch (error) {
    console.error('作風パターンデータの読み込みエラー:', error);
    return NextResponse.json({
      count: 0,
      next: null,
      previous: null,
      results: [],
      status: 'error',
      error: {
        message: '作風パターンデータの読み込みに失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      }
    }, { status: 500 });
  }
}

function parseWritingStyles(content: string): WritingStyle[] {
  const lines = content.split('\n');
  const styles: WritingStyle[] = [];
  
  let currentStyle: WritingStyle | null = null;
  let currentSection: string | null = null;
  let collectingTechniques = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 作家名（## で始まる行）を検出
    if (line.startsWith('## ')) {
      // 前の作家の情報があれば保存
      if (currentStyle) {
        styles.push(currentStyle);
      }
      
      // 新しい作家の情報を開始
      currentStyle = {
        author: line.substring(3).trim(),
      };
      
      currentSection = null;
      collectingTechniques = false;
      continue;
    }
    
    // 現在の作家情報がない場合はスキップ
    if (!currentStyle) continue;
    
    // セクション（### で始まる行）を検出
    if (line.startsWith('### ')) {
      currentSection = line.substring(4).trim();
      collectingTechniques = false;
      continue;
    }
    
    // セクションがない場合はスキップ
    if (!currentSection) continue;
    
    // 表現技法のリスト項目を検出
    if (currentSection === '表現技法' && line.startsWith('- ')) {
      if (!collectingTechniques) {
        currentStyle.techniques = [];
        collectingTechniques = true;
      }
      
      currentStyle.techniques.push(line.substring(2).trim());
      continue;
    }
    
    // 通常のテキスト（セクションの説明文）
    if (line && !line.startsWith('#') && !line.startsWith('-')) {
      if (currentSection === '文体と構造的特徴') {
        currentStyle.structure = line;
      } else if (currentSection === 'テーマと主題') {
        currentStyle.themes = line;
      }
    }
  }
  
  // 最後の作家の情報を追加
  if (currentStyle) {
    styles.push(currentStyle);
  }
  
  return styles;
}
