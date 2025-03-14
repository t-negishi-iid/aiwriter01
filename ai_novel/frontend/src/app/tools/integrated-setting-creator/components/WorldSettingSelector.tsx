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

interface WorldSettingSelectorProps {
  selectedData: any;
  setSelectedData: (data: any) => void;
}

export default function WorldSettingSelector({ selectedData, setSelectedData }: WorldSettingSelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({});

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
        const initialExpandedState: {[key: string]: boolean} = {};
        
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
                  <div
                    key={settingIndex}
                    className={`${styles.optionCard} ${
                      selectedData.worldSetting?.title === setting.title ? styles.selectedOption : ''
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
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
