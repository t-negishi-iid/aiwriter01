'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import ThemeSelector from './components/ThemeSelector';
import WorldSettingSelector from './components/WorldSettingSelector';
import TimePlaceSelector from './components/TimePlaceSelector';
import WritingStyleSelector from './components/WritingStyleSelector';
import EmotionalElementsSelector from './components/EmotionalElementsSelector';
import PastMysterySelector from './components/PastMysterySelector';
import PlotPatternSelector from './components/PlotPatternSelector';
import { basicSettingDataApi } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';

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
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              小説：基本設定に戻る
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default function IntegratedSettingCreator() {
  const [activeTab, setActiveTab] = useState('theme');
  const [selectedData, setSelectedData] = useState<any>({});
  const [markdownOutput, setMarkdownOutput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [integratedSettingData, setIntegratedSettingData] = useState<any>({});
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // 選択データをローカルストレージから読み込む
  useEffect(() => {
    const storyId = searchParams.get('storyId');
    if (!storyId) return;

    const storageKey = `integratedSettingData_${storyId}`;
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        setSelectedData(JSON.parse(savedData));
      } catch (error) {
        console.error('保存データの解析エラー:', error);
      }
    }
  }, [searchParams]);

  // URLからタブとストーリーIDを取得し、既存のデータがあれば読み込む
  useEffect(() => {
    const storyId = searchParams.get('storyId');
    // URLからタブパラメータを取得し、存在すれば対応するタブをアクティブにする
    const tabParam = searchParams.get('tab');
    if (tabParam && TABS.some(tab => tab.id === tabParam)) {
      setActiveTab(tabParam);
    }

    if (!storyId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log(`[TRACE] 統合設定データ取得開始: storyId=${storyId} - ${new Date().toISOString()}`);

        // 統合設定データを取得
        const response = await basicSettingDataApi.getBasicSettingData(storyId);
        console.log(`[TRACE] 統合設定データ取得完了 - ${new Date().toISOString()}`);
        console.log(`[TRACE] レスポンスデータ:`, JSON.stringify(response).substring(0, 200) + '...');

        if (response.success) {
          // データが存在する場合は設定
          if (response.data && response.data.basic_setting_data) {
            setIntegratedSettingData(response.data);
            setSelectedData(parseMarkdownData(response.data.basic_setting_data));
            console.log(`[TRACE] データをステートに設定 - ${new Date().toISOString()}`);
            toast({
              title: "データを読み込みました",
              description: "既存の設定データを読み込みました。",
            });
          } else {
            console.log(`[TRACE] 基本設定データが空です - ${new Date().toISOString()}`);
            toast({
              title: "新規作成モード",
              description: "データが見つからないため、新規作成モードで開始します。",
            });
          }
        } else {
          console.log(`[TRACE] データ取得失敗: ${response.message} - ${new Date().toISOString()}`);
          toast({
            title: "エラーが発生しました",
            description: response.message || "データの取得に失敗しました。",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error(`[TRACE] データ取得エラー: ${error} - ${new Date().toISOString()}`);
        setError('データの取得に失敗しました');
        toast({
          title: "エラーが発生しました",
          description: "データの取得に失敗しました。ローカルデータを使用します。",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchParams, toast]);

  // Markdownデータを解析して構造化データに変換する関数
  const parseMarkdownData = (markdown: string) => {
    // 既存のデータ構造をコピー
    const parsedData = { ...selectedData };

    try {
      console.log('Markdownデータを解析します:', markdown.substring(0, 100) + '...');

      // 各セクションを抽出
      const sections = markdown.split('## ').filter(Boolean);

      for (const section of sections) {
        const lines = section.split('\n').filter(Boolean);
        const sectionTitle = lines[0].trim();

        // テーマセクション
        if (sectionTitle.includes('テーマ')) {
          if (!parsedData.theme) parsedData.theme = {};
          parsedData.theme.selectedTheme = lines.length > 1 ? lines[1].trim() : '';
        }

        // 時代と場所
        else if (sectionTitle.includes('時代と場所')) {
          if (!parsedData.timePlace) parsedData.timePlace = {};
          parsedData.timePlace.selectedTimePlace = lines.length > 1 ? lines[1].trim() : '';
        }

        // 世界観
        else if (sectionTitle.includes('世界観')) {
          if (!parsedData.worldSetting) parsedData.worldSetting = {};
          parsedData.worldSetting.selectedWorldSetting = lines.length > 1 ? lines[1].trim() : '';
        }

        // プロットパターン
        else if (sectionTitle.includes('プロットパターン')) {
          if (!parsedData.plotPattern) parsedData.plotPattern = {};
          parsedData.plotPattern.title = lines.length > 1 ? lines[1].trim() : '';
        }

        // 感情要素
        else if (sectionTitle.includes('感情要素')) {
          if (!parsedData.emotionalElements) parsedData.emotionalElements = { selectedElements: [] };

          const elements = lines.slice(1).filter(line => line.startsWith('- '));
          parsedData.emotionalElements.selectedElements = elements.map(element => {
            const parts = element.replace('- ', '').split(': ');
            return {
              category: parts[0],
              element: parts.length > 1 ? parts[1] : '',
              description: parts.length > 2 ? parts[2] : ''
            };
          });
        }

        // 過去の謎
        else if (sectionTitle.includes('過去の謎')) {
          if (!parsedData.pastMystery) parsedData.pastMystery = { events: [] };

          const events = lines.slice(1).filter(line => /^\d+\./.test(line));
          parsedData.pastMystery.events = events.map(event =>
            event.replace(/^\d+\.\s*/, '').trim()
          );
        }
      }

      console.log('解析完了:', Object.keys(parsedData));
      return parsedData;
    } catch (error) {
      console.error('Markdownデータの解析エラー:', error);
      return parsedData;
    }
  };

  // 選択データが変更されたらローカルストレージに保存
  useEffect(() => {
    if (Object.keys(selectedData).length > 0) {
      const storyId = searchParams.get('storyId');
      if (storyId) {
        const storageKey = `integratedSettingData_${storyId}`;
        localStorage.setItem(storageKey, JSON.stringify(selectedData));
        console.log(`[TRACE] storyId=${storyId}のデータをローカルストレージに保存 - キー: ${storageKey}`);
      }
      generateMarkdown();
    }
  }, [selectedData, searchParams]);

  // 画面サイズの監視
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileView(window.innerWidth <= 768);
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

  // Markdownの生成
  const generateMarkdown = () => {
    let markdown = '# 基本設定データ\n\n';

    // テーマ
    if (selectedData.theme) {
      markdown += '## テーマ\n';
      markdown += `${selectedData.theme.title}\n\n`;
      if (selectedData.theme.description) {
        markdown += `${selectedData.theme.description}\n\n`;
      }
      if (selectedData.theme.examples && selectedData.theme.examples.length > 0) {
        markdown += '### 代表作品\n';
        selectedData.theme.examples.forEach((example: string) => {
          markdown += `- ${example}\n`;
        });
        markdown += '\n';
      }
    }

    // 時代と場所
    if (selectedData.timePlace) {
      markdown += '## 時代と場所\n';
      markdown += `${selectedData.timePlace.title}\n\n`;
      if (selectedData.timePlace.examples && selectedData.timePlace.examples.length > 0) {
        markdown += '### 代表作品\n';
        selectedData.timePlace.examples.forEach((example: string) => {
          markdown += `- ${example}\n`;
        });
        markdown += '\n';
      }
    }

    // 作品世界と舞台設定
    if (selectedData.worldSetting) {
      markdown += '## 世界観\n';
      markdown += `${selectedData.worldSetting.title}\n\n`;

      if (selectedData.worldSetting.worldView && selectedData.worldSetting.worldView.length > 0) {
        markdown += '### 基本的な世界観\n';
        selectedData.worldSetting.worldView.forEach((item: string) => {
          markdown += `- ${item}\n`;
        });
        markdown += '\n';
      }

      if (selectedData.worldSetting.features && selectedData.worldSetting.features.length > 0) {
        markdown += '### 特徴的な要素\n';
        selectedData.worldSetting.features.forEach((item: string) => {
          markdown += `- ${item}\n`;
        });
        markdown += '\n';
      }

      if (selectedData.worldSetting.examples && selectedData.worldSetting.examples.length > 0) {
        markdown += '### 代表作品\n';
        selectedData.worldSetting.examples.forEach((example: string) => {
          markdown += `- ${example}\n`;
        });
        markdown += '\n';
      }
    }

    // 参考とする作風
    if (selectedData.writingStyle) {
      markdown += '## 参考とする作風\n';
      markdown += `### ${selectedData.writingStyle.author}\n`;

      if (selectedData.writingStyle.structure) {
        markdown += '#### 文体と構造的特徴\n';
        markdown += `${selectedData.writingStyle.structure}\n\n`;
      }

      if (selectedData.writingStyle.techniques && selectedData.writingStyle.techniques.length > 0) {
        markdown += '#### 表現技法\n';
        selectedData.writingStyle.techniques.forEach((technique: string) => {
          markdown += `- ${technique}\n`;
        });
        markdown += '\n';
      }

      if (selectedData.writingStyle.themes) {
        markdown += '#### テーマと主題\n';
        markdown += `${selectedData.writingStyle.themes}\n\n`;
      }
    }

    // 情緒的・感覚的要素
    if (selectedData.emotionalElements && 
        selectedData.emotionalElements.selectedElements && 
        selectedData.emotionalElements.selectedElements.length > 0) {
      markdown += '## 情緒的・感覚的要素\n';

      // カテゴリごとにグループ化
      const groupedElements: { [key: string]: any[] } = {};
      selectedData.emotionalElements.selectedElements.forEach((item: any) => {
        if (!groupedElements[item.category]) {
          groupedElements[item.category] = [];
        }
        groupedElements[item.category].push(item);
      });

      // カテゴリごとに出力
      Object.keys(groupedElements).forEach(category => {
        groupedElements[category].forEach((element: any) => {
          const description = element.description ? `: ${element.description}` : '';
          markdown += `- ${category}: ${element.element}${description}\n`;
        });
      });
      markdown += '\n';
      
      // 各カテゴリの「代表的な活用法」と「効果的な使用場面」を追加
      if (selectedData.emotionalElements.categories && selectedData.emotionalElements.categories.length > 0) {
        selectedData.emotionalElements.categories.forEach((category: any) => {
          if (category.usage) {
            markdown += `### ${category.title}の代表的な活用法\n`;
            markdown += `${category.usage}\n\n`;
          }
          
          if (category.effectiveScenes && category.effectiveScenes.length > 0) {
            markdown += `### ${category.title}の効果的な使用場面\n`;
            category.effectiveScenes.forEach((scene: string) => {
              markdown += `- ${scene}\n`;
            });
            markdown += '\n';
          }
        });
      }
    }

    // 過去の謎
    if (selectedData.pastMystery) {
      markdown += '## 過去の謎\n';
      
      if (selectedData.pastMystery.title) {
        markdown += `「${selectedData.pastMystery.title}」\n\n`;
      }
      
      if (selectedData.pastMystery.description) {
        markdown += `${selectedData.pastMystery.description}\n\n`;
      }
      
      // sectionsが存在する場合（新しい形式）
      if (selectedData.pastMystery.sections) {
        Object.entries(selectedData.pastMystery.sections).forEach(([sectionName, items]) => {
          markdown += `### ${sectionName}\n`;
          
          if (Array.isArray(items)) {
            items.forEach((item, index) => {
              markdown += `${index + 1}. ${item}\n`;
            });
          }
          
          markdown += '\n';
        });
      }
      // 後方互換性のため、eventsがある場合は従来通り表示
      else if (selectedData.pastMystery.events && selectedData.pastMystery.events.length > 0) {
        markdown += '### 過去の出来事\n';
        selectedData.pastMystery.events.forEach((event: string, index: number) => {
          markdown += `${index + 1}. ${event}\n`;
        });
        markdown += '\n';
      }
    }

    // プロットパターン
    if (selectedData.plotPattern) {
      markdown += '## プロットパターン\n';
      markdown += `${selectedData.plotPattern.title}\n\n`;

      if (selectedData.plotPattern.description) {
        markdown += `${selectedData.plotPattern.description}\n\n`;
      }

      if (selectedData.plotPattern.sections && selectedData.plotPattern.sections.length > 0) {
        selectedData.plotPattern.sections.forEach((section: any) => {
          markdown += `### ${section.title}\n\n`;

          // セクションの内容を追加
          if (section.content && section.content.length > 0) {
            section.content.forEach((contentLine: string) => {
              markdown += `${contentLine}\n`;
            });
            markdown += '\n';
          }

          // サブセクションを追加
          if (section.subsections && section.subsections.length > 0) {
            section.subsections.forEach((subsection: any) => {
              markdown += `#### ${subsection.title}\n\n`;

              if (subsection.content && subsection.content.length > 0) {
                subsection.content.forEach((contentLine: string) => {
                  markdown += `${contentLine}\n`;
                });
                markdown += '\n';
              }
            });
          }
        });
      }
    }

    setMarkdownOutput(markdown);
  };

  // 設定データを保存する関数
  const saveSettings = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    const storyId = searchParams.get('storyId');
    if (!storyId) {
      setSaveError('ストーリーIDが見つかりません。URLパラメータを確認してください。');
      setIsSaving(false);
      return;
    }

    try {
      // バックエンドAPIを呼び出してデータを保存
      console.log(`[TRACE] 統合設定データ保存開始: storyId=${storyId} - ${new Date().toISOString()}`);
      console.log(`[TRACE] 統合設定クリエイターAPI呼び出し前 - ${new Date().toISOString()}`);
      
      // バックエンドAPIを直接呼び出す
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_HOST || 'http://localhost:8001'}/api/stories/${storyId}/integrated-setting-creator/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          basic_setting_data: markdownOutput
        }),
        credentials: 'include', // Cookie（セッション）を含める
      });

      console.log(`[TRACE] 統合設定クリエイターAPI呼び出し後 - ${new Date().toISOString()}`);
      
      // レスポンスが正常でない場合はエラーを投げる
      if (!response.ok) {
        const errorText = await response.text();
        console.error('APIエラー:', response.status, errorText);
        throw new Error(`APIエラー: ${response.status} ${errorText}`);
      }
      
      // レスポンスをJSON形式に変換
      const responseData = await response.json();
      console.log('[TRACE] 保存レスポンス:', JSON.stringify(responseData).substring(0, 500)); // デバッグ用

      // レスポンス処理
      if (!responseData || responseData.success === false) {
        // エラーメッセージの取得
        const errorMessage = responseData?.message || 
          (responseData?.error ? responseData.error : '保存に失敗しました');
        throw new Error(errorMessage);
      }

      toast({
        title: "基本設定を保存しました",
        description: "変更が正常に保存されました",
      });

      // 保存完了の通知
      setSaveSuccess(true);
      setSaveError(null);
      setIsSaving(false);
    } catch (error) {
      console.error('保存エラー:', error);
      setSaveError(`保存中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
      toast({
        title: "エラーが発生しました",
        description: "基本設定の保存に失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // データのリセット
  const resetData = () => {
    if (window.confirm('すべての選択をリセットしてもよろしいですか？')) {
      const storyId = searchParams.get('storyId');
      if (storyId) {
        const storageKey = `integratedSettingData_${storyId}`;
        localStorage.removeItem(storageKey);
      }
      setSelectedData({});
      setSaveSuccess(false);
    }
  };

  const storyId = searchParams.get('storyId');

  return (
    <div className={styles.container}>
      {/* カスタムナビゲーションを追加 */}
      <CustomNavigation storyId={storyId} />

      {/* タブナビゲーション */}
      {isMobileView ? (
        <div className={styles.mobileTabsContainer}>
          <select
            className={styles.mobileTabSelect}
            value={activeTab}
            onChange={(e) => changeTab(e.target.value)}
            aria-label="タブを選択"
            title="タブを選択"
          >
            {TABS.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>

          <button
            className={`${styles.previewToggleButton} ${showPreview ? styles.activePreviewButton : ''}`}
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? '編集に戻る' : 'プレビュー表示'}
          </button>
        </div>
      ) : (
        <div className={styles.tabsContainer}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => changeTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className={styles.contentContainer}>
        {/* 左側：セレクタ内容 */}
        {(!isMobileView || (isMobileView && !showPreview)) && (
          <div className={styles.selectorPanel}>
            {activeTab === 'theme' && <ThemeSelector selectedData={selectedData} setSelectedData={setSelectedData} />}
            {activeTab === 'timePlace' && <TimePlaceSelector selectedData={selectedData} setSelectedData={setSelectedData} />}
            {activeTab === 'worldSetting' && <WorldSettingSelector selectedData={selectedData} setSelectedData={setSelectedData} />}
            {activeTab === 'style' && <WritingStyleSelector selectedData={selectedData} setSelectedData={setSelectedData} />}
            {activeTab === 'emotional' && <EmotionalElementsSelector selectedData={selectedData} setSelectedData={setSelectedData} />}
            {activeTab === 'mystery' && <PastMysterySelector selectedData={selectedData} setSelectedData={setSelectedData} />}
            {activeTab === 'plot' && <PlotPatternSelector selectedData={selectedData} setSelectedData={setSelectedData} />}
          </div>
        )}

        {/* 右側：プレビュー */}
        {(!isMobileView || (isMobileView && showPreview)) && (
          <div className={styles.previewPanel}>
            <h2 className={styles.sectionTitle}>基本設定プレビュー</h2>
            <div className={styles.markdownPreview}>
              <div>{markdownOutput}</div>
            </div>
            <div className={styles.buttonContainer}>
              <button
                className={styles.resetButton}
                onClick={resetData}
              >
                リセット
              </button>
              <button
                className={styles.saveButton}
                onClick={saveSettings}
                disabled={isSaving || Object.keys(selectedData).length === 0}
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
            </div>
            {saveSuccess && (
              <div className={styles.successMessage}>
                基本設定が正常に保存されました！
              </div>
            )}
            {saveError && (
              <div className={styles.errorMessage}>
                {saveError}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
