'use client';

import { useState, useEffect } from 'react';
import styles from '../page.module.css';

interface PastMysteryData {
  title: string;
  description: string;
  events: string[];
  sections: { [sectionName: string]: string[] };
}

interface PastMysterySelectorProps {
  selectedData: any;
  setSelectedData: (data: any) => void;
}

export default function PastMysterySelector({ selectedData, setSelectedData }: PastMysterySelectorProps) {
  const [pastMysteries, setPastMysteries] = useState<PastMysteryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMysteries, setExpandedMysteries] = useState<{ [key: string]: boolean }>({});

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
        物語の背景となる過去の謎を選択してください。これにより物語に深みと謎解き要素が加わります。
      </p>

      <div>
        {pastMysteries.map((mystery, index) => (
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
        ))}
      </div>
    </div>
  );
}
