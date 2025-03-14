import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface PlotSubsection {
  title: string;
  content: string[];
}

interface PlotSection {
  title: string;
  content: string[];
  subsections: PlotSubsection[];
}

interface PlotPattern {
  title: string;
  filename: string;
  overview: string;
  sections: PlotSection[];
}

export async function GET() {
  try {
    // プロットパターンファイルのディレクトリパス
    const dirPath = path.join(process.cwd(), 'src/app/tools/basic-setting-data/data/04_plots');
    
    // ディレクトリ内のファイル一覧を取得
    const files = await fs.readdir(dirPath);
    
    // マークダウンファイルのみをフィルタリング
    const mdFiles = files.filter(file => file.endsWith('.md'));
    
    // 各ファイルの内容を解析
    const plotPatterns: PlotPattern[] = [];
    
    for (const file of mdFiles) {
      const filePath = path.join(dirPath, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      const pattern = parsePlotPattern(content, file);
      if (pattern) {
        plotPatterns.push(pattern);
      }
    }
    
    return NextResponse.json({
      count: plotPatterns.length,
      next: null,
      previous: null,
      results: plotPatterns,
      status: 'success'
    });
  } catch (error) {
    console.error('プロットパターンデータの読み込みエラー:', error);
    return NextResponse.json({
      count: 0,
      next: null,
      previous: null,
      results: [],
      status: 'error',
      error: {
        message: 'プロットパターンデータの読み込みに失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      }
    }, { status: 500 });
  }
}

function parsePlotPattern(content: string, filename: string): PlotPattern | null {
  const lines = content.split('\n');
  
  // タイトルを抽出（# で始まる最初の行）
  const titleLine = lines.find(line => line.startsWith('# '));
  if (!titleLine) return null;
  
  const title = titleLine.substring(2).trim();
  let overview = '';
  const sections: PlotSection[] = [];
  
  let currentSection: PlotSection | null = null;
  let currentSubsection: PlotSubsection | null = null;
  let isInOverview = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 概要セクションを検出
    if (line === '## 概要') {
      isInOverview = true;
      continue;
    }
    
    // 概要セクション内の内容を収集
    if (isInOverview && line && !line.startsWith('##')) {
      overview += line + ' ';
      continue;
    }
    
    // 新しいセクションの開始を検出
    if (line.startsWith('## ') && line !== '## 概要') {
      isInOverview = false;
      
      // 前のセクションがあれば保存
      if (currentSection) {
        sections.push(currentSection);
      }
      
      // 新しいセクションを開始
      currentSection = {
        title: line.substring(3).trim(),
        content: [],
        subsections: []
      };
      
      currentSubsection = null;
      continue;
    }
    
    // 新しいサブセクションの開始を検出
    if (line.startsWith('### ') && currentSection) {
      // 前のサブセクションがあれば保存
      if (currentSubsection) {
        currentSection.subsections.push(currentSubsection);
      }
      
      // 新しいサブセクションを開始
      currentSubsection = {
        title: line.substring(4).trim(),
        content: []
      };
      
      continue;
    }
    
    // セクション内の内容を収集（サブセクションがない場合）
    if (currentSection && !currentSubsection && line && !line.startsWith('#')) {
      currentSection.content.push(line);
    }
    
    // サブセクション内の内容を収集
    if (currentSection && currentSubsection && line && !line.startsWith('#')) {
      currentSubsection.content.push(line);
    }
  }
  
  // 最後のサブセクションを追加
  if (currentSection && currentSubsection) {
    currentSection.subsections.push(currentSubsection);
  }
  
  // 最後のセクションを追加
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return {
    title,
    filename,
    overview: overview.trim(),
    sections
  };
}
