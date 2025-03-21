'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { basicSettingDataApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import ThemeSelector from './components/ThemeSelector';
import TimePlaceSelector from './components/TimePlaceSelector';
import WorldSettingSelector from './components/WorldSettingSelector';
import WritingStyleSelector from './components/WritingStyleSelector';
import EmotionalElementsSelector from './components/EmotionalElementsSelector';
import PastMysterySelector from './components/PastMysterySelector';
import PlotPatternSelector from './components/PlotPatternSelector';
import type { BasicSettingData } from './types';

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
              href={`/tools/basic-setting-data?storyId=${storyId}`}
              className="text-sm font-medium transition-colors hover:text-primary flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              小説基本設定に戻る
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default function BasicSettingData() {
  const [activeTab, setActiveTab] = useState('theme');
  const [selectedData, setSelectedData] = useState<BasicSettingData>({});
  const [markdownOutput, setMarkdownOutput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // マークダウンデータを解析する関数
  const parseMarkdownData = useCallback((markdown: string) => {
    // 既存のデータ構造をコピー
    const parsedData: BasicSettingData = { ...selectedData };

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

      console.log('解析されたデータ:', parsedData);
      return parsedData;
    } catch (error) {
      console.error('Markdownデータの解析エラー:', error);
      return parsedData;
    }
  }, [selectedData]);

  // URLからストーリーIDを取得し、既存のデータがあれば読み込む
  const fetchData = useCallback(async () => {
    const storyId = searchParams.get('storyId');
    if (!storyId) return;

    try {
      setIsLoading(true);
      console.log(`[TRACE] 基本設定データ取得開始: storyId=${storyId} - ${new Date().toISOString()}`);

      // 基本設定データを取得
      const response = await basicSettingDataApi.getBasicSettingData(storyId);
      console.log(`[TRACE] 基本設定データ取得完了 - ${new Date().toISOString()}`);
      console.log(`[TRACE] レスポンスデータ:`, JSON.stringify(response).substring(0, 200) + '...');

      if (response.success) {
        // データが存在する場合は設定
        if (response.data && response.data.basic_setting_data) {
          setSelectedData(parseMarkdownData(response.data.basic_setting_data));
          console.log(`[TRACE] データをステートに設定 - ${new Date().toISOString()}`);
          useToast({
            title: "データを読み込みました",
            description: "既存の設定データを読み込みました。",
          });
        } else {
          console.log(`[TRACE] 基本設定データが空です - ${new Date().toISOString()}`);
          useToast({
            title: "新規作成モード",
            description: "データが見つからないため、新規作成モードで開始します。",
          });
        }
      } else {
        console.log(`[TRACE] データ取得失敗: ${response.message} - ${new Date().toISOString()}`);
        useToast({
          title: "エラーが発生しました",
          description: response.message || "データの取得に失敗しました。",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`[TRACE] データ取得エラー: ${error} - ${new Date().toISOString()}`);
      setError('データの取得に失敗しました');
      useToast({
        title: "エラーが発生しました",
        description: "データの取得に失敗しました。ローカルデータを使用します。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, parseMarkdownData]);

  // 選択データをローカルストレージから読み込む
  useEffect(() => {
    const storyId = searchParams.get('storyId');
    if (!storyId) return;

    const storageKey = `basicSettingData_${storyId}`;
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        setSelectedData(JSON.parse(savedData));
      } catch (error) {
        console.error('保存データの解析エラー:', error);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 選択されたデータからMarkdownを生成する関数
  const generateMarkdown = useCallback(() => {
    let markdown = `# 小説の基本設定\n\n`;
    
    // テーマ
    markdown += `## テーマ\n`;
    if (selectedData.theme?.selectedTheme) {
      markdown += `${selectedData.theme.selectedTheme}\n\n`;
    } else {
      markdown += `(未設定)\n\n`;
    }
    
    // 時代と場所
    markdown += `## 時代と場所\n`;
    if (selectedData.timePlace?.selectedTimePlace) {
      markdown += `${selectedData.timePlace.selectedTimePlace}\n\n`;
    } else {
      markdown += `(未設定)\n\n`;
    }
    
    // 世界観設定
    markdown += `## 世界観設定\n`;
    if (selectedData.worldSetting?.selectedWorldSetting) {
      markdown += `${selectedData.worldSetting.selectedWorldSetting}\n\n`;
    } else {
      markdown += `(未設定)\n\n`;
    }
    
    // 文体
    markdown += `## 文体\n`;
    if (selectedData.writingStyle?.selectedStyle) {
      markdown += `${selectedData.writingStyle.selectedStyle}\n\n`;
    } else {
      markdown += `(未設定)\n\n`;
    }
    
    // 感情要素
    markdown += `## 感情要素\n`;
    if (selectedData.emotionalElements?.selectedElements && selectedData.emotionalElements.selectedElements.length > 0) {
      selectedData.emotionalElements.selectedElements.forEach(element => {
        markdown += `${element}\n`;
      });
      markdown += `\n`;
    } else {
      markdown += `(未設定)\n\n`;
    }
    
    // 過去の謎
    markdown += `## 過去の謎\n`;
    if (selectedData.pastMystery?.events && selectedData.pastMystery.events.length > 0) {
      selectedData.pastMystery.events.forEach(event => {
        markdown += `${event}\n`;
      });
      markdown += `\n`;
    } else {
      markdown += `(未設定)\n\n`;
    }
    
    // プロットパターン
    markdown += `## プロットパターン\n`;
    if (selectedData.plotPattern?.title) {
      markdown += `${selectedData.plotPattern.title}\n`;
      if (selectedData.plotPattern.description) {
        markdown += `${selectedData.plotPattern.description}\n\n`;
      } else {
        markdown += `\n`;
      }
    } else {
      markdown += `(未設定)\n\n`;
    }
    
    setMarkdownOutput(markdown);
    return markdown;
  }, [selectedData]);

  // 選択データが変更されたときに更新
  useEffect(() => {
    const storyId = searchParams.get('storyId');
    if (!storyId) return;

    const storageKey = `basicSettingData_${storyId}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(selectedData));
    } catch (error) {
      console.error('データの保存エラー:', error);
    }

    // データからMarkdownを生成
    generateMarkdown();
  }, [selectedData, generateMarkdown, searchParams]);

  // レスポンシブ対応
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener('resize', checkMobileView);

    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  }, []);

  // タブを変更する関数
  const changeTab = (tabId: string) => {
    setActiveTab(tabId);
    setShowPreview(false);
  };

  // 選択データを更新する関数
  const updateSelectedData = (category: string, data: any) => {
    setSelectedData(prev => ({
      ...prev,
      [category]: data
    }));
  };

  // データを保存する関数
  const saveData = async () => {
    const storyId = searchParams.get('storyId');
    if (!storyId) {
      useToast({
        title: "エラー",
        description: "ストーリーIDが見つかりません。",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      console.log(`[TRACE] 基本設定データ保存開始: storyId=${storyId} - ${new Date().toISOString()}`);
      
      const response = await basicSettingDataApi.saveBasicSettingData(storyId, {
        basic_setting_data: markdownOutput
      });
      
      console.log(`[TRACE] 基本設定データ保存完了 - ${new Date().toISOString()}`);
      console.log('保存レスポンス:', response);

      if (response.success) {
        setSaveSuccess(true);
        useToast({
          title: "保存完了",
          description: "基本設定データが保存されました。",
        });
      } else {
        setSaveError(response.message || '保存に失敗しました');
        useToast({
          title: "保存エラー",
          description: response.message || "データの保存に失敗しました。",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('データ保存エラー:', error);
      setSaveError('データの保存に失敗しました');
      useToast({
        title: "保存エラー",
        description: "データの保存に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // プレビューを表示・非表示切り替え
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  // ストーリーIDを取得
  const storyId = searchParams.get('storyId');

  // アクティブなタブコンポーネントをレンダリング
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'theme':
        return <ThemeSelector data={selectedData.theme} onChange={(data) => updateSelectedData('theme', data)} />;
      case 'timePlace':
        return <TimePlaceSelector data={selectedData.timePlace} onChange={(data) => updateSelectedData('timePlace', data)} />;
      case 'worldSetting':
        return <WorldSettingSelector data={selectedData.worldSetting} onChange={(data) => updateSelectedData('worldSetting', data)} />;
      case 'style':
        return <WritingStyleSelector data={selectedData.writingStyle} onChange={(data) => updateSelectedData('writingStyle', data)} />;
      case 'emotional':
        return <EmotionalElementsSelector data={selectedData.emotionalElements} onChange={(data) => updateSelectedData('emotionalElements', data)} />;
      case 'mystery':
        return <PastMysterySelector data={selectedData.pastMystery} onChange={(data) => updateSelectedData('pastMystery', data)} />;
      case 'plot':
        return <PlotPatternSelector data={selectedData.plotPattern} onChange={(data) => updateSelectedData('plotPattern', data)} />;
      default:
        return <ThemeSelector data={selectedData.theme} onChange={(data) => updateSelectedData('theme', data)} />;
    }
  };

  // モバイルビューの場合は、タブとコンテンツを縦に並べる
  if (isMobileView) {
    return (
      <div className={styles.container}>
        <CustomNavigation storyId={storyId} />
        <div className={styles.mobileContainer}>
          <div className={styles.tabListMobile}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.tabMobile} ${activeTab === tab.id ? styles.activeTabMobile : ''}`}
                onClick={() => changeTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className={styles.contentMobile}>
            {isLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>データを読み込み中...</p>
              </div>
            ) : error ? (
              <div className={styles.errorContainer}>
                <p>{error}</p>
              </div>
            ) : showPreview ? (
              <div className={styles.previewContainer}>
                <div className={styles.previewHeader}>
                  <h2>プレビュー</h2>
                  <button onClick={togglePreview} className={styles.previewButton}>
                    編集に戻る
                  </button>
                </div>
                <div className={styles.markdownPreview}>
                  <pre>{markdownOutput}</pre>
                </div>
              </div>
            ) : (
              renderActiveTab()
            )}
          </div>
          <div className={styles.actionsMobile}>
            <button
              className={styles.previewButtonMobile}
              onClick={togglePreview}
            >
              {showPreview ? '編集に戻る' : 'プレビューを表示'}
            </button>
            <button
              className={styles.saveButtonMobile}
              onClick={saveData}
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
          {saveSuccess && <p className={styles.successMessage}>データが正常に保存されました！</p>}
          {saveError && <p className={styles.errorMessage}>エラー: {saveError}</p>}
        </div>
      </div>
    );
  }

  // デスクトップビューでは、タブを左側に、コンテンツを右側に表示
  return (
    <div className={styles.container}>
      <CustomNavigation storyId={storyId} />
      <div className={styles.content}>
        <div className={styles.tabList}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => changeTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
          <div className={styles.tabActions}>
            <button
              className={styles.previewButton}
              onClick={togglePreview}
            >
              {showPreview ? '編集に戻る' : 'プレビューを表示'}
            </button>
            <button
              className={styles.saveButton}
              onClick={saveData}
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
          {saveSuccess && <p className={styles.successMessage}>データが正常に保存されました！</p>}
          {saveError && <p className={styles.errorMessage}>エラー: {saveError}</p>}
        </div>
        <div className={styles.tabContent}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>データを読み込み中...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <p>{error}</p>
            </div>
          ) : showPreview ? (
            <div className={styles.previewContainer}>
              <h2>プレビュー</h2>
              <div className={styles.markdownPreview}>
                <pre>{markdownOutput}</pre>
              </div>
            </div>
          ) : (
            renderActiveTab()
          )}
        </div>
      </div>
    </div>
  );
}
