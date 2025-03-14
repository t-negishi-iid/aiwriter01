'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

// 各セレクタのデータ型
interface ThemeData {
  title: string;
  description: string;
  examples: string[];
}

interface WorldSettingData {
  title: string;
  description: string;
  examples: string[];
}

interface TimePlaceData {
  title: string;
  description: string;
  examples: string[];
}

interface WritingStyleData {
  title: string;
  description: string;
  examples: string[];
}

interface ElementOption {
  text: string;
  description: string;
}

interface ElementCategory {
  title: string;
  options: ElementOption[];
  usage: string;
  effectiveScenes: string[];
}

interface PastMysteryData {
  title: string;
  description: string;
  examples: string[];
}

interface PlotPatternData {
  title: string;
  description: string;
  examples: string[];
}

// 選択データの型
interface SelectedData {
  theme?: ThemeData;
  worldSetting?: WorldSettingData;
  timePlace?: TimePlaceData;
  writingStyle?: WritingStyleData;
  emotionalElements?: {
    categories: ElementCategory[];
    selectedElements: {
      category: string;
      element: string;
    }[];
  };
  pastMystery?: PastMysteryData;
  plotPattern?: PlotPatternData;
}

// ステップの型
interface Step {
  id: number;
  title: string;
  path: string;
  completed: boolean;
}

