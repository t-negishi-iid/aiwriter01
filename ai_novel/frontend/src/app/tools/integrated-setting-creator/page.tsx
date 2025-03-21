'use client';

// 必要なパッケージのインポート
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import styles from './page.module.css';
import { unifiedStoryApi } from '@/lib/unified-api-client';
import { Save, Check, Loader2 } from 'lucide-react';

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
  structure?: string;
  techniques?: string[];
  themes?: string;
}

// 感情要素の型定義
interface EmotionalElement {
  category: string;
  element: string;
  description?: string;
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
  subsections: PlotSubsection[];
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

const IntegratedSettingCreator: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('theme');
  const [selectedData, setSelectedData] = useState<SelectedData>({});
  const [markdownOutput, setMarkdownOutput] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [integratedSettingData, setIntegratedSettingData] = useState<IntegratedSettingData | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  // 初回ロード済みフラグを追加
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  // 小説のタイトルを保存するステート
  const [novelTitle, setNovelTitle] = useState<string>('');

  // 小説タイトルを取得する関数
  const fetchNovelTitle = useCallback(async (storyId: string) => {
    try {
      const responseData = await unifiedStoryApi.getStory(storyId);
      if (responseData && typeof responseData.title === 'string') {
        setNovelTitle(responseData.title);
      }
    } catch (error) {
      console.error('[ERROR] 小説タイトルの取得に失敗しました:', error);
    }
  }, []);

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

      // URLを更新（履歴に残さない）
      router.replace(`/tools/integrated-setting-creator?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, router]);

  // URLからタブとストーリーIDを取得し、既存のデータがあれば読み込む
  useEffect(() => {
    const storyId = searchParams.get('storyId');
    const tabId = searchParams.get('tab');

    if (tabId) {
      setActiveTab(tabId);
    }

    // 初回ロード時のみデータを取得
    if (storyId && !initialDataLoaded) {
      // API呼び出しを行う
      const fetchData = async () => {
        try {
          setIsLoading(true);

          // unifiedStoryApiを使用してデータを取得
          const responseData = await unifiedStoryApi.getIntegratedSettingCreatorData(storyId);

          console.log('APIレスポンス:', responseData);

          if (responseData && responseData.success && responseData.data) {
            const integratedData = responseData.data as IntegratedSettingData;
            setIntegratedSettingData(integratedData);

            if (integratedData.integrated_data) {
              // データベースに保存された選択状態を読み込む
              console.log('[TRACE] データベースから選択状態を読み込みました', integratedData.integrated_data);

              setSelectedData(integratedData.integrated_data);
            } else {
              // 選択状態がない場合はMarkdownから解析
              if (integratedData.basic_setting_data) {
                console.log('[TRACE] Markdownデータから解析します', integratedData.basic_setting_data.substring(0, 100));
                const parsedData = parseMarkdownData(integratedData.basic_setting_data);
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
          // データロード完了フラグを設定
          setInitialDataLoaded(true);
        }
      };

      fetchData();
    }
  }, [searchParams, parseMarkdownData, loadFromLocalStorage, initialDataLoaded]);

  useEffect(() => {
    const storyId = searchParams.get('storyId');
    if (storyId) {
      fetchNovelTitle(storyId);
    }
  }, [searchParams, fetchNovelTitle]);

  // データの更新日時を表示
  const formatLastUpdated = useCallback((data = integratedSettingData) => {
    if (data?.updated_at) {
      const updatedAt = safeParseDate(data.updated_at);
      if (updatedAt) {
        return `最終更新: ${updatedAt.toLocaleDateString()} ${updatedAt.toLocaleTimeString()}`;
      }
    }
    return '';
  }, [integratedSettingData]);

  // マークダウン出力を生成する関数
  const generateMarkdown = useCallback(() => {
    let markdown = '';

    // テーマセクション
    if (selectedData.theme?.title) {
      markdown += `## テーマ\n### ${selectedData.theme.title}\n\n`;

      if (selectedData.theme.description) {
        markdown += `#### 説明\n${selectedData.theme.description}\n\n`;
      }

      if (selectedData.theme.examples && selectedData.theme.examples.length > 0) {
        markdown += `#### 例\n`;
        selectedData.theme.examples.forEach(example => {
          markdown += `- ${example}\n`;
        });
        markdown += '\n';
      }
    }

