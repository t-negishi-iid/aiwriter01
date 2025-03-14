'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import ThemeSelector from './components/ThemeSelector';
import WorldSettingSelector from './components/WorldSettingSelector';
import TimePlaceSelector from './components/TimePlaceSelector';
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

export default function IntegratedSettingCreator() {
  const [activeTab, setActiveTab] = useState('theme');
  const [selectedData, setSelectedData] = useState<any>({});
  const [markdownOutput, setMarkdownOutput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // 選択データをローカルストレージから読み込む
  useEffect(() => {
    const savedData = localStorage.getItem('integratedSettingData');
    if (savedData) {
      try {
        setSelectedData(JSON.parse(savedData));
      } catch (error) {
        console.error('保存データの解析エラー:', error);
      }
    }
  }, []);

  // 選択データが変更されたらローカルストレージに保存
  useEffect(() => {
    if (Object.keys(selectedData).length > 0) {
      localStorage.setItem('integratedSettingData', JSON.stringify(selectedData));
      generateMarkdown();
    }
  }, [selectedData]);

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
    let markdown = '';

    // テーマ
    if (selectedData.theme) {
      markdown += '# テーマ（主題）\n\n';
      markdown += `## ${selectedData.theme.title}\n`;
      markdown += `${selectedData.theme.description}\n\n`;
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
      markdown += '# 時代と場所\n\n';
      markdown += `## ${selectedData.timePlace.title}\n\n`;
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
      markdown += '# 作品世界と舞台設定\n\n';
      markdown += `## ${selectedData.worldSetting.title}\n`;
      markdown += `### 基本的な世界観\n`;
      if (selectedData.worldSetting.worldView && selectedData.worldSetting.worldView.length > 0) {
        selectedData.worldSetting.worldView.forEach((item: string) => {
          markdown += `- ${item}\n`;
        });
        markdown += '\n';
      }

      markdown += `### 特徴的な要素\n`;
      if (selectedData.worldSetting.features && selectedData.worldSetting.features.length > 0) {
        selectedData.worldSetting.features.forEach((item: string) => {
          markdown += `- ${item}\n`;
        });
        markdown += '\n';
      }

      markdown += `### 代表的な作品例\n`;
      if (selectedData.worldSetting.examples && selectedData.worldSetting.examples.length > 0) {
        selectedData.worldSetting.examples.forEach((example: string) => {
          markdown += `- ${example}\n`;
        });
        markdown += '\n';
      }
    }

    // 参考とする作風
    if (selectedData.writingStyle) {
      markdown += '# 参考とする作風\n';
      markdown += `## ${selectedData.writingStyle.author}\n`;
      markdown += `### 文体と構造的特徴\n`;
      markdown += `${selectedData.writingStyle.structure || '未定義'}\n\n`;

      markdown += `### 表現技法\n`;
      if (selectedData.writingStyle.techniques && selectedData.writingStyle.techniques.length > 0) {
        selectedData.writingStyle.techniques.forEach((technique: string) => {
          markdown += `- ${technique}\n`;
        });
        markdown += '\n';
      }

      markdown += `### テーマと主題\n`;
      markdown += `${selectedData.writingStyle.themes || '未定義'}\n\n`;
    }

    // 情緒的・感覚的要素
    if (selectedData.emotionalElements && selectedData.emotionalElements.selectedElements) {
      markdown += '# 情緒的・感覚的要素\n\n';

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
        markdown += `## ${category}\n`;
        markdown += `### 主な要素\n`;

        groupedElements[category].forEach((element: any) => {
          const description = element.description ? `（${element.description}）` : '';
          markdown += `- ${element.element}${description}\n`;
        });
        markdown += '\n';
        
        // カテゴリの詳細情報を取得
        const categoryData = selectedData.emotionalElements.categories.find((cat: any) => cat.title === category);
        
        if (categoryData) {
          // 代表的な活用法
          if (categoryData.usage) {
            markdown += `### 代表的な活用法\n`;
            markdown += `${categoryData.usage}\n\n`;
          }
          
          // 効果的な使用場面
          if (categoryData.effectiveScenes && categoryData.effectiveScenes.length > 0) {
            markdown += `### 効果的な使用場面\n`;
            categoryData.effectiveScenes.forEach((scene: string) => {
              markdown += `- ${scene}\n`;
            });
            markdown += '\n';
          }
        }
      });
    }

    // 物語の背景となる過去の謎
    if (selectedData.pastMystery) {
      markdown += '# 物語の背景となる過去の謎\n\n';
      markdown += `## 「${selectedData.pastMystery.title}」\n`;
      markdown += `### 過去の出来事\n`;
      if (selectedData.pastMystery.events && selectedData.pastMystery.events.length > 0) {
        selectedData.pastMystery.events.forEach((event: string) => {
          markdown += `- ${event}\n`;
        });
        markdown += '\n';
      }
    }

    // プロットパターン
    if (selectedData.plotPattern) {
      markdown += '# プロットパターン\n';
      markdown += `「${selectedData.plotPattern.title}」\n\n`;

      markdown += `## 概要\n\n`;
      markdown += `${selectedData.plotPattern.overview}\n\n`;

      // すべてのセクションを処理
      if (selectedData.plotPattern.sections && selectedData.plotPattern.sections.length > 0) {
        selectedData.plotPattern.sections.forEach((section: any) => {
          markdown += `## ${section.title}\n\n`;
          
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
              markdown += `### ${subsection.title}\n\n`;
              
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

  // データの保存
  const saveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const response = await fetch('/api/basic-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '基本設定',
          content: markdownOutput,
          data: selectedData
        }),
      });

      if (!response.ok) {
        throw new Error('保存に失敗しました');
      }

      setSaveSuccess(true);
    } catch (error) {
      console.error('保存エラー:', error);
      setSaveError('保存中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsSaving(false);
    }
  };

  // データのリセット
  const resetData = () => {
    if (window.confirm('すべての選択をリセットしてもよろしいですか？')) {
      localStorage.removeItem('integratedSettingData');
      setSelectedData({});
      setSaveSuccess(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* タブナビゲーション */}
      {isMobileView ? (
        <div className={styles.mobileTabsContainer}>
          <select 
            className={styles.mobileTabSelect}
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
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
              onClick={() => setActiveTab(tab.id)}
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
