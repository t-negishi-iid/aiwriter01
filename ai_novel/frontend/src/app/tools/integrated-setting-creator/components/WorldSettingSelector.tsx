'use client';

import { useState, useEffect } from 'react';
import styles from '../page.module.css';

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

interface SelectedData {
  worldSetting?: {
    title: string;
    category: string;
    worldView?: string[];
    features?: string[];
    examples?: string[];
  };
  [key: string]: unknown;
}

interface WorldSettingSelectorProps {
  selectedData: SelectedData;
  setSelectedData: (data: SelectedData) => void;
}

export default function WorldSettingSelector({ selectedData, setSelectedData }: WorldSettingSelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const fetchWorldSettings = async () => {
      try {
        const response = await fetch('/api/tools/world-settings');
        if (!response.ok) {
          throw new Error('作品世界と舞台設定データの取得に失敗しました');
        }
        const data = await response.json();
        setCategories(data);

        // 初期状態では選択されているカテゴリのみを展開
        const initialExpandedState: { [key: string]: boolean } = {};

        data.forEach((category: Category) => {
          initialExpandedState[category.title] = selectedData.worldSetting?.category === category.title;
        });

        setExpandedCategories(initialExpandedState);

        setLoading(false);
      } catch (error) {
        console.error('作品世界と舞台設定データ取得エラー:', error);
        setError('作品世界と舞台設定データの読み込み中にエラーが発生しました。');
        setLoading(false);
      }
    };

    fetchWorldSettings();
  }, [selectedData.worldSetting?.category]);

  const handleSelectWorldSetting = (category: string, setting: WorldSetting) => {
    setSelectedData({
      ...selectedData,
      worldSetting: {
        ...setting,
        category
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

  // キーワード検索機能
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
  };

  const performSearch = () => {
    if (!searchKeyword.trim()) {
      resetSearch();
      return;
    }

    // 検索状態をアクティブに
    setIsSearchActive(true);

    // すべてのカテゴリを開く
    expandAllCategories();

    // 検索結果をリセット
    const results: { [key: string]: boolean } = {};

    // 検索ロジック
    const keyword = searchKeyword.toLowerCase().trim();
    
    // すべてのカテゴリと設定を検索
    categories.forEach((category) => {
      category.settings.forEach((setting) => {
        const settingKey = `${category.title}|${setting.title}`;
        
        // タイトル、世界観、特徴、例で検索
        const matchesTitle = setting.title.toLowerCase().includes(keyword);
        const matchesWorldView = setting.worldView?.some(view => view.toLowerCase().includes(keyword)) || false;
        const matchesFeatures = setting.features?.some(feature => feature.toLowerCase().includes(keyword)) || false;
        const matchesExamples = setting.examples?.some(example => example.toLowerCase().includes(keyword)) || false;

        results[settingKey] = matchesTitle || matchesWorldView || matchesFeatures || matchesExamples;
      });
    });

    setSearchResults(results);
  };

  const resetSearch = () => {
    setIsSearchActive(false);
    setSearchKeyword('');
    setSearchResults({});
  };

  // 設定の表示判定
  const shouldShowSetting = (category: string, setting: WorldSetting): boolean => {
    if (!isSearchActive) return true;
    
    const settingKey = `${category}|${setting.title}`;
    return searchResults[settingKey] || false;
  };

  if (loading) {
    return <div>作品世界と舞台設定データを読み込み中...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  return (
    <div>
      <h2 className={styles.sectionTitle}>作品世界と舞台設定を選択</h2>
      <p className={styles.sectionDescription}>
        物語の舞台となる世界観と設定を選択してください。これにより物語の世界観や雰囲気が決まります。
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
        <input 
          type="search"
          value={searchKeyword}
          onChange={handleSearchInputChange}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              performSearch();
            }
          }}
          placeholder="検索ワード"
          className={styles.searchInput}
        />
        <button 
          type="button"
          className={styles.controlButton}
          onClick={performSearch}
        >
          検索
        </button>
        {isSearchActive && (
          <button 
            type="button"
            className={styles.controlButton}
            onClick={resetSearch}
          >
            検索をリセット
          </button>
        )}
      </div>

      <div>
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
              <div className={styles.settingsGrid}>
                {category.settings.map((setting, settingIndex) => (
                  shouldShowSetting(category.title, setting) && (
                    <div
                      key={settingIndex}
                      className={`${styles.optionCard} ${selectedData.worldSetting?.title === setting.title ? styles.selectedOption : ''
                        }`}
                      onClick={() => handleSelectWorldSetting(category.title, setting)}
                    >
                      <h3 className={styles.optionTitle}>{setting.title}</h3>
                      {setting.worldView && setting.worldView.length > 0 && (
                        <div className={styles.featuresList}>
                          <strong>基本的な世界観:</strong>
                          <ul className={styles.examplesList}>
                            {setting.worldView.map((item, i) => (
                              <li key={i} className={styles.exampleItem}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {setting.features && setting.features.length > 0 && (
                        <div className={styles.featuresList}>
                          <strong>特徴的な要素:</strong>
                          <ul className={styles.examplesList}>
                            {setting.features.map((feature, i) => (
                              <li key={i} className={styles.exampleItem}>{feature}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {setting.examples && setting.examples.length > 0 && (
                        <div>
                          <strong>代表作品:</strong>
                          <ul className={styles.examplesList}>
                            {setting.examples.map((example, i) => (
                              <li key={i} className={styles.exampleItem}>{example}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
