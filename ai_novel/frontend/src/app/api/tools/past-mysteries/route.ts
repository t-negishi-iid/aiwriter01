import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface PastMystery {
  title: string;
  description: string;
  events: string[];
  sections: { [sectionName: string]: string[] };
}

export async function GET() {
  try {
    // 過去の謎パターンファイルのパス
    const filePath = path.join(process.cwd(), 'src/app/tools/basic-setting-data/data/03_details/過去の謎のパターン.md');
    
    // ファイルの内容を読み込む
    const content = await fs.readFile(filePath, 'utf8');
    
    // 過去の謎パターンを抽出する
    const pastMysteries = parsePastMysteries(content);
    
    return NextResponse.json({
      count: pastMysteries.length,
      next: null,
      previous: null,
      results: pastMysteries,
      status: 'success'
    });
  } catch (error) {
    console.error('過去の謎パターンデータの読み込みエラー:', error);
    return NextResponse.json({
      count: 0,
      next: null,
      previous: null,
      results: [],
      status: 'error',
      error: {
        message: '過去の謎パターンデータの読み込みに失敗しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      }
    }, { status: 500 });
  }
}

function parsePastMysteries(content: string): PastMystery[] {
  const lines = content.split('\n');
  const pastMysteries: PastMystery[] = [];
  
  let currentMystery: PastMystery | null = null;
  let currentSection: string | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 過去の謎タイトル（## で始まる行）を検出
    if (line.startsWith('## ')) {
      // 前の謎の情報があれば保存
      if (currentMystery) {
        pastMysteries.push(currentMystery);
      }
      
      // 新しい謎の情報を開始
      currentMystery = {
        title: line.substring(3).trim().replace(/「|」/g, ''),
        description: '',
        events: [],
        sections: {}
      };
      
      currentSection = null;
      continue;
    }
    
    // 現在の謎情報がない場合はスキップ
    if (!currentMystery) continue;
    
    // セクション（### で始まる行）を検出
    if (line.startsWith('### ')) {
      currentSection = line.substring(4).trim();
      // 新しいセクションを初期化
      if (!currentMystery.sections[currentSection]) {
        currentMystery.sections[currentSection] = [];
      }
      continue;
    }
    
    // リスト項目を検出して現在のセクションに追加
    if (currentSection && line.startsWith('- ')) {
      // 例示部分（例：...）を除去
      let item = line.substring(2).trim();
      const exampleIndex = item.indexOf('（例：');
      if (exampleIndex !== -1) {
        item = item.substring(0, exampleIndex).trim();
      }
      
      // 現在のセクションに追加
      currentMystery.sections[currentSection].push(item);
      
      // 「過去の出来事」セクションのアイテムは互換性のためeventsにも追加
      if (currentSection === '過去の出来事') {
        currentMystery.events.push(item);
      }
    }
    
    // 代表的な具体例セクションが終わり、他のセクションが始まる前の行は説明文として扱う
    if (!currentSection && !line.startsWith('#') && !line.startsWith('-') && line !== '') {
      if (!currentMystery.description) {
        currentMystery.description = line;
      }
    }
  }
  
  // 最後の謎情報があれば保存
  if (currentMystery) {
    pastMysteries.push(currentMystery);
  }
  
  return pastMysteries;
}
