'use client';

import { useState, useEffect } from 'react';
import styles from '../page.module.css';

interface PastMysteryData {
  title: string;
  description: string;
  events: string[];
  sections: { [sectionName: string]: string[] };
}

interface SelectedData {
  pastMystery?: PastMysteryData;
  [key: string]: unknown;
}

interface PastMysterySelectorProps {
  selectedData: SelectedData;
  setSelectedData: (data: SelectedData) => void;
}

export default function PastMysterySelector({ selectedData, setSelectedData }: PastMysterySelectorProps) {
  const [pastMysteries, setPastMysteries] = useState<PastMysteryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMysteries, setExpandedMysteries] = useState<{ [key: string]: boolean }>({});
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const fetchPastMysteries = async () => {
      try {
        const response = await fetch('/api/tools/past-mysteries');
        if (!response.ok) {
          throw new Error('過去の謎データの取得に失敗しました');
        }
        const data = await response.json();
        setPastMysteries(data.results);

        // 初期状態では選択されている謎のみを展開
        const initialExpandedState: { [key: string]: boolean } = {};
        data.results.forEach((mystery: PastMysteryData) => {
          initialExpandedState[mystery.title] = selectedData.pastMystery?.title === mystery.title;
        });
        setExpandedMysteries(initialExpandedState);

        setLoading(false);
      } catch (error) {
        console.error('過去の謎データ取得エラー:', error);
        setError('過去の謎データの読み込み中にエラーが発生しました。');
        setLoading(false);
      }
    };

    fetchPastMysteries();
  }, [selectedData.pastMystery?.title]);

  const handleSelectPastMystery = (pastMystery: PastMysteryData) => {
    // 既に選択されている謎が再度クリックされた場合は選択を解除
    if (selectedData.pastMystery?.title === pastMystery.title) {
      setSelectedData({
        ...selectedData,
        pastMystery: undefined
      });
    } else {
      // 新しい謎を選択
      setSelectedData({
        ...selectedData,
        pastMystery
      });
    }

    // 選択状態に関わらず、クリックした謎は展開状態を維持
    setExpandedMysteries(prev => ({
      ...prev,
      [pastMystery.title]: true
    }));
  };

  const toggleMystery = (title: string) => {
    setExpandedMysteries(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // すべての謎を開閉する関数
  const expandAllMysteries = () => {
    const allExpanded: { [key: string]: boolean } = {};
    pastMysteries.forEach((mystery) => {
      allExpanded[mystery.title] = true;
    });
    setExpandedMysteries(allExpanded);
  };

  const collapseAllMysteries = () => {
    const allCollapsed: { [key: string]: boolean } = {};
    pastMysteries.forEach((mystery) => {
      allCollapsed[mystery.title] = false;
    });
    setExpandedMysteries(allCollapsed);
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

    // すべての謎を開く
    expandAllMysteries();

    // 検索結果をリセット
    const results: { [key: string]: boolean } = {};

    // 検索ロジック
    const keyword = searchKeyword.toLowerCase().trim();
    
    // すべての謎を検索
    pastMysteries.forEach((mystery) => {
      const mysteryKey = mystery.title;
      
      // タイトル、説明、イベント、セクションで検索
      const matchesTitle = mystery.title.toLowerCase().includes(keyword);
      const matchesDescription = mystery.description.toLowerCase().includes(keyword);
      const matchesEvents = mystery.events?.some(event => event.toLowerCase().includes(keyword)) || false;
      
      // セクション内の項目も検索
      let matchesSections = false;
      if (mystery.sections) {
        for (const [sectionName, items] of Object.entries(mystery.sections)) {
          // セクション名も検索対象に含める
          if (sectionName.toLowerCase().includes(keyword)) {
            matchesSections = true;
            break;
          }
          
          // セクション内の項目も検索
          if (items.some(item => item.toLowerCase().includes(keyword))) {
            matchesSections = true;
            break;
          }
        }
      }

      results[mysteryKey] = matchesTitle || matchesDescription || matchesEvents || matchesSections;
    });

    setSearchResults(results);
  };

  const resetSearch = () => {
    setIsSearchActive(false);
    setSearchKeyword('');
    setSearchResults({});
  };

  // 謎の表示判定
  const shouldShowMystery = (title: string): boolean => {
    if (!isSearchActive) return true;
    return searchResults[title] || false;
  };

  if (loading) {
    return <div>過去の謎データを読み込み中...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  return (
    <div>
      <h2 className={styles.sectionTitle}>物語の背景となる過去の謎を選択</h2>
      <p className={styles.sectionDescription}>
        物語の背景となる過去の謎を選択してください。同じ項目を再度クリックすると選択を解除できます。
      </p>

      <div className={styles.controlButtons}>
        <button 
          type="button"
          className={styles.controlButton}
          onClick={expandAllMysteries}
        >
          カテゴリをすべて開く
        </button>
        <button 
          type="button"
          className={styles.controlButton}
          onClick={collapseAllMysteries}
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
        {pastMysteries.map((mystery, index) => (
          shouldShowMystery(mystery.title) && (
            <div key={index} className={styles.categoryContainer}>
              <div
                className={styles.leftAlignedHeader}
                onClick={() => toggleMystery(mystery.title)}
              >
                <span className={styles.expandIcon}>
                  {expandedMysteries[mystery.title] ? '▼' : '▶'}
                </span>
                <h3 className={styles.categoryTitle}>「{mystery.title}」</h3>
              </div>

              {(expandedMysteries[mystery.title] || selectedData.pastMystery?.title === mystery.title) && (
                <div
                  className={`${styles.optionCard} ${selectedData.pastMystery?.title === mystery.title ? styles.selectedOption : ''}`}
                  onClick={() => handleSelectPastMystery(mystery)}
                >
                  <p className={styles.optionDescription}>{mystery.description}</p>

                  {/* すべてのセクションを表示 */}
                  {mystery.sections && Object.entries(mystery.sections).map(([sectionName, items]) => (
                    <div key={sectionName} className={styles.sectionContainer}>
                      <strong>{sectionName}:</strong>
                      <ul className={styles.examplesList}>
                        {items.map((item, i) => (
                          <li key={i} className={styles.exampleItem}>{item}</li>
                        ))}
                      </ul>
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
