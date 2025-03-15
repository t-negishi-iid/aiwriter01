import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface MysterySection {
  title: string;
  content: string[];
}

interface MysteryPattern {
  title: string;
  examples: string[];
  pastEvents: string[];
  currentEffects: string[];
  resolutionPaths: string[];
}

export async function GET() {
  try {
    // 過去の謎パターンファイルのパス
    const filePath = path.join(process.cwd(), 'src/app/tools/basic-setting-data/data/03_details/過去の謎のパターン.md');

    // ファイルの内容を読み込む
    const content = await fs.readFile(filePath, 'utf8');

    // 過去の謎パターンを抽出する
    const patterns = parseMysteryPatterns(content);

    return NextResponse.json({
      count: patterns.length,
      next: null,
      previous: null,
      results: patterns,
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

function parseMysteryPatterns(content: string): MysteryPattern[] {
  const lines = content.split('\n');
  const patterns: MysteryPattern[] = [];

  let currentPattern: MysteryPattern | null = null;
  let currentSection: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // パターン（## で始まる行）を検出
    if (line.startsWith('## ')) {
      // 前のパターンの情報があれば保存
      if (currentPattern) {
        patterns.push(currentPattern);
      }

      // 新しいパターンの情報を開始
      currentPattern = {
        title: line.substring(3).trim(),
        examples: [],
        pastEvents: [],
        currentEffects: [],
        resolutionPaths: []
      };

      currentSection = null;
      continue;
    }

    // 現在のパターン情報がない場合はスキップ
    if (!currentPattern) continue;

    // セクション（### で始まる行）を検出
    if (line.startsWith('### ')) {
      currentSection = line.substring(4).trim();
      continue;
    }

    // セクションがない場合はスキップ
    if (!currentSection) continue;

    // リスト項目を検出
    if (line.startsWith('- ')) {
      const content = line.substring(2).trim();

      if (currentSection === '代表的な具体例') {
        currentPattern.examples.push(content);
      } else if (currentSection === '過去の出来事' || currentSection === '過去の出来事の性質') {
        currentPattern.pastEvents.push(content);
      } else if (currentSection === '現在への影響') {
        currentPattern.currentEffects.push(content);
      } else if (currentSection === '解決への道筋') {
        currentPattern.resolutionPaths.push(content);
      }
    }
  }

  // 最後のパターンの情報を追加
  if (currentPattern) {
    patterns.push(currentPattern);
  }

  return patterns;
}
