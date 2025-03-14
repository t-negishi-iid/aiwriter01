import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { title, content, data: settingsData } = data;

    if (!content) {
      return NextResponse.json(
        {
          count: 0,
          next: null,
          previous: null,
          results: [],
          status: 'error',
          error: {
            message: 'コンテンツが提供されていません',
            details: '基本設定のコンテンツは必須です'
          }
        },
        { status: 400 }
      );
    }

    // 保存用のディレクトリパスを設定
    const saveDir = path.join(process.cwd(), 'data', 'basic-settings');
    
    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }

    // タイムスタンプを含むファイル名を生成
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `basic-setting-${timestamp}.md`;
    const filePath = path.join(saveDir, fileName);

    // ファイルにコンテンツを書き込む
    fs.writeFileSync(filePath, content, 'utf8');

    // JSONデータも保存（オプション）
    if (settingsData) {
      const jsonFileName = `basic-setting-${timestamp}.json`;
      const jsonFilePath = path.join(saveDir, jsonFileName);
      fs.writeFileSync(jsonFilePath, JSON.stringify(settingsData, null, 2), 'utf8');
    }

    return NextResponse.json(
      {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: fileName,
            title: title || '基本設定',
            createdAt: new Date().toISOString(),
            filePath: filePath.replace(process.cwd(), '')
          }
        ],
        status: 'success'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('基本設定の保存中にエラーが発生しました:', error);
    
    return NextResponse.json(
      {
        count: 0,
        next: null,
        previous: null,
        results: [],
        status: 'error',
        error: {
          message: '基本設定の保存中にエラーが発生しました',
          details: error instanceof Error ? error.message : '不明なエラー'
        }
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const settingsDir = path.join(process.cwd(), 'data', 'basic-settings');
    
    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(settingsDir)) {
      fs.mkdirSync(settingsDir, { recursive: true });
      return NextResponse.json(
        {
          count: 0,
          next: null,
          previous: null,
          results: [],
          status: 'success'
        },
        { status: 200 }
      );
    }

    // Markdownファイルのみを取得
    const files = fs.readdirSync(settingsDir)
      .filter(file => file.endsWith('.md'))
      .map(file => {
        const filePath = path.join(settingsDir, file);
        const stats = fs.statSync(filePath);
        
        // ファイル名から日付を抽出
        const match = file.match(/basic-setting-(.+)\.md/);
        const timestamp = match ? match[1].replace(/-/g, ':').replace('T', ' ').substring(0, 19) : '';
        
        return {
          id: file,
          title: `基本設定 (${timestamp})`,
          createdAt: stats.birthtime.toISOString(),
          filePath: filePath.replace(process.cwd(), '')
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(
      {
        count: files.length,
        next: null,
        previous: null,
        results: files,
        status: 'success'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('基本設定の取得中にエラーが発生しました:', error);
    
    return NextResponse.json(
      {
        count: 0,
        next: null,
        previous: null,
        results: [],
        status: 'error',
        error: {
          message: '基本設定の取得中にエラーが発生しました',
          details: error instanceof Error ? error.message : '不明なエラー'
        }
      },
      { status: 500 }
    );
  }
}
