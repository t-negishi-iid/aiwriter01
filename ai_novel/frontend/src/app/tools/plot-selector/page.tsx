'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

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

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PlotPattern[];
  status: string;
  error?: {
    message: string;
    details: string;
  };
}

export default function PlotSelector() {
  const [plotPatterns, setPlotPatterns] = useState<PlotPattern[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlotPatterns() {
      try {
        const response = await fetch('/api/tools/plot-patterns');
        if (!response.ok) {
          throw new Error('プロットパターンデータの取得に失敗しました');
        }
        const data: ApiResponse = await response.json();
        
        if (data.status === 'error') {
          throw new Error(data.error?.message || '不明なエラーが発生しました');
        }
        
        setPlotPatterns(data.results);
        setLoading(false);
      } catch (err) {
        setError('プロットパターンデータの読み込み中にエラーが発生しました');
        setLoading(false);
        console.error(err);
      }
    }

    fetchPlotPatterns();
  }, []);

  // プロットが選択された時の処理
  const handlePlotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPlot(e.target.value);
  };

  // 選択されたプロットの詳細を取得
  const getSelectedPlotDetails = () => {
    if (!selectedPlot) return null;
    return plotPatterns.find(pattern => pattern.title === selectedPlot);
  };

  const selectedPlotDetails = getSelectedPlotDetails();

  if (loading) {
    return <div>プロットパターンデータを読み込み中...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <div className={styles.selectContainer}>
          <label htmlFor="plot-select">プロットパターンを選択:</label>
          <select
            id="plot-select"
            name="plot"
            value={selectedPlot}
            onChange={handlePlotChange}
            aria-label="プロットパターン選択"
            className={styles.select}
          >
            <option value="">-- プロットパターンを選択 --</option>
            {plotPatterns.map((pattern) => (
              <option key={pattern.filename} value={pattern.title}>
                {pattern.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.rightPanel}>
        {selectedPlotDetails ? (
          <div className={styles.plotDetails}>
            <h2>{selectedPlotDetails.title}</h2>
            
            <div className={styles.overviewSection}>
              <h3>概要</h3>
              <p>{selectedPlotDetails.overview}</p>
            </div>
            
            {selectedPlotDetails.sections.map((section, index) => (
              <div key={index} className={styles.section}>
                <h3>{section.title}</h3>
                <div className={styles.sectionContent}>
                  {section.content.map((paragraph, pIndex) => (
                    <p key={pIndex}>{paragraph}</p>
                  ))}
                  
                  {section.subsections.length > 0 && (
                    <div className={styles.subsections}>
                      {section.subsections.map((subsection, subIndex) => (
                        <div key={subIndex} className={styles.subsection}>
                          <h4>{subsection.title}</h4>
                          <div className={styles.subsectionContent}>
                            {subsection.content.map((paragraph, pIndex) => (
                              <p key={pIndex}>{paragraph}</p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.placeholder}>
            <p>左側のメニューからプロットパターンを選択すると、詳細が表示されます。</p>
          </div>
        )}
      </div>
    </div>
  );
}
