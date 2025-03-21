'use client';

import { useState, useEffect } from 'react';
import styles from '../page.module.css';

interface TimePlaceSetting {
  title: string;
  examples: string[];
  content?: string; // コンテンツフィールドを追加
}

interface Category {
  title: string;
  settings: TimePlaceSetting[];
}

interface SelectedData {
  timePlace?: {
    category: string;
    title: string;
    examples: string[];
    content?: string;
  };
  [key: string]: unknown;
}

interface TimePlaceSelectorProps {
  selectedData: SelectedData;
  setSelectedData: (data: SelectedData) => void;
}

export default function TimePlaceSelector({ selectedData, setSelectedData }: TimePlaceSelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const fetchTimePlaceSettings = async () => {
      try {
        const response = await fetch('/api/tools/time-place-settings');
        if (!response.ok) {
          throw new Error('時代と場所データの取得に失敗しました');
        }
        const data = await response.json();
        setCategories(data.results);

        // 初期状態では全てのカテゴリーを展開
        const initialExpandedState: { [key: string]: boolean } = {};
        data.results.forEach((category: Category) => {
          initialExpandedState[category.title] = true;
        });
        setExpandedCategories(initialExpandedState);

        setLoading(false);
      } catch (error) {
        console.error('時代と場所データ取得エラー:', error);
        setError('時代と場所データの読み込み中にエラーが発生しました。');
        setLoading(false);
      }
    };

    fetchTimePlaceSettings();
  }, []);

  const handleSelectTimePlaceSetting = (category: string, setting: TimePlaceSetting) => {
    setSelectedData({
      ...selectedData,
      timePlace: {
        category,
        title: setting.title,
        examples: setting.examples,
        content: setting.content || '' // コンテンツも保存
      }
    });
  };

  const toggleCategory = (categoryTitle: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryTitle]: !prev[categoryTitle]
    }));
  };

  // すべてのカテゴリを開閉する関数
  const expandAllCategories = () => {
    const allExpanded: { [key: string]: boolean } = {};
    categories.forEach((category) => {
      allExpanded[category.title] = true;
    });
    setExpandedCategories(allExpanded);
  };

  const collapseAllCategories = () => {
    const allCollapsed: { [key: string]: boolean } = {};
    categories.forEach((category) => {
      allCollapsed[category.title] = false;
    });
    setExpandedCategories(allCollapsed);
  };

  if (loading) {
    return <div>時代と場所データを読み込み中...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  return (
    <div>
      <h2 className={styles.sectionTitle}>時代と場所を選択</h2>
      <p className={styles.sectionDescription}>
        物語の舞台となる時代と場所を選択してください。これにより物語の雰囲気や制約が大きく変わります。
      </p>

      <div className={styles.controlButtons}>
        <button 
          type="button"
          className={styles.controlButton}
          onClick={expandAllCategories}
        >
          カテゴリをすべて開く
        </button>
        <button 
          type="button"
          className={styles.controlButton}
          onClick={collapseAllCategories}
        >
          すべて閉じる
        </button>
      </div>

      {categories.map((category, categoryIndex) => (
        <div key={categoryIndex} className={styles.categoryContainer}>
          <div
            className={styles.leftAlignedHeader}
            onClick={() => toggleCategory(category.title)}
          >
            <span className={styles.expandIcon}>
              {expandedCategories[category.title] ? '▼' : '▶'}
            </span>
            <h3 className={styles.categoryTitle}>{category.title}</h3>
          </div>

          {expandedCategories[category.title] && (
            <div className={styles.settingsContainer}>
              {category.settings.map((setting, settingIndex) => (
                <div
                  key={settingIndex}
                  className={`${styles.optionCard} ${selectedData.timePlace?.title === setting.title ? styles.selectedOption : ''
                    }`}
                  onClick={() => handleSelectTimePlaceSetting(category.title, setting)}
                >
                  <h4 className={styles.optionTitle}>{setting.title}</h4>

                  {setting.examples && setting.examples.length > 0 && (
                    <div className={styles.examplesListContainer}>
                      <strong>代表的な作品例:</strong>
                      <ul className={styles.examplesList}>
                        {setting.examples.map((example, i) => (
                          <li key={i} className={styles.exampleItem}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* 選択された設定のプレビュー */}
      {selectedData.timePlace && (
        <div className={styles.previewContainer}>
          <h3 className={styles.previewTitle}>選択された設定</h3>
          <div className={styles.previewContent}>
            <p><strong>カテゴリ:</strong> {selectedData.timePlace.category}</p>
            <p><strong>設定:</strong> {selectedData.timePlace.title}</p>
            {selectedData.timePlace.content && (
              <div className={styles.contentPreview}>
                <pre>{selectedData.timePlace.content}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
