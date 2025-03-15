'use client';

import { useState, useEffect } from 'react';
import styles from '../page.module.css';

interface Theme {
  title: string;
  description?: string;
  examples?: string[];
}

interface Subcategory {
  title: string;
  themes: Theme[];
}

interface CategoryWithThemes {
  title: string;
  themes: Theme[];
  subcategories?: Subcategory[];
}

interface ThemeSelectorProps {
  selectedData: any;
  setSelectedData: (data: any) => void;
}

export default function ThemeSelector({ selectedData, setSelectedData }: ThemeSelectorProps) {
  const [categories, setCategories] = useState<CategoryWithThemes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const [expandedSubcategories, setExpandedSubcategories] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const response = await fetch('/api/tools/themes');
        if (!response.ok) {
          throw new Error('テーマデータの取得に失敗しました');
        }
        const data = await response.json();
        setCategories(data);

        // 初期状態では選択されているカテゴリのみを展開
        const initialExpandedState: { [key: string]: boolean } = {};
        const initialSubcategoriesState: { [key: string]: boolean } = {};

        data.forEach((category: CategoryWithThemes) => {
          initialExpandedState[category.title] = selectedData.theme?.category === category.title;

          // サブカテゴリの初期状態を設定
          if (category.subcategories) {
            category.subcategories.forEach((subcategory: Subcategory) => {
              const key = `${category.title}-${subcategory.title}`;
              initialSubcategoriesState[key] = selectedData.theme?.subcategory === subcategory.title;
            });
          }
        });

        setExpandedCategories(initialExpandedState);
        setExpandedSubcategories(initialSubcategoriesState);

        setLoading(false);
      } catch (error) {
        console.error('テーマデータ取得エラー:', error);
        setError('テーマデータの読み込み中にエラーが発生しました。');
        setLoading(false);
      }
    };

    fetchThemes();
  }, [selectedData.theme?.category, selectedData.theme?.subcategory]);

  const handleSelectTheme = (category: string, theme: Theme, subcategory?: string) => {
    setSelectedData({
      ...selectedData,
      theme: {
        ...theme,
        category,
        subcategory
      }
    });
  };

  const toggleCategory = (categoryTitle: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryTitle]: !prev[categoryTitle]
    }));
  };

  const toggleSubcategory = (categoryTitle: string, subcategoryTitle: string) => {
    const key = `${categoryTitle}-${subcategoryTitle}`;
    setExpandedSubcategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isSubcategoryExpanded = (categoryTitle: string, subcategoryTitle: string) => {
    const key = `${categoryTitle}-${subcategoryTitle}`;
    return expandedSubcategories[key] || false;
  };

  if (loading) {
    return <div>テーマデータを読み込み中...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  return (
    <div>
      <h2 className={styles.sectionTitle}>テーマを選択</h2>
      <p className={styles.sectionDescription}>
        物語のテーマを選択してください。テーマは物語の根底にある中心的なメッセージや概念です。
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
              <div>
                {/* サブカテゴリ表示 */}
                {category.subcategories && category.subcategories.length > 0 && (
                  <div>
                    {category.subcategories.map((subcategory, subcategoryIndex) => (
                      <div key={subcategoryIndex} className={styles.categoryContainer}>
                        <div
                          className={styles.leftAlignedSubHeader}
                          onClick={() => toggleSubcategory(category.title, subcategory.title)}
                        >
                          <span className={styles.expandIcon}>
                            {isSubcategoryExpanded(category.title, subcategory.title) ? '▼' : '▶'}
                          </span>
                          <h4 className={styles.subcategoryTitle}>{subcategory.title}</h4>
                        </div>

                        {isSubcategoryExpanded(category.title, subcategory.title) && (
                          <div className={styles.themesGrid}>
                            {subcategory.themes.map((theme, themeIndex) => (
                              <div
                                key={themeIndex}
                                className={`${styles.optionCard} ${selectedData.theme?.title === theme.title ? styles.selectedOption : ''
                                  }`}
                                onClick={() => handleSelectTheme(category.title, theme, subcategory.title)}
                              >
                                <h3 className={styles.optionTitle}>{theme.title}</h3>
                                {theme.description && (
                                  <p className={styles.optionDescription}>{theme.description}</p>
                                )}
                                {theme.examples && theme.examples.length > 0 && (
                                  <div className={styles.examplesListContainer}>
                                    <strong>代表作品:</strong>
                                    <ul className={styles.examplesList}>
                                      {theme.examples.map((example, i) => (
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
                )}

                {/* 直接のテーマ表示 */}
                {category.themes.length > 0 && (
                  <div className={styles.themesGrid}>
                    {category.themes.map((theme, themeIndex) => (
                      <div
                        key={themeIndex}
                        className={`${styles.optionCard} ${selectedData.theme?.title === theme.title ? styles.selectedOption : ''
                          }`}
                        onClick={() => handleSelectTheme(category.title, theme)}
                      >
                        <h3 className={styles.optionTitle}>{theme.title}</h3>
                        {theme.description && (
                          <p className={styles.optionDescription}>{theme.description}</p>
                        )}
                        {theme.examples && theme.examples.length > 0 && (
                          <div className={styles.examplesListContainer}>
                            <strong>代表作品:</strong>
                            <ul className={styles.examplesList}>
                              {theme.examples.map((example, i) => (
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