export default function BasicSettingCreator() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedData, setSelectedData] = useState<SelectedData>({});
  const [markdownOutput, setMarkdownOutput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ステップの定義
  const steps: Step[] = [
    { id: 1, title: 'テーマ（主題）', path: '/tools/theme-selector', completed: !!selectedData.theme },
    { id: 2, title: '時代と場所', path: '/tools/world-setting-selector', completed: !!selectedData.worldSetting },
    { id: 3, title: '作品世界と舞台設定', path: '/tools/time-place-selector', completed: !!selectedData.timePlace },
    { id: 4, title: '参考とする作風', path: '/tools/writing-style-selector', completed: !!selectedData.writingStyle },
    { id: 5, title: '情緒的・感覚的要素', path: '/tools/emotional-elements-selector', completed: !!selectedData.emotionalElements },
    { id: 6, title: '物語の背景となる過去の謎', path: '/tools/past-mystery-selector', completed: !!selectedData.pastMystery },
    { id: 7, title: 'プロットパターン', path: '/tools/plot-pattern-selector', completed: !!selectedData.plotPattern },
  ];

  // 選択データをローカルストレージから読み込む
  useEffect(() => {
    const savedData = localStorage.getItem('basicSettingData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setSelectedData(parsedData);
      } catch (error) {
        console.error('保存されたデータの解析に失敗しました:', error);
      }
    }
  }, []);

  // 選択データが変更されたらローカルストレージに保存
  useEffect(() => {
    if (Object.keys(selectedData).length > 0) {
      localStorage.setItem('basicSettingData', JSON.stringify(selectedData));
    }
  }, [selectedData]);

  // 選択データからMarkdownを生成
  useEffect(() => {
    generateMarkdown();
  }, [selectedData]);

  // 特定のステップに移動
  const navigateToStep = (stepId: number) => {
    const step = steps.find(s => s.id === stepId);
    if (step) {
      router.push(step.path);
    }
  };

  // Markdownの生成
  const generateMarkdown = () => {
    let markdown = '# 基本設定\n\n';

    // テーマ
    if (selectedData.theme) {
      markdown += '## テーマ（主題）\n\n';
      markdown += `### ${selectedData.theme.title}\n\n`;
      markdown += `${selectedData.theme.description}\n\n`;
      if (selectedData.theme.examples && selectedData.theme.examples.length > 0) {
        markdown += '#### 例\n\n';
        selectedData.theme.examples.forEach(example => {
          markdown += `- ${example}\n`;
        });
        markdown += '\n';
      }
    }

    // 時代と場所
    if (selectedData.worldSetting) {
      markdown += '## 時代と場所\n\n';
      markdown += `### ${selectedData.worldSetting.title}\n\n`;
      markdown += `${selectedData.worldSetting.description}\n\n`;
      if (selectedData.worldSetting.examples && selectedData.worldSetting.examples.length > 0) {
        markdown += '#### 例\n\n';
        selectedData.worldSetting.examples.forEach(example => {
          markdown += `- ${example}\n`;
        });
        markdown += '\n';
      }
    }

    // 作品世界と舞台設定
    if (selectedData.timePlace) {
      markdown += '## 作品世界と舞台設定\n\n';
      markdown += `### ${selectedData.timePlace.title}\n\n`;
      markdown += `${selectedData.timePlace.description}\n\n`;
      if (selectedData.timePlace.examples && selectedData.timePlace.examples.length > 0) {
        markdown += '#### 例\n\n';
        selectedData.timePlace.examples.forEach(example => {
          markdown += `- ${example}\n`;
        });
        markdown += '\n';
      }
    }

    // 参考とする作風
    if (selectedData.writingStyle) {
      markdown += '## 参考とする作風\n\n';
      markdown += `### ${selectedData.writingStyle.title}\n\n`;
      markdown += `${selectedData.writingStyle.description}\n\n`;
      if (selectedData.writingStyle.examples && selectedData.writingStyle.examples.length > 0) {
        markdown += '#### 例\n\n';
        selectedData.writingStyle.examples.forEach(example => {
          markdown += `- ${example}\n`;
        });
        markdown += '\n';
      }
    }

    // 情緒的・感覚的要素
    if (selectedData.emotionalElements && selectedData.emotionalElements.selectedElements.length > 0) {
      markdown += '## 情緒的・感覚的要素\n\n';
      
      // カテゴリごとにグループ化
      const groupedElements: { [key: string]: string[] } = {};
      selectedData.emotionalElements.selectedElements.forEach(item => {
        if (!groupedElements[item.category]) {
          groupedElements[item.category] = [];
        }
        
        // 要素の説明を取得
        const category = selectedData.emotionalElements?.categories.find(c => c.title === item.category);
        const elementOption = category?.options.find(o => o.text === item.element);
        let elementText = item.element;
        if (elementOption?.description) {
          elementText += `（${elementOption.description}）`;
        }
        
        groupedElements[item.category].push(elementText);
      });
      
      // カテゴリごとに出力
      Object.keys(groupedElements).forEach(category => {
        markdown += `### ${category}\n\n`;
        
        // 選択された要素
        markdown += '#### 選択された要素\n\n';
        groupedElements[category].forEach(element => {
          markdown += `- ${element}\n`;
        });
        markdown += '\n';
        
        // カテゴリの詳細情報
        const categoryInfo = selectedData.emotionalElements?.categories.find(c => c.title === category);
        if (categoryInfo) {
          markdown += '#### 代表的な活用法\n\n';
          markdown += `${categoryInfo.usage}\n\n`;
          
          markdown += '#### 効果的な使用場面\n\n';
          categoryInfo.effectiveScenes.forEach(scene => {
            markdown += `- ${scene}\n`;
          });
          markdown += '\n';
        }
      });
    }

    // 物語の背景となる過去の謎
    if (selectedData.pastMystery) {
      markdown += '## 物語の背景となる過去の謎\n\n';
      markdown += `### ${selectedData.pastMystery.title}\n\n`;
      markdown += `${selectedData.pastMystery.description}\n\n`;
      if (selectedData.pastMystery.examples && selectedData.pastMystery.examples.length > 0) {
        markdown += '#### 例\n\n';
        selectedData.pastMystery.examples.forEach(example => {
          markdown += `- ${example}\n`;
        });
        markdown += '\n';
      }
    }

    // プロットパターン
    if (selectedData.plotPattern) {
      markdown += '## プロットパターン\n\n';
      markdown += `### ${selectedData.plotPattern.title}\n\n`;
      markdown += `${selectedData.plotPattern.description}\n\n`;
      if (selectedData.plotPattern.examples && selectedData.plotPattern.examples.length > 0) {
        markdown += '#### 例\n\n';
        selectedData.plotPattern.examples.forEach(example => {
          markdown += `- ${example}\n`;
        });
        markdown += '\n';
      }
    }

    setMarkdownOutput(markdown);
  };

  // データの保存
  const saveBasicSetting = async () => {
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
      // 保存成功後、ローカルストレージをクリア
      localStorage.removeItem('basicSettingData');
      setSelectedData({});
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
      localStorage.removeItem('basicSettingData');
      setSelectedData({});
      setSaveSuccess(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <h2 className={styles.sidebarTitle}>基本設定作成ステップ</h2>
        <div className={styles.stepsList}>
          {steps.map((step) => (
            <div
              key={step.id}
              className={`${styles.stepItem} ${currentStep === step.id ? styles.active : ''} ${step.completed ? styles.completed : ''}`}
              onClick={() => navigateToStep(step.id)}
            >
              <div className={styles.stepNumber}>{step.id}</div>
              <div className={styles.stepTitle}>{step.title}</div>
              {step.completed && <div className={styles.completedIcon}>✓</div>}
            </div>
          ))}
        </div>
        <div className={styles.actions}>
          <button 
            className={styles.resetButton} 
            onClick={resetData}
          >
            リセット
          </button>
          <button 
            className={styles.saveButton} 
            onClick={saveBasicSetting}
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
      <div className={styles.content}>
        <h1 className={styles.title}>基本設定作成</h1>
        <p className={styles.description}>
          各ステップを順番に進めて、物語の基本設定を作成しましょう。
          左側のメニューから各セレクタに移動し、選択を行ってください。
          すべての選択が完了したら、「保存」ボタンをクリックして設定を保存できます。
        </p>
        
        <div className={styles.previewContainer}>
          <h2 className={styles.previewTitle}>プレビュー</h2>
          <div className={styles.markdownPreview}>
            <pre>{markdownOutput}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
