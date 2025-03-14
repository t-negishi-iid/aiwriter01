'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface MysteryPattern {
  title: string;
  examples: string[];
  pastEvents: string[];
  currentEffects: string[];
  resolutionPaths: string[];
}

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: MysteryPattern[];
  status: string;
  error?: {
    message: string;
    details: string;
  };
}

export default function PastMysterySelector() {
  const [patterns, setPatterns] = useState<MysteryPattern[]>([]);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMysteryPatterns() {
      try {
        const response = await fetch('/api/tools/past-mystery-patterns');
        if (!response.ok) {
          throw new Error('過去の謎パターンデータの取得に失敗しました');
        }
        const data: ApiResponse = await response.json();
        
        if (data.status === 'error') {
          throw new Error(data.error?.message || '不明なエラーが発生しました');
        }
        
        setPatterns(data.results);
        setLoading(false);
      } catch (err) {
        setError('過去の謎パターンデータの読み込み中にエラーが発生しました');
        setLoading(false);
        console.error(err);
      }
    }

    fetchMysteryPatterns();
  }, []);

  // パターンの選択状態を切り替える処理
  const handlePatternToggle = (patternTitle: string) => {
    setSelectedPatterns(prev => {
      // すでに選択されている場合は削除
      if (prev.includes(patternTitle)) {
        return prev.filter(title => title !== patternTitle);
      }
      
      // 選択されていない場合は追加（ただし最大2つまで）
      if (prev.length < 2) {
        return [...prev, patternTitle];
      }
      
      // すでに2つ選択されている場合は、最初の選択を削除して新しい選択を追加
      return [prev[1], patternTitle];
    });
  };

  // 選択されたパターンの詳細を取得
  const getSelectedPatternDetails = (patternTitle: string) => {
    return patterns.find(pattern => pattern.title === patternTitle);
  };

  if (loading) {
    return <div>過去の謎パターンデータを読み込み中...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <div className={styles.checkboxContainer}>
          <h3>謎パターンを選択（最大2つ）:</h3>
          <div className={styles.checkboxList}>
            {patterns.map((pattern) => (
              <div key={pattern.title} className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  id={`pattern-${pattern.title}`}
                  name={pattern.title}
                  checked={selectedPatterns.includes(pattern.title)}
                  onChange={() => handlePatternToggle(pattern.title)}
                  disabled={selectedPatterns.length >= 2 && !selectedPatterns.includes(pattern.title)}
                />
                <label htmlFor={`pattern-${pattern.title}`}>{pattern.title}</label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.rightPanel}>
        {selectedPatterns.length > 0 ? (
          <div className={styles.selectedPatternsContainer}>
            {selectedPatterns.map(patternTitle => {
              const patternDetails = getSelectedPatternDetails(patternTitle);
              if (!patternDetails) return null;
              
              return (
                <div key={patternTitle} className={styles.patternDetails}>
                  <h2>{patternDetails.title}</h2>
                  
                  <div className={styles.section}>
                    <h3>代表的な具体例</h3>
                    <ul className={styles.list}>
                      {patternDetails.examples.map((example, index) => (
                        <li key={index}>{example}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className={styles.section}>
                    <h3>過去の出来事</h3>
                    <ul className={styles.list}>
                      {patternDetails.pastEvents.map((event, index) => (
                        <li key={index}>{event}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className={styles.section}>
                    <h3>現在への影響</h3>
                    <ul className={styles.list}>
                      {patternDetails.currentEffects.map((effect, index) => (
                        <li key={index}>{effect}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className={styles.section}>
                    <h3>解決への道筋</h3>
                    <ul className={styles.list}>
                      {patternDetails.resolutionPaths.map((path, index) => (
                        <li key={index}>{path}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.placeholder}>
            <p>左側のメニューから謎パターンを選択すると、詳細が表示されます。最大2つまで選択できます。</p>
          </div>
        )}
        
        {selectedPatterns.length === 2 && (
          <div className={styles.combinationSection}>
            <h2>組み合わせのヒント</h2>
            <p>選択した2つの謎パターンを組み合わせることで、より複雑で魅力的なストーリーを構築できます。例えば：</p>
            <ul className={styles.list}>
              <li>{selectedPatterns[0]} × {selectedPatterns[1]}（両方の要素を持つキャラクターや状況を作る）</li>
              <li>一方のパターンが原因、もう一方が結果として展開する</li>
              <li>複数の登場人物にそれぞれのパターンを割り当てる</li>
              <li>物語の前半と後半で異なるパターンを中心に据える</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
