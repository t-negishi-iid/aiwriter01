'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface ElementOption {
  text: string;
  description: string;
}

interface ElementCategory {
  title: string;
  options: ElementOption[];
  usage: string;
  effectiveScenes: string[];
}

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ElementCategory[];
  status: string;
  error?: {
    message: string;
    details: string;
  };
}

interface SelectedElement {
  category: string;
  element: string;
}

export default function EmotionalElementsSelector() {
  const [categories, setCategories] = useState<ElementCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedElements, setSelectedElements] = useState<SelectedElement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEmotionalElements() {
      try {
        const response = await fetch('/api/tools/emotional-elements');
        if (!response.ok) {
          throw new Error('情緒的・感覚的要素データの取得に失敗しました');
        }
        const data: ApiResponse = await response.json();
        
        if (data.status === 'error') {
          throw new Error(data.error?.message || '不明なエラーが発生しました');
        }
        
        setCategories(data.results);
        if (data.results.length > 0) {
          setSelectedCategories([data.results[0].title]);
        }
        setLoading(false);
      } catch (err) {
        setError('情緒的・感覚的要素データの読み込み中にエラーが発生しました');
        setLoading(false);
        console.error(err);
      }
    }

    fetchEmotionalElements();
  }, []);

  // カテゴリが選択された時の処理
  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      // すでに選択されている場合は削除し、関連する要素も削除
      setSelectedCategories(selectedCategories.filter(item => item !== category));
      setSelectedElements(selectedElements.filter(item => item.category !== category));
    } else {
      // 選択されていない場合は追加（最大3つまで）
      if (selectedCategories.length < 3) {
        setSelectedCategories([...selectedCategories, category]);
      }
    }
  };

  // 要素が選択された時の処理
  const handleElementToggle = (category: string, element: string) => {
    const elementKey = { category, element };
    const isSelected = selectedElements.some(
      item => item.category === category && item.element === element
    );

    if (isSelected) {
      // すでに選択されている場合は削除
      setSelectedElements(
        selectedElements.filter(
          item => !(item.category === category && item.element === element)
        )
      );
    } else {
      // 選択されていない場合は追加（カテゴリごとに最大2つまで）
      const categoryElementsCount = selectedElements.filter(
        item => item.category === category
      ).length;

      if (categoryElementsCount < 2) {
        setSelectedElements([...selectedElements, elementKey]);
      }
    }
  };

  // 特定のカテゴリで選択されている要素を取得
  const getSelectedElementsForCategory = (category: string) => {
    return selectedElements
      .filter(item => item.category === category)
      .map(item => item.element);
  };

  // カテゴリ情報を取得
  const getCategoryInfo = (categoryTitle: string) => {
    return categories.find(category => category.title === categoryTitle);
  };

  if (loading) {
    return <div>情緒的・感覚的要素データを読み込み中...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <div className={styles.menuContainer}>
          <h2 className={styles.menuTitle}>カテゴリ（最大3つ選択可能）</h2>
          <ul className={styles.menuList}>
            {categories.map((category) => (
              <li 
                key={category.title} 
                className={`${styles.menuItem} ${selectedCategories.includes(category.title) ? styles.active : ''}`}
                onClick={() => handleCategoryToggle(category.title)}
              >
                {category.title}
              </li>
            ))}
          </ul>
        </div>
        
        {selectedCategories.length > 0 && (
          <div className={styles.selectedCategoriesContainer}>
            {selectedCategories.map(categoryTitle => {
              const categoryInfo = getCategoryInfo(categoryTitle);
              if (!categoryInfo) return null;
              
              const categoryElements = getSelectedElementsForCategory(categoryTitle);
              
              return (
                <div key={categoryTitle} className={styles.categoryOptionsContainer}>
                  <h3 className={styles.categoryTitle}>{categoryTitle}</h3>
                  <p className={styles.optionsSubtitle}>主な要素（最大2つ選択可能）</p>
                  <div className={styles.optionsList}>
                    {categoryInfo.options.map((option) => (
                      <div 
                        key={`${categoryTitle}-${option.text}`} 
                        className={`${styles.optionItem} ${categoryElements.includes(option.text) ? styles.selected : ''}`}
                        onClick={() => handleElementToggle(categoryTitle, option.text)}
                      >
                        <div className={styles.optionText}>{option.text}</div>
                        {option.description && (
                          <div className={styles.optionDescription}>（{option.description}）</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.rightPanel}>
        {selectedElements.length > 0 ? (
          <div className={styles.contentDetails}>
            <h2 className={styles.contentTitle}>
              選択された要素（{selectedElements.length}個）
            </h2>
            
            <div className={styles.selectedElementsList}>
              {selectedElements.map((item, index) => {
                const categoryInfo = getCategoryInfo(item.category);
                return (
                  <div key={index} className={styles.selectedElementItem}>
                    <span className={styles.categoryLabel}>{item.category}:</span> {item.element}
                  </div>
                );
              })}
            </div>
            
            {selectedCategories.map(categoryTitle => {
              const categoryInfo = getCategoryInfo(categoryTitle);
              if (!categoryInfo) return null;
              
              const categoryElements = getSelectedElementsForCategory(categoryTitle);
              if (categoryElements.length === 0) return null;
              
              return (
                <div key={categoryTitle} className={styles.categoryContent}>
                  <h3 className={styles.categoryContentTitle}>{categoryTitle}</h3>
                  
                  <div className={styles.selectedCategoryElements}>
                    {categoryElements.map(elementText => {
                      const elementOption = categoryInfo.options.find(opt => opt.text === elementText);
                      return (
                        <div key={elementText} className={styles.selectedCategoryElement}>
                          <span className={styles.elementText}>{elementText}</span>
                          {elementOption?.description && (
                            <span className={styles.elementDescription}>（{elementOption.description}）</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className={styles.contentSection}>
                    <h4>代表的な活用法</h4>
                    <p>{categoryInfo.usage}</p>
                  </div>
                  
                  <div className={styles.contentSection}>
                    <h4>効果的な使用場面</h4>
                    <ul className={styles.scenesList}>
                      {categoryInfo.effectiveScenes.map((scene, sceneIndex) => (
                        <li key={sceneIndex} className={styles.sceneItem}>{scene}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {categoryElements.length === 2 && (
                    <div className={styles.combinationHint}>
                      <h4>組み合わせのヒント</h4>
                      <p>
                        「{categoryElements[0]}」と「{categoryElements[1]}」を組み合わせることで、
                        より複雑で奥行きのある表現が可能になります。それぞれの要素の特性を活かしながら、
                        バランスを考慮して物語に取り入れることが重要です。
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
            
            {selectedCategories.length > 1 && (
              <div className={styles.crossCategoryHint}>
                <h3>カテゴリ横断の組み合わせヒント</h3>
                <p>
                  複数のカテゴリから要素を選択することで、より立体的で多面的な表現が可能になります。
                  例えば、「愛情表現」と「雰囲気演出」を組み合わせることで、恋愛シーンにより深みのある
                  情緒を加えることができます。各カテゴリの特性を理解し、物語の目的に合わせて効果的に
                  活用しましょう。
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.placeholder}>
            <p>左側のメニューからカテゴリを選択し、各カテゴリから主な要素を選択すると、詳細が表示されます。</p>
            <p>最大3つのカテゴリから、各カテゴリ最大2つずつ、合計最大6つの要素を選択できます。</p>
          </div>
        )}
      </div>
    </div>
  );
}