    // 時代と場所
    if (selectedData.timePlace?.title) {
      markdown += `## 時代と場所\n### ${selectedData.timePlace.title}\n\n`;

      if (selectedData.timePlace.category) {
        markdown += `#### カテゴリ\n${selectedData.timePlace.category}\n\n`;
      }

      if (selectedData.timePlace.description) {
        markdown += `#### 説明\n${selectedData.timePlace.description}\n\n`;
      }

      if (selectedData.timePlace.content) {
        markdown += `#### 詳細\n${selectedData.timePlace.content}\n\n`;
      }

      if (selectedData.timePlace.examples && selectedData.timePlace.examples.length > 0) {
        markdown += `#### 例\n`;
        selectedData.timePlace.examples.forEach(example => {
          markdown += `- ${example}\n`;
        });
        markdown += '\n';
      }
    }

    // 世界観
    if (selectedData.worldSetting?.title) {
      markdown += `## 世界観\n### ${selectedData.worldSetting.title}\n\n`;

      if (selectedData.worldSetting.category) {
        markdown += `#### カテゴリ\n${selectedData.worldSetting.category}\n\n`;
      }

      if (selectedData.worldSetting.description) {
        markdown += `#### 説明\n${selectedData.worldSetting.description}\n\n`;
      }

      if (selectedData.worldSetting.worldView && selectedData.worldSetting.worldView.length > 0) {
        markdown += `#### 世界観要素\n`;
        selectedData.worldSetting.worldView.forEach(view => {
          markdown += `- ${view}\n`;
        });
        markdown += '\n';
      }

      if (selectedData.worldSetting.features && selectedData.worldSetting.features.length > 0) {
        markdown += `#### 特徴\n`;
        selectedData.worldSetting.features.forEach(feature => {
          markdown += `- ${feature}\n`;
        });
        markdown += '\n';
      }

      if (selectedData.worldSetting.examples && selectedData.worldSetting.examples.length > 0) {
        markdown += `#### 例\n`;
        selectedData.worldSetting.examples.forEach(example => {
          markdown += `- ${example}\n`;
        });
        markdown += '\n';
      }
    }

    // プロットパターン
    if (selectedData.plotPattern?.title) {
      markdown += `## プロットパターン\n### ${selectedData.plotPattern.title}\n\n`;

      if (selectedData.plotPattern.description) {
        markdown += `#### 説明\n${selectedData.plotPattern.description}\n\n`;
      }

      // プロットパターンの概要と構成
      if (selectedData.plotPattern.overview) {
        markdown += `#### 概要\n${selectedData.plotPattern.overview}\n\n`;
      }

      if (selectedData.plotPattern.sections && selectedData.plotPattern.sections.length > 0) {
        markdown += `#### 構成\n`;
        selectedData.plotPattern.sections.forEach(section => {
          markdown += `##### ${section.title}\n`;
          if (section.content && section.content.length > 0) {
            section.content.forEach(line => {
              markdown += `- ${line}\n`;
            });
          }

          // サブセクションがあれば追加
          if (section.subsections && section.subsections.length > 0) {
            section.subsections.forEach(subsection => {
              markdown += `###### ${subsection.title}\n`;
              if (subsection.content && subsection.content.length > 0) {
                subsection.content.forEach(line => {
                  markdown += `- ${line}\n`;
                });
              }
            });
          }

          markdown += '\n';
        });
      }
    }

    // 感情要素
    if (selectedData.emotional?.selectedElements && selectedData.emotional.selectedElements.length > 0) {
      markdown += `## 情緒的・感覚的要素\n`;

      // カテゴリごとに要素をグループ化
      const elementsByCategory: Record<string, Array<{ element: string; description?: string }>> = {};
      selectedData.emotional.selectedElements.forEach(element => {
        if (!elementsByCategory[element.category]) {
          elementsByCategory[element.category] = [];
        }
        elementsByCategory[element.category].push({
          element: element.element,
          description: element.description
        });
      });

      // カテゴリごとに表示
      Object.keys(elementsByCategory).forEach(category => {
        markdown += `### ${category}\n`;
        elementsByCategory[category].forEach(item => {
          if (item.description) {
            markdown += `- ${item.element}（${item.description}）\n`;
          } else {
            markdown += `- ${item.element}\n`;
          }
        });
        markdown += '\n';
      });

      // 代表的な活用法と効果的な使用場面を表示（カテゴリごとに1つずつ）
      if (selectedData.emotional.categories && selectedData.emotional.categories.length > 0) {
        markdown += `### 代表的な活用法と効果的な使用場面\n`;

        // カテゴリごとに1つだけ表示
        const displayedCategories = new Set<string>();

        selectedData.emotional.categories.forEach(category => {
          // 既に同じカテゴリが表示されていたらスキップ
          if (displayedCategories.has(category.title)) {
            return;
          }

          displayedCategories.add(category.title);

          markdown += `#### ${category.title}\n`;

          // 代表的な活用法
          if (category.usage) {
            markdown += `##### 代表的な活用法\n${category.usage}\n\n`;
          }

          // 効果的な使用場面
          if (category.scenes) {
            markdown += `##### 効果的な使用場面\n- ${category.scenes}\n\n`;
          }
        });
      }
    }

