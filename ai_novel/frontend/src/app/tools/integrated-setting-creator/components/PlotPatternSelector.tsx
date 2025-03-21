'use client';

import { useState, useEffect } from 'react';
import styles from '../page.module.css';

interface PlotSubsection {
  title: string;
  content: string[];
}

interface PlotSection {
  title: string;
  content: string[];
  subsections: PlotSubsection[];
}

interface PlotPattern {
  title: string;
  filename: string;
  overview: string;
  sections: PlotSection[];
}

interface SelectedData {
  plotPattern?: PlotPattern;
  [key: string]: unknown;
}

interface PlotPatternSelectorProps {
  selectedData: SelectedData;
  setSelectedData: (data: SelectedData) => void;
}

export default function PlotPatternSelector({ selectedData, setSelectedData }: PlotPatternSelectorProps) {
  const [plotPatterns, setPlotPatterns] = useState<PlotPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPatterns, setExpandedPatterns] = useState<{ [key: string]: boolean }>({});
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const fetchPlotPatterns = async () => {
      try {
        const response = await fetch('/api/tools/plot-patterns');
        if (!response.ok) {
          throw new Error('プロットパターンデータの取得に失敗しました');
        }
        const data = await response.json();
        setPlotPatterns(data.results);

        // 初期状態では選択されているパターンのみを展開
        const initialExpandedState: { [key: string]: boolean } = {};
        data.results.forEach((pattern: PlotPattern) => {
          initialExpandedState[pattern.title] = selectedData.plotPattern?.title === pattern.title;
        });
        setExpandedPatterns(initialExpandedState);

        setLoading(false);
      } catch (error) {
        console.error('プロットパターンデータ取得エラー:', error);
        setError('プロットパターンデータの読み込み中にエラーが発生しました。');
        setLoading(false);
      }
    };

    fetchPlotPatterns();
  }, [selectedData.plotPattern?.title]);

  const handleSelectPlotPattern = (plotPattern: PlotPattern) => {
    setSelectedData({
      ...selectedData,
      plotPattern
    });

    // 選択したパターンを展開
    setExpandedPatterns(prev => ({
      ...prev,
      [plotPattern.title]: true
    }));
  };

  const togglePattern = (patternTitle: string) => {
    setExpandedPatterns(prev => ({
      ...prev,
      [patternTitle]: !prev[patternTitle]
    }));
  };

  // すべてのパターンを開閉する関数
  const expandAllPatterns = () => {
    const allExpanded: { [key: string]: boolean } = {};
    plotPatterns.forEach((pattern) => {
      allExpanded[pattern.title] = true;
    });
    setExpandedPatterns(allExpanded);
  };

  const collapseAllPatterns = () => {
    const allCollapsed: { [key: string]: boolean } = {};
    plotPatterns.forEach((pattern) => {
      allCollapsed[pattern.title] = false;
    });
    setExpandedPatterns(allCollapsed);
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

    // すべてのパターンを開く
    expandAllPatterns();

    // 検索結果をリセット
    const results: { [key: string]: boolean } = {};

    // 検索ロジック
    const keyword = searchKeyword.toLowerCase().trim();
    
    // すべてのプロットパターンを検索
    plotPatterns.forEach((pattern) => {
      const patternKey = pattern.title;
      
      // タイトル、概要で検索
      const matchesTitle = pattern.title.toLowerCase().includes(keyword);
      const matchesOverview = pattern.overview.toLowerCase().includes(keyword);
      
      // セクションとサブセクションで検索
      let matchesSections = false;
      
      for (const section of pattern.sections) {
        // セクションタイトルで検索
        if (section.title.toLowerCase().includes(keyword)) {
          matchesSections = true;
          break;
        }
        
        // セクションコンテンツで検索
        if (section.content.some(line => line.toLowerCase().includes(keyword))) {
          matchesSections = true;
          break;
        }
        
        // サブセクションで検索
        for (const subsection of section.subsections) {
          // サブセクションタイトルで検索
          if (subsection.title.toLowerCase().includes(keyword)) {
            matchesSections = true;
            break;
          }
          
          // サブセクションコンテンツで検索
          if (subsection.content.some(line => line.toLowerCase().includes(keyword))) {
            matchesSections = true;
            break;
          }
        }
        
        if (matchesSections) break;
      }

      results[patternKey] = matchesTitle || matchesOverview || matchesSections;
    });

    setSearchResults(results);
  };

  const resetSearch = () => {
    setIsSearchActive(false);
    setSearchKeyword('');
    setSearchResults({});
  };

  // パターンの表示判定
  const shouldShowPattern = (title: string): boolean => {
    if (!isSearchActive) return true;
    return searchResults[title] || false;
  };

  if (loading) {
    return <div>プロットパターンデータを読み込み中...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  return (
    <div>
      <h2 className={styles.sectionTitle}>プロットパターンを選択</h2>
      <p className={styles.sectionDescription}>
        物語の基本的な展開パターンを選択してください。これにより物語の構造と展開が決まります。
      </p>

      <div className={styles.controlButtons}>
        <button 
          type="button"
          className={styles.controlButton}
          onClick={expandAllPatterns}
        >
          カテゴリをすべて開く
        </button>
        <button 
          type="button"
          className={styles.controlButton}
          onClick={collapseAllPatterns}
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
        {plotPatterns.map((pattern, index) => (
          shouldShowPattern(pattern.title) && (
            <div key={index} className={styles.categoryContainer}>
              <div
                className={styles.leftAlignedHeader}
                onClick={() => togglePattern(pattern.title)}
              >
                <span className={styles.expandIcon}>
                  {expandedPatterns[pattern.title] ? '▼' : '▶'}
                </span>
                <h3 className={styles.categoryTitle}>「{pattern.title}」</h3>
              </div>

              {expandedPatterns[pattern.title] && (
                <div
                  className={`${styles.optionCard} ${selectedData.plotPattern?.title === pattern.title ? styles.selectedOption : ''}`}
                  onClick={() => handleSelectPlotPattern(pattern)}
                >
                  <div className={styles.plotSection}>
                    <strong>概要:</strong>
                    <p>{pattern.overview}</p>
                  </div>

                  {pattern.sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className={styles.plotSection}>
                      <strong>{section.title}:</strong>

                      {section.content.length > 0 && (
                        <div className={styles.sectionContent}>
                          {section.content.map((line, lineIndex) => (
                            <p key={lineIndex}>{line}</p>
                          ))}
                        </div>
                      )}

                      {section.subsections.length > 0 && (
                        <div className={styles.subsections}>
                          {section.subsections.map((subsection, subsectionIndex) => (
                            <div key={subsectionIndex} className={styles.subsection}>
                              <h4 className={styles.stageTitle}>{subsection.title}</h4>
                              <ul className={styles.episodeList}>
                                {subsection.content.map((line, lineIndex) => (
                                  <li key={lineIndex} className={styles.exampleItem}>{line}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        ))}
      </div>
    </div>
  );
}
