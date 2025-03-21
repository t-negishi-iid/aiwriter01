'use client';

import { useState, useEffect } from 'react';
import styles from '../page.module.css';

interface WritingStyle {
  author: string;
  structure?: string;
  techniques?: string[];
  themes?: string;
}

interface SelectedData {
  writingStyle?: WritingStyle;
  [key: string]: unknown;
}

interface WritingStyleSelectorProps {
  selectedData: SelectedData;
  setSelectedData: (data: SelectedData) => void;
}

export default function WritingStyleSelector({ selectedData, setSelectedData }: WritingStyleSelectorProps) {
  const [writingStyles, setWritingStyles] = useState<WritingStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStyles, setExpandedStyles] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const fetchWritingStyles = async () => {
      try {
        const response = await fetch('/api/tools/writing-styles');
        if (!response.ok) {
          throw new Error('作風データの取得に失敗しました');
        }
        const data = await response.json();
        setWritingStyles(data.results);

        // 初期状態では選択されているスタイルのみを展開
        const initialExpandedState: { [key: string]: boolean } = {};
        data.results.forEach((style: WritingStyle) => {
          initialExpandedState[style.author] = selectedData.writingStyle?.author === style.author;
        });
        setExpandedStyles(initialExpandedState);

        setLoading(false);
      } catch (error) {
        console.error('作風データ取得エラー:', error);
        setError('作風データの読み込み中にエラーが発生しました。');
        setLoading(false);
      }
    };

    fetchWritingStyles();
  }, [selectedData.writingStyle?.author]);

  const handleSelectWritingStyle = (writingStyle: WritingStyle) => {
    setSelectedData({
      ...selectedData,
      writingStyle
    });

    // 選択したスタイルを展開
    setExpandedStyles(prev => ({
      ...prev,
      [writingStyle.author]: true
    }));
  };

  const toggleStyle = (author: string) => {
    setExpandedStyles(prev => ({
      ...prev,
      [author]: !prev[author]
    }));
  };

  // すべてのスタイルを開閉する関数
  const expandAllStyles = () => {
    const allExpanded: { [key: string]: boolean } = {};
    writingStyles.forEach((style) => {
      allExpanded[style.author] = true;
    });
    setExpandedStyles(allExpanded);
  };

  const collapseAllStyles = () => {
    const allCollapsed: { [key: string]: boolean } = {};
    writingStyles.forEach((style) => {
      allCollapsed[style.author] = false;
    });
    setExpandedStyles(allCollapsed);
  };

  if (loading) {
    return <div>作風データを読み込み中...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  return (
    <div>
      <h2 className={styles.sectionTitle}>参考とする作風を選択</h2>
      <p className={styles.sectionDescription}>
        物語の構成や展開の参考となる作家の作風を選択してください。文体を似せるためのものではありません。
      </p>

      <div className={styles.controlButtons}>
        <button 
          type="button"
          className={styles.controlButton}
          onClick={expandAllStyles}
        >
          カテゴリをすべて開く
        </button>
        <button 
          type="button"
          className={styles.controlButton}
          onClick={collapseAllStyles}
        >
          すべて閉じる
        </button>
      </div>

      <div>
        {writingStyles.map((style, index) => (
          <div key={index} className={styles.categoryContainer}>
            <div
              className={styles.leftAlignedHeader}
              onClick={() => toggleStyle(style.author)}
            >
              <span className={styles.expandIcon}>
                {expandedStyles[style.author] ? '▼' : '▶'}
              </span>
              <h3 className={styles.categoryTitle}>{style.author}</h3>
            </div>

            {expandedStyles[style.author] && (
              <div
                className={`${styles.optionCard} ${selectedData.writingStyle?.author === style.author ? styles.selectedOption : ''}`}
                onClick={() => handleSelectWritingStyle(style)}
              >
                {style.structure && (
                  <div className={styles.featuresList}>
                    <strong>文体と構造的特徴:</strong>
                    <p>{style.structure}</p>
                  </div>
                )}

                {style.techniques && style.techniques.length > 0 && (
                  <div className={styles.featuresList}>
                    <strong>表現技法:</strong>
                    <ul className={styles.examplesList}>
                      {style.techniques.map((technique, i) => (
                        <li key={i} className={styles.exampleItem}>{technique}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {style.themes && (
                  <div className={styles.featuresList}>
                    <strong>テーマと主題:</strong>
                    <p>{style.themes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
