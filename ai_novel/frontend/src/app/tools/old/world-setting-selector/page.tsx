'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface WorldSetting {
  title: string;
  description?: string;
  features?: string[];
  examples?: string[];
}

interface Category {
  title: string;
  settings: WorldSetting[];
}

export default function WorldSettingSelector() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSetting, setSelectedSetting] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWorldSettings() {
      try {
        const response = await fetch('/api/tools/world-settings');
        if (!response.ok) {
          throw new Error('ワールド設定データの取得に失敗しました');
        }
        const data = await response.json();
        setCategories(data);
        setLoading(false);
      } catch (err) {
        setError('ワールド設定データの読み込み中にエラーが発生しました');
        setLoading(false);
        console.error(err);
      }
    }

    fetchWorldSettings();
  }, []);

  // カテゴリが選択された時の処理
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setSelectedSetting(''); // カテゴリが変わったら設定の選択をリセット
  };

  // 設定が選択された時の処理
  const handleSettingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSetting(e.target.value);
  };

  // 選択されたカテゴリに属する設定のリストを取得
  const getSettingsForSelectedCategory = () => {
    if (!selectedCategory) return [];
    const category = categories.find(cat => cat.title === selectedCategory);
    return category ? category.settings : [];
  };

  // 選択された設定の詳細を取得
  const getSelectedSettingDetails = () => {
    if (!selectedCategory || !selectedSetting) return null;
    
    const category = categories.find(cat => cat.title === selectedCategory);
    if (!category) return null;
    
    return category.settings.find(setting => setting.title === selectedSetting);
  };

  const selectedSettingDetails = getSelectedSettingDetails();

  if (loading) {
    return <div>ワールド設定データを読み込み中...</div>;
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
            <label htmlFor="setting-select">設定を選択:</label>
            <select
              id="setting-select"
              name="setting"
              value={selectedSetting}
              onChange={handleSettingChange}
              aria-label="設定選択"
              className={styles.select}
              disabled={!selectedCategory}
            >
              <option value="">-- 設定を選択 --</option>
              {getSettingsForSelectedCategory().map((setting) => (
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
            
            {selectedSettingDetails.description && (
              <div className={styles.section}>
                <h3>基本的な世界観</h3>
                <p className={styles.description}>
                  {selectedSettingDetails.description.split('\n').map((line, index) => (
                    <span key={index}>
                      {line}
                      <br />
                    </span>
                  ))}
                </p>
              </div>
            )}
            
            {selectedSettingDetails.features && selectedSettingDetails.features.length > 0 && (
              <div className={styles.section}>
                <h3>特徴的な要素</h3>
                <ul className={styles.list}>
                  {selectedSettingDetails.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {selectedSettingDetails.examples && selectedSettingDetails.examples.length > 0 && (
              <div className={styles.section}>
                <h3>代表的な作品例</h3>
                <ul className={styles.list}>
                  {selectedSettingDetails.examples.map((example, index) => (
                    <li key={index}>{example}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.placeholder}>
            <p>左側のメニューからカテゴリと設定を選択すると、詳細が表示されます。</p>
          </div>
        )}
      </div>
    </div>
  );
}