    // 過去の謎
    if (selectedData.pastMystery?.title) {
      markdown += `## 過去の謎\n`;

      markdown += `### ${selectedData.pastMystery.title}\n\n`;

      if (selectedData.pastMystery?.description) {
        markdown += `#### 説明\n${selectedData.pastMystery.description}\n\n`;
      }

      if (selectedData.pastMystery?.events && selectedData.pastMystery.events.length > 0) {
        markdown += `#### 過去の出来事\n`;
        selectedData.pastMystery.events.forEach(event => {
          markdown += `- ${event}\n`;
        });
        markdown += '\n';
      }

      // セクション別の謎の要素
      if (selectedData.pastMystery?.sections) {
        Object.keys(selectedData.pastMystery.sections).forEach(sectionName => {
          const sectionItems = selectedData.pastMystery?.sections[sectionName];
          if (sectionItems && sectionItems.length > 0) {
            markdown += `#### ${sectionName}\n`;
            sectionItems.forEach(item => {
              markdown += `- ${item}\n`;
            });
            markdown += '\n';
          }
        });
      }
    }

    // 文体
    if (selectedData.writingStyle) {
      markdown += `## 参考とする作風\n`;

      if (selectedData.writingStyle.author) {
        markdown += `### 参考作風\n${selectedData.writingStyle.author}\n\n`;
      }

      if (selectedData.writingStyle.title) {
        markdown += `### タイトル\n${selectedData.writingStyle.title}\n\n`;
      }

      if (selectedData.writingStyle.description) {
        markdown += `### 説明\n${selectedData.writingStyle.description}\n\n`;
      }

      if (selectedData.writingStyle.structure) {
        markdown += `### 文体と構造的特徴\n${selectedData.writingStyle.structure}\n\n`;
      }

      if (selectedData.writingStyle.techniques && selectedData.writingStyle.techniques.length > 0) {
        markdown += `### 技法\n`;
        selectedData.writingStyle.techniques.forEach(technique => {
          markdown += `- ${technique}\n`;
        });
        markdown += '\n';
      }

      if (selectedData.writingStyle.themes) {
        markdown += `### テーマ\n${selectedData.writingStyle.themes}\n\n`;
      }

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

      if (selectedData.writingStyle.narrative && selectedData.writingStyle.narrative.length > 0) {
        markdown += `### ナラティブスタイル\n`;
        selectedData.writingStyle.narrative.forEach(style => {
          markdown += `- ${style}\n`;
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
          className: "save-button-toast",
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast({
          title: "リセットエラー",
          description: `設定のリセット中にエラーが発生しました: ${errorMessage}`,
          variant: "destructive",
          className: "save-button-toast",
        });
      }
    }
  }, [toast, searchParams]);

