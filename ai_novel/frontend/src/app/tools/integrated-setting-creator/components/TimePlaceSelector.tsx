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
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const fetchTimePlaceSettings = async () => {
      try {
        const response = await fetch('/api/tools/time-place-settings');
        if (!response.ok) {
          throw new Error('時代と場所データの取得に失敗しました');
        }
        const data = await response.json();
        setCategories(data.results);

        // 初期状態では選択されたカテゴリのみを展開（全てを展開しない）
        const initialExpandedState: { [key: string]: boolean } = {};
        data.results.forEach((category: Category) => {
          // 選択されている場合のみ展開する
          initialExpandedState[category.title] = selectedData.timePlace?.category === category.title;
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
  }, [selectedData.timePlace?.category]);

  // 選択が既に存在するかチェック
  const isSettingSelected = (category: string, setting: TimePlaceSetting): boolean => {
    if (!selectedData.timePlace) return false;
    
    return selectedData.timePlace.category === category && selectedData.timePlace.title === setting.title;
  };

  // 時代と場所の設定をトグル選択
  const handleToggleTimePlaceSetting = (category: string, setting: TimePlaceSetting) => {
    // すでに選択されているかチェック
    const isAlreadySelected = isSettingSelected(category, setting);
    
    if (isAlreadySelected) {
      // すでに選択されている場合は、選択を解除
      setSelectedData({
        ...selectedData,
        timePlace: undefined
      });
    } else {
      // 選択されていない場合は、新しい選択に置き換え
      setSelectedData({
        ...selectedData,
        timePlace: {
          category,
          title: setting.title,
          examples: setting.examples,
          content: setting.content || ''
        }
      });
    }
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
        // タイトル、例、コンテンツで検索
        const matchesTitle = setting.title.toLowerCase().includes(keyword);
        const matchesExamples = setting.examples?.some(ex => ex.toLowerCase().includes(keyword)) || false;
        const matchesContent = setting.content?.toLowerCase().includes(keyword) || false;

        results[settingKey] = matchesTitle || matchesExamples || matchesContent;
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
  const shouldShowSetting = (category: string, setting: TimePlaceSetting): boolean => {
    if (!isSearchActive) return true;
    
    const settingKey = `${category}|${setting.title}`;
    return searchResults[settingKey] || false;
  };

  // 選択された設定のプレビュー部分をレンダリング
  const renderSelectedSetting = () => {
    // selectedData.timePlaceが存在するか確認
    if (!selectedData.timePlace) {
      return null;
    }
    
    return (
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
    );
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
        物語の舞台となる時代と場所を選択してください。同じ項目を再度クリックすると選択を解除できます。
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
                shouldShowSetting(category.title, setting) && (
                  <div
                    key={settingIndex}
                    className={`${styles.optionCard} ${isSettingSelected(category.title, setting) ? styles.selectedOption : ''
                      }`}
                    onClick={() => handleToggleTimePlaceSetting(category.title, setting)}
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
                )
              ))}
            </div>
          )}
        </div>
      ))}

      {/* 選択された設定のプレビュー */}
      {renderSelectedSetting()}
    </div>
  );
}
