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

interface PlotPatternSelectorProps {
  selectedData: any;
  setSelectedData: (data: any) => void;
}

export default function PlotPatternSelector({ selectedData, setSelectedData }: PlotPatternSelectorProps) {
  const [plotPatterns, setPlotPatterns] = useState<PlotPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPatterns, setExpandedPatterns] = useState<{[key: string]: boolean}>({});

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
        const initialExpandedState: {[key: string]: boolean} = {};
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
      
      <div>
        {plotPatterns.map((pattern, index) => (
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
        ))}
      </div>
    </div>
  );
}
