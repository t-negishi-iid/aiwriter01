import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface PastMystery {
  title: string;
  description: string;
  events: string[];
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
  let collectingEvents = false;
  
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
        events: []
      };
      
      collectingEvents = false;
      continue;
    }
    
    // 現在の謎情報がない場合はスキップ
    if (!currentMystery) continue;
    
    // 過去の出来事セクション（### 過去の出来事）を検出
    if (line === '### 過去の出来事') {
      collectingEvents = true;
      continue;
    } else if (line.startsWith('### ')) {
      // 他のセクションの場合は過去の出来事の収集を停止
      collectingEvents = false;
      continue;
    }
    
    // 過去の出来事のリスト項目を検出
    if (collectingEvents && line.startsWith('- ')) {
      // 例示部分（例：...）を除去
      let event = line.substring(2).trim();
      const exampleIndex = event.indexOf('（例：');
      if (exampleIndex !== -1) {
        event = event.substring(0, exampleIndex).trim();
      }
      currentMystery.events.push(event);
    }
    
    // 代表的な具体例セクションが終わり、過去の出来事セクションが始まる前の行は説明文として扱う
    if (!collectingEvents && !line.startsWith('#') && !line.startsWith('-') && line !== '') {
      if (!currentMystery.description) {
        currentMystery.description = line;
      }
    }
  }
  
  // 最後の謎の情報を追加
  if (currentMystery) {
    pastMysteries.push(currentMystery);
  }
  
  return pastMysteries;
}
