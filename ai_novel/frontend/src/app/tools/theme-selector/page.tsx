'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface Theme {
  title: string;
  description?: string;
  examples?: string[];
}

interface Category {
  title: string;
  themes: Theme[];
}

export default function ThemeSelector() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchThemes() {
      try {
        const response = await fetch('/api/tools/themes');
        if (!response.ok) {
          throw new Error('テーマデータの取得に失敗しました');
        }
        const data = await response.json();
        setCategories(data);
        setLoading(false);
      } catch (err) {
        setError('テーマデータの読み込み中にエラーが発生しました');
        setLoading(false);
        console.error(err);
      }
    }

    fetchThemes();
  }, []);

  // カテゴリが選択された時の処理
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setSelectedTheme(''); // カテゴリが変わったらテーマの選択をリセット
  };

  // テーマが選択された時の処理
  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTheme(e.target.value);
  };

  // 選択されたカテゴリに属するテーマのリストを取得
  const getThemesForSelectedCategory = () => {
    if (!selectedCategory) return [];
    const category = categories.find(cat => cat.title === selectedCategory);
    return category ? category.themes : [];
  };

  // 選択されたテーマの詳細を取得
  const getSelectedThemeDetails = () => {
    if (!selectedCategory || !selectedTheme) return null;
    
    const category = categories.find(cat => cat.title === selectedCategory);
    if (!category) return null;
    
    return category.themes.find(theme => theme.title === selectedTheme);
  };

  const selectedThemeDetails = getSelectedThemeDetails();

  if (loading) {
    return <div>テーマデータを読み込み中...</div>;
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
            <label htmlFor="theme-select">テーマを選択:</label>
            <select
              id="theme-select"
              name="theme"
              value={selectedTheme}
              onChange={handleThemeChange}
              aria-label="テーマ選択"
              className={styles.select}
              disabled={!selectedCategory}
            >
              <option value="">-- テーマを選択 --</option>
              {getThemesForSelectedCategory().map((theme) => (
                <option key={theme.title} value={theme.title}>
                  {theme.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className={styles.rightPanel}>
        {selectedThemeDetails ? (
          <div className={styles.themeDetails}>
            <h2>{selectedThemeDetails.title}</h2>
            <p className={styles.description}>{selectedThemeDetails.description}</p>
            
            {selectedThemeDetails.examples && selectedThemeDetails.examples.length > 0 && (
              <div className={styles.examples}>
                <h3>代表作品</h3>
                <ul>
                  {selectedThemeDetails.examples.map((example, index) => (
                    <li key={index}>{example}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.placeholder}>
            <p>左側のメニューからカテゴリとテーマを選択すると、詳細が表示されます。</p>
          </div>
        )}
      </div>
    </div>
  );
}
