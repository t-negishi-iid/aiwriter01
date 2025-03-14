'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface WritingStyle {
  author: string;
  structure?: string;
  techniques?: string[];
  themes?: string;
}

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: WritingStyle[];
  status: string;
  error?: {
    message: string;
    details: string;
  };
}

export default function WritingStyleSelector() {
  const [styles, setStyles] = useState<WritingStyle[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWritingStyles() {
      try {
        const response = await fetch('/api/tools/writing-styles');
        if (!response.ok) {
          throw new Error('作風パターンデータの取得に失敗しました');
        }
        const data: ApiResponse = await response.json();
        
        if (data.status === 'error') {
          throw new Error(data.error?.message || '不明なエラーが発生しました');
        }
        
        setStyles(data.results);
        setLoading(false);
      } catch (err) {
        setError('作風パターンデータの読み込み中にエラーが発生しました');
        setLoading(false);
        console.error(err);
      }
    }

    fetchWritingStyles();
  }, []);

  // 作家が選択された時の処理
  const handleAuthorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAuthor(e.target.value);
  };

  // 選択された作家の作風詳細を取得
  const getSelectedStyleDetails = () => {
    if (!selectedAuthor) return null;
    return styles.find(style => style.author === selectedAuthor);
  };

  const selectedStyleDetails = getSelectedStyleDetails();

  if (loading) {
    return <div>作風パターンデータを読み込み中...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <div className={styles.selectContainer}>
          <label htmlFor="author-select">作家を選択:</label>
          <select
            id="author-select"
            name="author"
            value={selectedAuthor}
            onChange={handleAuthorChange}
            aria-label="作家選択"
            className={styles.select}
          >
            <option value="">-- 作家を選択 --</option>
            {styles.map((style) => (
              <option key={style.author} value={style.author}>
                {style.author}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.rightPanel}>
        {selectedStyleDetails ? (
          <div className={styles.styleDetails}>
            <h2>{selectedStyleDetails.author}の作風</h2>
            
            {selectedStyleDetails.structure && (
              <div className={styles.section}>
                <h3>文体と構造的特徴</h3>
                <p className={styles.description}>{selectedStyleDetails.structure}</p>
              </div>
            )}
            
            {selectedStyleDetails.techniques && selectedStyleDetails.techniques.length > 0 && (
              <div className={styles.section}>
                <h3>表現技法</h3>
                <ul className={styles.list}>
                  {selectedStyleDetails.techniques.map((technique, index) => (
                    <li key={index}>{technique}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {selectedStyleDetails.themes && (
              <div className={styles.section}>
                <h3>テーマと主題</h3>
                <p className={styles.description}>{selectedStyleDetails.themes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.placeholder}>
            <p>左側のメニューから作家を選択すると、作風の詳細が表示されます。</p>
          </div>
        )}
      </div>
    </div>
  );
}
