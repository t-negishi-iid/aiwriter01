import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface WorldSetting {
  title: string;
  worldView?: string[];
  features?: string[];
  examples?: string[];
}

interface Category {
  title: string;
  settings: WorldSetting[];
}

export async function GET() {
  try {
    // ワールド設定フォルダのパス
    const folderPath = path.join(process.cwd(), 'src/app/tools/basic-setting-data/data/02_world_setting');
    
    // フォルダ内のファイル一覧を取得
    const files = await fs.readdir(folderPath);
    
    // マークダウンファイルのみをフィルタリング
    const mdFiles = files.filter(file => file.endsWith('.md') && !file.startsWith('.'));
    
    // カテゴリ情報を格納する配列
    const categories: Category[] = [];
    
    // 各ファイルを処理
    for (const file of mdFiles) {
      // ファイルパスを作成
      const filePath = path.join(folderPath, file);
      
      // ファイルの内容を読み込む
      const content = await fs.readFile(filePath, 'utf8');
      
      // ファイルがカテゴリリストの場合はスキップ
      if (file === '作品世界と舞台設定のパターン.md') {
        continue;
      }
      
      // ファイルからカテゴリとワールド設定を抽出
      const category = parseWorldSettingFile(content);
      if (category) {
        categories.push(category);
      }
    }
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('作品世界と舞台設定データの読み込みエラー:', error);
    return NextResponse.json(
      { error: '作品世界と舞台設定データの読み込みに失敗しました' },
      { status: 500 }
    );
  }
}

function parseWorldSettingFile(content: string): Category | null {
  const lines = content.split('\n');
  let category: Category | null = null;
  let currentSetting: WorldSetting | null = null;
  let currentSection: string | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // カテゴリの見出し（# で始まる行）を検出
    if (line.startsWith('# ')) {
      // 新しいカテゴリを開始
      category = {
        title: line.substring(2).trim(),
        settings: []
      };
      currentSetting = null;
      currentSection = null;
      continue;
    }
    
    // カテゴリがない場合はスキップ
    if (!category) continue;
    
    // 選択肢の見出し（## で始まる行）を検出
    if (line.startsWith('## ')) {
      // 新しい選択肢を開始
      currentSetting = {
        title: line.substring(3).trim(),
        worldView: [],
        features: [],
        examples: []
      };
      
      category.settings.push(currentSetting);
      currentSection = null;
      continue;
    }
    
    // 現在の選択肢がない場合はスキップ
    if (!currentSetting) continue;
    
    // セクションの見出し（### で始まる行）を検出
    if (line.startsWith('### ')) {
      currentSection = line.substring(4).trim();
      continue;
    }
    
    // リスト項目（- で始まる行）を検出
    if (line.startsWith('- ') && currentSection) {
      const item = line.substring(2).trim();
      
      if (currentSection === '基本的な世界観') {
        currentSetting.worldView?.push(item);
      } else if (currentSection === '特徴的な要素') {
        currentSetting.features?.push(item);
      } else if (currentSection === '代表的な作品例') {
        currentSetting.examples?.push(item);
      }
    }
  }
  
  return category;
}
