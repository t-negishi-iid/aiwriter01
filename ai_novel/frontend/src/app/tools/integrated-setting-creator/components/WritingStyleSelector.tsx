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
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<{ [key: string]: boolean }>({});

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

  // 選択された作風かどうかをチェック
  const isStyleSelected = (writingStyle: WritingStyle): boolean => {
    if (!selectedData.writingStyle) return false;
    return selectedData.writingStyle.author === writingStyle.author;
  };

  // 作風のトグル選択処理
  const handleToggleWritingStyle = (writingStyle: WritingStyle) => {
    // すでに選択されているかチェック
    const isAlreadySelected = isStyleSelected(writingStyle);
    
    if (isAlreadySelected) {
      // すでに選択されている場合は、選択を解除
      setSelectedData({
        ...selectedData,
        writingStyle: undefined
      });
    } else {
      // 選択されていない場合は、選択する
      setSelectedData({
        ...selectedData,
        writingStyle
      });

      // 選択したスタイルを展開
      setExpandedStyles(prev => ({
        ...prev,
        [writingStyle.author]: true
      }));
    }
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

    // すべてのスタイルを開く
    expandAllStyles();

    // 検索結果をリセット
    const results: { [key: string]: boolean } = {};

    // 検索ロジック
    const keyword = searchKeyword.toLowerCase().trim();
    
    // すべてのスタイルを検索
    writingStyles.forEach((style) => {
      const styleKey = style.author;
      
      // 著者名、構造、技法、テーマで検索
      const matchesAuthor = style.author.toLowerCase().includes(keyword);
      const matchesStructure = style.structure?.toLowerCase().includes(keyword) || false;
      const matchesTechniques = style.techniques?.some(tech => tech.toLowerCase().includes(keyword)) || false;
      const matchesThemes = style.themes?.toLowerCase().includes(keyword) || false;

      results[styleKey] = matchesAuthor || matchesStructure || matchesTechniques || matchesThemes;
    });

    setSearchResults(results);
  };

  const resetSearch = () => {
    setIsSearchActive(false);
    setSearchKeyword('');
    setSearchResults({});
  };

  // スタイルの表示判定
  const shouldShowStyle = (author: string): boolean => {
    if (!isSearchActive) return true;
    return searchResults[author] || false;
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
        物語の構成や展開の参考となる作家の作風を選択してください。同じ項目を再度クリックすると選択を解除できます。
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
        {writingStyles.map((style, index) => (
          shouldShowStyle(style.author) && (
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
                  className={`${styles.optionCard} ${isStyleSelected(style) ? styles.selectedOption : ''}`}
                  onClick={() => handleToggleWritingStyle(style)}
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
          )
        ))}
      </div>
    </div>
  );
}
