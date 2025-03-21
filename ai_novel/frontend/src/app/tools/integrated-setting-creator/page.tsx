'use client';

// 必要なパッケージのインポート
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import styles from './page.module.css';
import ReactMarkdown from 'react-markdown';

// 各種セレクターコンポーネントのインポート
import ThemeSelector from './components/ThemeSelector';
import TimePlaceSelector from './components/TimePlaceSelector';
import WorldSettingSelector from './components/WorldSettingSelector';
import WritingStyleSelector from './components/WritingStyleSelector';
import EmotionalElementsSelector from './components/EmotionalElementsSelector';
import PastMysterySelector from './components/PastMysterySelector';
import PlotPatternSelector from './components/PlotPatternSelector';

// 各セレクタのタブ
const TABS = [
  { id: 'theme', label: 'テーマ（主題）' },
  { id: 'timePlace', label: '時代と場所' },
  { id: 'worldSetting', label: '作品世界と舞台設定' },
  { id: 'style', label: '参考とする作風' },
  { id: 'emotional', label: '情緒的・感覚的要素' },
  { id: 'mystery', label: '物語の背景となる過去の謎' },
  { id: 'plot', label: 'プロットパターン' },
];

// カスタムナビゲーションコンポーネント
function CustomNavigation({ storyId }: { storyId: string | null }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center py-4">
        <nav className="flex items-center">
          {storyId && (
            <Link
              href={`/stories/basic-setting-data?id=${storyId}`}
              className="text-sm font-medium transition-colors hover:text-primary flex items-center"
            >
              小説：基本設定に戻る
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

// テーマの型定義
interface SelectedTheme {
  title: string;
  description?: string;
  examples?: string[];
}

// 時代と場所の型定義
interface SelectedTimePlace {
  category: string;
  title: string;
  description?: string;
  examples: string[];
  content?: string;
}

// 世界観の型定義
interface SelectedWorldSetting {
  category: string;
  title: string;
  description?: string;
  worldView?: string[];
  features?: string[];
  examples?: string[];
}

// 文体の型定義
interface WritingStyle {
  author: string;
  title?: string;
  description?: string;
  pointOfView?: string;
  tense?: string;
  tone?: string[];
  narrative?: string[];
}

// 感情要素の型定義
interface EmotionalElement {
  category: string;
  element: string;
}

interface EmotionalCategory {
  title: string;
  usage?: string;
  scenes?: string;
}

interface SelectedEmotional {
  selectedElements: EmotionalElement[];
  categories?: EmotionalCategory[];
}

// 過去の謎の型定義
interface PastMysteryData {
  title: string;
  description: string;
  events: string[];
  sections: Record<string, string[]>;
}

// プロットパターンのサブセクション
interface PlotSubsection {
  title: string;
  content: string[];
}

// プロットパターンのセクション
interface PlotSection {
  title: string;
  content: string[];
  subsections: PlotSubsection[]; // 必須に変更
}

// プロットパターンの型定義
interface PlotPattern {
  title: string;
  filename: string;
  description?: string;
  overview: string;
  sections: PlotSection[];
}

// 選択データの総合型
interface SelectedData {
  theme?: SelectedTheme;
  timePlace?: SelectedTimePlace;
  worldSetting?: SelectedWorldSetting;
  writingStyle?: WritingStyle;
  emotional?: SelectedEmotional;
  pastMystery?: PastMysteryData;
  plotPattern?: PlotPattern;
  [key: string]: unknown;
}

// APIレスポンスの型定義
interface IntegratedSettingData {
  id: number;
  basic_setting_data: string;
  integrated_data?: SelectedData;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: IntegratedSettingData;
}

// 日付文字列から安全にDateオブジェクトに変換する関数
const safeParseDate = (dateString: string): Date | null => {
  try {
    return new Date(dateString);
  } catch (e) {
    console.error('日付の解析に失敗しました:', e);
    return null;
  }
};

// モデルの初期化関数
const createInitialPlotPattern = (): PlotPattern => {
  return {
    title: '',
    filename: '',
    overview: '',
    sections: []
  };
};

const createInitialPastMystery = (): PastMysteryData => {
  return {
    title: '',
    description: '',
    events: [],
    sections: {}
  };
};

const createInitialTimePlace = (): SelectedTimePlace => {
  return {
    category: '',
    title: '',
    examples: []
  };
};

export default function IntegratedSettingCreator() {
  const [activeTab, setActiveTab] = useState('theme');
  const [selectedData, setSelectedData] = useState<SelectedData>({});
  const [markdownOutput, setMarkdownOutput] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [integratedSettingData, setIntegratedSettingData] = useState<IntegratedSettingData | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // マークダウンデータをパースして構造化データに変換する
  const parseMarkdownData = useCallback((markdown: string): SelectedData => {
    // 初期化
    const result: SelectedData = {};

    try {
      console.log('Markdownデータを解析します:', markdown.substring(0, 100) + '...');
      // マークダウンの各セクションを処理
      const sections = markdown.split(/^##\s+/m);

      console.log('セクション数:', sections.length);
      
      // セクションがない場合は初期値を設定
      if (sections.length <= 1) {
        result.theme = { title: '未設定' };
        result.timePlace = { title: '未設定', category: '未設定', examples: [] };
        result.worldSetting = { title: '未設定', category: '未設定' };
        result.plotPattern = createInitialPlotPattern();
        return result;
      }

      for (const section of sections) {
        const lines = section.trim().split('\n');
        const sectionTitle = lines[0];

        // テーマセクション
        if (sectionTitle.includes('テーマ')) {
          if (!result.theme) result.theme = { title: '' };
          result.theme.title = lines.length > 1 ? lines[1].trim() : '';
        }

        // 時代と場所
        else if (sectionTitle.includes('時代と場所')) {
          if (!result.timePlace) result.timePlace = { title: '', category: '', examples: [] };
          result.timePlace.title = lines.length > 1 ? lines[1].trim() : '';
        }

        // 世界観
        else if (sectionTitle.includes('世界観')) {
          if (!result.worldSetting) result.worldSetting = { title: '', category: '' };
          result.worldSetting.title = lines.length > 1 ? lines[1].trim() : '';
        }

        // プロットパターン
        else if (sectionTitle.includes('プロットパターン')) {
          if (!result.plotPattern) result.plotPattern = createInitialPlotPattern();
          result.plotPattern.title = lines.length > 1 ? lines[1].trim() : '';
        }

        // 感情要素
        else if (sectionTitle.includes('感情要素')) {
          if (!result.emotional) result.emotional = { selectedElements: [] };

          const elements = lines.slice(1).filter(line => line.startsWith('- '));
          if (result.emotional.selectedElements) {
            result.emotional.selectedElements = elements.map(element => {
              const parts = element.replace('- ', '').split(': ');
              return {
                category: parts[0],
                element: parts[1] || '',
              };
            });
          }
        }

        // 過去の謎
        else if (sectionTitle.includes('過去の謎') || sectionTitle.includes('過去の秘密')) {
          if (!result.pastMystery) result.pastMystery = createInitialPastMystery();

          // イベント部分を解析
          const events: string[] = [];
          let captureEvents = false;

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('###')) {
              captureEvents = false;
              continue;
            }

            if (captureEvents && line.startsWith('-') && line.length > 1) {
              events.push(line.substring(1).trim());
            }

            if (line.includes('謎の要素') || line.includes('イベント')) {
              captureEvents = true;
            }
          }

          if (events.length > 0) {
            result.pastMystery.events = events;
          }
        }
      }

      console.log('解析結果:', result);
      return result;
    } catch (error) {
      console.error('Markdownの解析に失敗しました:', error);
      return {};
    }
  }, []);

  // ローカルストレージからデータを読み込む関数
  const loadFromLocalStorage = useCallback(() => {
    try {
      const storyId = searchParams.get('storyId');
      if (!storyId) return null;

      const storageKey = `integratedSettingData_${storyId}`;
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        const parsedData: SelectedData = JSON.parse(storedData);
        setSelectedData(parsedData);
        return parsedData;
      }
    } catch (error) {
      console.error('ローカルストレージからの読み込みに失敗しました:', error);
    }
    return null;
  }, [searchParams, setSelectedData]);

  // ローカルストレージにデータを保存する関数
  const saveToLocalStorage = useCallback((data: SelectedData) => {
    try {
      const storyId = searchParams.get('storyId');
      if (!storyId) return;

      const storageKey = `integratedSettingData_${storyId}`;
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('ローカルストレージへの保存に失敗しました:', error);
    }
  }, [searchParams]);

  // タブを変更し、URLを更新する関数
  const changeTab = useCallback((tabId: string) => {
    setActiveTab(tabId);

    const storyId = searchParams.get('storyId');
    if (storyId) {
      // 現在のURLパラメータを取得
      const params = new URLSearchParams(searchParams.toString());
      // tabパラメータを更新
      params.set('tab', tabId);

      // URLを更新（履歴に残す）
      router.push(`/tools/integrated-setting-creator?${params.toString()}`);
    }
  }, [searchParams, router]);

  // URLからタブとストーリーIDを取得し、既存のデータがあれば読み込む
  useEffect(() => {
    const storyId = searchParams.get('storyId');
    const tabId = searchParams.get('tab');

    if (tabId) {
      setActiveTab(tabId);
    }

    if (storyId) {
      // API呼び出しを行う
      const fetchData = async () => {
        try {
          setIsLoading(true);

          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_HOST || 'http://localhost:8001'}/api/stories/${storyId}/integrated-setting-creator/detail/`);

          if (!response.ok) {
            throw new Error('APIからのデータ取得に失敗しました');
          }

          const responseData: ApiResponse = await response.json();

          console.log('APIレスポンス:', responseData);

          if (responseData && responseData.data) {
            setIntegratedSettingData(responseData.data);

            if (responseData.data.integrated_data) {
              // データベースに保存された選択状態を読み込む
              console.log('[TRACE] データベースから選択状態を読み込みました', responseData.data.integrated_data);

              // 型安全な変換
              if (responseData.data.integrated_data) {
                setSelectedData(responseData.data.integrated_data);
              }
            } else {
              // 選択状態がない場合はMarkdownから解析
              if (responseData.data.basic_setting_data) {
                console.log('[TRACE] Markdownデータから解析します', responseData.data.basic_setting_data.substring(0, 100));
                const parsedData = parseMarkdownData(responseData.data.basic_setting_data);
                console.log('[TRACE] 解析結果:', parsedData);
                setSelectedData(parsedData);
              }
            }
          } else {
            // APIからの取得失敗時はローカルストレージを試す
            loadFromLocalStorage();
          }
        } catch (error) {
          console.error('[ERROR] データ取得エラー:', error);
          setError(error instanceof Error ? error.message : '不明なエラーが発生しました');

          // API取得失敗時はローカルストレージからの読み込みを試みる
          loadFromLocalStorage();
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [searchParams, parseMarkdownData, loadFromLocalStorage]);

  // マークダウン出力を生成する関数
  const generateMarkdown = useCallback(() => {
    let markdown = '';

    // テーマセクション
    if (selectedData.theme?.title) {
      markdown += `## テーマ\n${selectedData.theme.title}\n\n`;
    }

    // 時代と場所
    if (selectedData.timePlace?.title) {
      markdown += `## 時代と場所\n${selectedData.timePlace.title}\n\n`;
    }

    // 世界観
    if (selectedData.worldSetting?.title) {
      markdown += `## 世界観\n${selectedData.worldSetting.title}\n\n`;
    }

    // プロットパターン
    if (selectedData.plotPattern?.title) {
      markdown += `## プロットパターン\n${selectedData.plotPattern.title}\n\n`;

      // プロットパターンの概要と構成
      if (selectedData.plotPattern.overview) {
        markdown += `### 概要\n${selectedData.plotPattern.overview}\n\n`;
      }

      if (selectedData.plotPattern.sections && selectedData.plotPattern.sections.length > 0) {
        markdown += `### 構成\n`;
        selectedData.plotPattern.sections.forEach(section => {
          markdown += `#### ${section.title}\n`;
          if (section.content) {
            section.content.forEach(line => {
              markdown += `- ${line}\n`;
            });
          }
          markdown += '\n';
        });
      }
    }

    // 感情要素
    if (selectedData.emotional?.selectedElements && selectedData.emotional.selectedElements.length > 0) {
      markdown += `## 感情要素\n`;
      selectedData.emotional.selectedElements.forEach(element => {
        markdown += `- ${element.category}: ${element.element}\n`;
      });
      markdown += '\n';
    }

    // 過去の謎
    if (selectedData.pastMystery?.events && selectedData.pastMystery.events.length > 0) {
      markdown += `## 過去の謎\n`;
      selectedData.pastMystery.events.forEach(event => {
        markdown += `- ${event}\n`;
      });
      markdown += '\n';
    }

    // スタイル
    if (selectedData.writingStyle) {
      markdown += `## 文体と語り\n`;
      if (selectedData.writingStyle.pointOfView) {
        markdown += `### 視点\n${selectedData.writingStyle.pointOfView}\n\n`;
      }
      if (selectedData.writingStyle.tense) {
        markdown += `### 時制\n${selectedData.writingStyle.tense}\n\n`;
      }
      if (selectedData.writingStyle.tone && selectedData.writingStyle.tone.length > 0) {
        markdown += `### トーン\n`;
        selectedData.writingStyle.tone.forEach(tone => {
          markdown += `- ${tone}\n`;
        });
        markdown += '\n';
      }
    }

    // マークダウン出力をセット
    setMarkdownOutput(markdown);

    return markdown;
  }, [selectedData]);

  // 選択データが変更されたらローカルストレージに保存
  useEffect(() => {
    if (Object.keys(selectedData).length > 0) {
      saveToLocalStorage(selectedData);
      generateMarkdown();
    }
  }, [selectedData, generateMarkdown, saveToLocalStorage]);

  // 統合設定データをリセットする関数
  const resetSettings = useCallback(() => {
    // 確認ダイアログを表示
    if (window.confirm('設定をリセットしますか？この操作は元に戻せません。')) {
      try {
        // ローカルストレージをクリア
        const storyId = searchParams.get('storyId');
        if (storyId) {
          localStorage.removeItem(`integratedSettingData_${storyId}`);
        }
        
        // 状態をリセット
        setSelectedData({
          theme: undefined,
          timePlace: createInitialTimePlace(),
          worldSetting: undefined,
          writingStyle: undefined,
          emotional: undefined,
          pastMystery: createInitialPastMystery(),
          plotPattern: createInitialPlotPattern()
        });
        setMarkdownOutput('');
        setIntegratedSettingData(null);
        setSaveSuccess(false);
        
        toast({
          title: "リセット完了",
          description: "すべての設定がリセットされました。",
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast({
          title: "リセットエラー",
          description: `設定のリセット中にエラーが発生しました: ${errorMessage}`,
          variant: "destructive",
        });
      }
    }
  }, [searchParams]);

  // 画面サイズの監視
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileView = window.innerWidth <= 768;
      setShowPreview(isMobileView);
    };

    // 初期チェック
    checkScreenSize();

    // リサイズイベントのリスナーを追加
    window.addEventListener('resize', checkScreenSize);

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // 設定データを保存する関数
  const saveSettings = async () => {
    const storyId = searchParams.get('storyId');
    if (!storyId) {
      toast({
        title: "エラー",
        description: "ストーリーIDが指定されていません。URLにstoryIdパラメータが必要です。",
        variant: "destructive",
      });
      return;
    }

    try {
      // マークダウンを生成（再生成）
      generateMarkdown();

      console.log('[TRACE] 保存処理開始:', {
        storyId,
        markdownLength: markdownOutput.length,
        selectedDataKeys: Object.keys(selectedData)
      });

      // 型安全のために深いコピーを作成
      const safeSelectedData: SelectedData = JSON.parse(JSON.stringify(selectedData));

      // APIリクエストを送信
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_HOST || 'http://localhost:8001'}/api/settings/integrated/store/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          story_id: storyId,
          basic_setting_data: markdownOutput,
          integrated_data: safeSelectedData
        }),
      });

      // レスポンスをJSON形式に変換
      const responseData: ApiResponse = await response.json();
      console.log('[TRACE] 保存レスポンス:', JSON.stringify(responseData).substring(0, 500));

      // レスポンス処理
      if (response.ok && responseData.success) {
        // 保存成功の処理
        if (responseData.data) {
          setIntegratedSettingData(responseData.data);
          setSaveSuccess(true);
        }

        toast({
          title: "保存しました",
          description: "基本設定が正常に保存されました。",
        });
        console.log('[TRACE] 保存成功');
      } else {
        // エラー処理
        const errorMessage = responseData.message || "不明なエラーが発生しました";
        setError(errorMessage);
        setSaveSuccess(false);

        toast({
          title: "保存エラー",
          description: errorMessage,
          variant: "destructive",
        });

        console.error('[ERROR] 保存エラー:', responseData);
      }
    } catch (error) {
      // 例外処理
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);

      toast({
        title: "システムエラー",
        description: `保存処理中に例外が発生しました: ${errorMessage}`,
        variant: "destructive",
      });

      console.error('[ERROR] 保存例外:', error);
    }
  };

  // データの更新日時を表示
  const formatLastUpdated = () => {
    if (integratedSettingData?.updated_at) {
      const updatedAt = safeParseDate(integratedSettingData.updated_at);
      if (updatedAt) {
        return `最終更新: ${updatedAt.toLocaleDateString()} ${updatedAt.toLocaleTimeString()}`;
      }
    }
    return '';
  };

  const storyId = searchParams.get('storyId');

  // ローディング中の表示
  const renderLoadingState = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="ml-2">データを読み込み中...</p>
        </div>
      );
    }
    return null;
  };

  // エラー表示
  const renderErrorState = () => {
    if (error) {
      return (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
          <h3 className="font-bold">エラーが発生しました</h3>
          <p>{error}</p>
        </div>
      );
    }
    return null;
  };

  const regenerateMarkdown = () => {
    generateMarkdown();
  };

  const saveIntegratedSettings = () => {
    saveSettings();
  };

  return (
    <div className={styles.container}>
      {/* カスタムナビゲーションを追加 */}
      <CustomNavigation storyId={storyId} />

      <div className="px-4 py-6">
        <h1 className="mt-6 mb-2 text-3xl font-bold">統合設定クリエイター</h1>
        <p className="mb-6 text-muted-foreground">
          小説の基本設定を統合的に作成するツールです。各カテゴリから要素を選択して、世界観やプロットの基盤を構築します。
        </p>

        {/* デバッグ情報 - 開発時のみ表示 */}
        {/* <div className="p-4 mb-4 border border-gray-300 bg-gray-50 text-gray-700 rounded">
          <p className="font-semibold">デバッグ情報</p>
          <p>isLoading: {isLoading ? 'true' : 'false'}</p>
          <p>error: {error || 'なし'}</p>
          <p>storyId: {storyId || 'なし'}</p>
          <p>activeTab: {activeTab}</p>
          <p>selectedData: {Object.keys(selectedData).length > 0 ? 'あり' : 'なし'}</p>
        </div> */}

        {/* エラー表示 */}
        {error && (
          <div className="p-4 mb-4 border border-red-500 bg-red-50 text-red-700 rounded">
            <p className="font-semibold">エラーが発生しました</p>
            <p>{error}</p>
          </div>
        )}

        {/* セーブステータス表示 */}
        {saveSuccess && integratedSettingData && (
          <div className="p-4 mb-4 border border-green-500 bg-green-50 text-green-700 rounded">
            <p>設定が保存されました。{formatLastUpdated()}</p>
          </div>
        )}

        {/* リセットボタン */}
        <div className="flex justify-end mb-4">
          <Button
            onClick={resetSettings}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            すべての選択をリセット
          </Button>
        </div>

        {renderLoadingState()}
        {renderErrorState()}
      </div>

      {/* タブナビゲーション */}
      <div className={styles.tabsContainer}>
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
            onClick={() => changeTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className={styles.contentContainer}>
        {/* 左側：セレクタ内容 */}
        <div className={styles.selectorPanel}>
          {activeTab === 'theme' && (
            <ThemeSelector
              selectedData={selectedData}
              setSelectedData={setSelectedData}
            />
          )}
          {activeTab === 'timePlace' && (
            <TimePlaceSelector
              selectedData={selectedData}
              setSelectedData={setSelectedData}
            />
          )}
          {activeTab === 'worldSetting' && (
            <WorldSettingSelector
              selectedData={selectedData}
              setSelectedData={setSelectedData}
            />
          )}
          {activeTab === 'style' && (
            <WritingStyleSelector
              selectedData={selectedData}
              setSelectedData={setSelectedData}
            />
          )}
          {activeTab === 'emotional' && (
            <EmotionalElementsSelector
              selectedData={selectedData}
              setSelectedData={setSelectedData}
            />
          )}
          {activeTab === 'mystery' && (
            <PastMysterySelector
              selectedData={selectedData}
              setSelectedData={setSelectedData}
            />
          )}
          {activeTab === 'plot' && (
            <PlotPatternSelector
              selectedData={selectedData}
              setSelectedData={setSelectedData}
            />
          )}
        </div>

        {/* 右側：プレビュー内容 */}
        <div className={styles.previewPanel}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">マークダウンプレビュー</h3>
            <div className="space-x-2">
              <Button
                onClick={regenerateMarkdown}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                再生成
              </Button>
              <Button
                onClick={saveIntegratedSettings}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                保存
              </Button>
            </div>
          </div>
          <div className={styles.markdownPreview}>
            <ReactMarkdown>{markdownOutput}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
