'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface TimePlaceSetting {
  title: string;
  examples: string[];
}

interface Category {
  title: string;
  settings: TimePlaceSetting[];
}

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Category[];
  status: string;
  error?: {
    message: string;
    details: string;
  };
}

export default function TimePlaceSelector() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSetting, setSelectedSetting] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTimePlaceSettings() {
      try {
        const response = await fetch('/api/tools/time-place-settings');
        if (!response.ok) {
          throw new Error('時代と場所パターンデータの取得に失敗しました');
        }
        const data: ApiResponse = await response.json();
        
        if (data.status === 'error') {
          throw new Error(data.error?.message || '不明なエラーが発生しました');
        }
        
        setCategories(data.results);
        setLoading(false);
      } catch (err) {
        setError('時代と場所パターンデータの読み込み中にエラーが発生しました');
        setLoading(false);
        console.error(err);
      }
    }

    fetchTimePlaceSettings();
  }, []);

  // カテゴリが選択された時の処理
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setSelectedSetting(''); // カテゴリが変更されたら設定をリセット
  };

  // 時代・場所設定が選択された時の処理
  const handleSettingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSetting(e.target.value);
  };

  // 選択されたカテゴリの時代・場所設定を取得
  const getSelectedCategorySettings = () => {
    if (!selectedCategory) return [];
    const category = categories.find(cat => cat.title === selectedCategory);
    return category ? category.settings : [];
  };

  // 選択された時代・場所設定の詳細を取得
  const getSelectedSettingDetails = () => {
    if (!selectedCategory || !selectedSetting) return null;
    const category = categories.find(cat => cat.title === selectedCategory);
    if (!category) return null;
    
    return category.settings.find(setting => setting.title === selectedSetting);
  };

  const categorySettings = getSelectedCategorySettings();
  const selectedSettingDetails = getSelectedSettingDetails();

  if (loading) {
    return <div>時代と場所パターンデータを読み込み中...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <div className={styles.selectContainer}>
          <label htmlFor="category-select">カテゴリを選択:</label>
          <select
            id="category-select"
            name="category"
            value={selectedCategory}
            onChange={handleCategoryChange}
            aria-label="カテゴリ選択"
            className={styles.select}
          >
            <option value="">-- カテゴリを選択 --</option>
            {categories.map((category) => (
              <option key={category.title} value={category.title}>
                {category.title}
              </option>
            ))}
          </select>
        </div>

        {selectedCategory && (
          <div className={styles.selectContainer}>
            <label htmlFor="setting-select">時代・場所を選択:</label>
            <select
              id="setting-select"
              name="setting"
              value={selectedSetting}
              onChange={handleSettingChange}
              aria-label="時代・場所選択"
              className={styles.select}
              disabled={!selectedCategory}
            >
              <option value="">-- 時代・場所を選択 --</option>
              {categorySettings.map((setting) => (
                <option key={setting.title} value={setting.title}>
                  {setting.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className={styles.rightPanel}>
        {selectedSettingDetails ? (
          <div className={styles.settingDetails}>
            <h2>{selectedSettingDetails.title}</h2>
            
            <div className={styles.section}>
              <h3>代表作品</h3>
              <ul className={styles.list}>
                {selectedSettingDetails.examples.map((example, index) => (
                  <li key={index}>{example}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className={styles.placeholder}>
            <p>左側のメニューからカテゴリと時代・場所を選択すると、詳細が表示されます。</p>
          </div>
        )}
      </div>
    </div>
  );
}