  // 画面サイズを監視して表示状態を調整
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileView = window.innerWidth <= 768;
      setShowPreview(!isMobileView);
    };

    // 初期チェック
    checkScreenSize();

    // リサイズイベントのリスナー
    window.addEventListener('resize', checkScreenSize);

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // 設定データを保存する関数
  const saveSettings = useCallback(async () => {
    const storyId = searchParams.get('storyId');
    if (!storyId) {
      setError('ストーリーIDが指定されていません。');
      toast({
        title: "エラー",
        description: "ストーリーIDが指定されていません。",
        variant: "destructive",
        className: "save-button-toast",
      });
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      // マークダウンを生成（再生成）
      generateMarkdown();
      
      // APIリクエスト用のデータを準備
      const requestData = {
        basic_setting_data: markdownOutput,
        integrated_data: selectedData
      };
      
      console.log('[DEBUG] 保存リクエスト:', requestData);
      
      // unifiedStoryApiを使用して保存
      const responseData = await unifiedStoryApi.saveIntegratedSettingCreatorData(storyId, requestData);
      
      console.log('[DEBUG] 保存レスポンス:', responseData);
      
      if (responseData && responseData.success) {
        // 成功した場合の処理
        const savedData = responseData.data as IntegratedSettingData;
        setIntegratedSettingData(savedData);
        setSaveSuccess(true);
        
        // 成功通知とともに最終更新日時を表示
        toast({
          title: "保存しました",
          description: `設定が保存されました。${formatLastUpdated(savedData)}`,
          className: "save-button-toast",
        });
      } else {
        // エラー処理
        const errorMessage = responseData && responseData.message 
          ? String(responseData.message) 
          : "不明なエラーが発生しました";
        
        setError(errorMessage);
        setSaveSuccess(false);

        toast({
          title: "保存エラー",
          description: errorMessage,
          variant: "destructive",
          className: "save-button-toast",
        });

        console.error('[ERROR] 保存エラー:', responseData);
      }
    } catch (error) {
      console.error('[ERROR] 保存処理エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
      setError(errorMessage);
      setSaveSuccess(false);

      toast({
        title: "保存エラー",
        description: errorMessage,
        variant: "destructive",
        className: "save-button-toast",
      });
    } finally {
      // 保存状態をリセット
      setIsSaving(false);
    }
  }, [generateMarkdown, markdownOutput, searchParams, selectedData, toast, formatLastUpdated]);

  const storyId = searchParams.get('storyId');

  // ローディング状態表示部分
  const renderLoadingState = () => {
    if (isLoading) {
      return (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>データを読み込み中...</p>
        </div>
      );
    }
    return null;
  };

  const saveIntegratedSettings = () => {
    saveSettings();
  };

  useEffect(() => {
    // トースト通知のスタイルとカスタム表示位置を設定
    const style = document.createElement('style');
    style.innerHTML = `
      /* 保存ボタン下のトースト通知用スタイル */
      .save-button-toast {
        margin-top: 8px;
        margin-bottom: 16px;
      }

      /* トーストコンテナの基本スタイル */
      #save-toast-container {
        position: relative;
        min-height: 40px;
        width: 100%;
      }
    `;
    document.head.appendChild(style);

    // トースト表示のDOMが変化したときに、保存ボタン下の領域に移動させる処理
    const observer = new MutationObserver(() => {
      const toastContainer = document.querySelector('[role="region"][aria-label="Notifications"]');
      const saveToastContainer = document.getElementById('save-toast-container');

      if (toastContainer && saveToastContainer) {
        // メインのトーストコンテナから全てのトーストを保存ボタン下のコンテナに移動
        if (toastContainer.parentElement !== saveToastContainer) {
          // HTMLElementとして型を保証
          const toastContainerElement = toastContainer as HTMLElement;
          toastContainerElement.style.position = 'static';
          toastContainerElement.style.width = '100%';
          toastContainerElement.style.maxWidth = '100%';

          // すでに別の親に追加されていたら一度削除してから追加
          if (toastContainerElement.parentElement) {
            toastContainerElement.parentElement.removeChild(toastContainerElement);
          }

          saveToastContainer.appendChild(toastContainerElement);
        }
      }
    });

    // bodyの変更を監視
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // クリーンアップ関数
    return () => {
      document.head.removeChild(style);
      observer.disconnect();
    };
  }, []);

  return (
    <div className={styles.container}>
      {/* カスタムナビゲーションを追加 */}
      <CustomNavigation storyId={storyId} />

      <div className="px-4 py-6">
        <h1 className="mt-6 mb-2 text-3xl font-bold">
          {novelTitle ? `${novelTitle}：基本設定` : '統合設定クリエイター'}
        </h1>
        <p className="mb-6 text-muted-foreground">
          小説の基本設定を統合的に作成するツールです。各カテゴリから要素を選択して、世界観やプロットの基盤を構築します。
        </p>

        {/* リセットボタン */}
        <div className={styles.headerContainer}>
          <Button
            onClick={resetSettings}
            className={styles.resetButton}
          >
            すべての選択をリセット
          </Button>
        </div>

        {renderLoadingState()}

        {/* エラー表示 */}
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4 mx-4">
            <h3 className="font-bold">エラーが発生しました</h3>
            <p>{error}</p>
          </div>
        )}

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
          <div className={`${styles.selectorPanel} ${showPreview ? styles.hiddenOnMobile : ''}`}>
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

          {/* 右側：プレビュー */}
          <div className={`${styles.previewPanel} ${!showPreview ? styles.hiddenOnMobile : ''}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold" style={{ display: 'inline-block', width: '50%' }}>
                基本設定プレビュー
              </h3>
              <div className="flex flex-col items-end" style={{ width: '50%' }}>
                <Button
                  onClick={saveIntegratedSettings}
                  disabled={isSaving}
                  size="sm"
                  variant="default"
                  className="gap-1 font-semibold transition-all duration-200 hover:scale-105"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      保存済み
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      保存
                    </>
                  )}
                </Button>

                {/* トースト通知表示エリア（保存ボタンの下に配置） */}
                <div id="save-toast-container" className="w-full mt-2 mb-4">
                  <Toaster />
                </div>
              </div>
            </div>

            <div className={styles.markdownPreview}>
              <pre className="whitespace-pre-wrap text-sm font-mono">{markdownOutput}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegratedSettingCreator;
