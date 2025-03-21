'use client';

import { useState, useEffect } from 'react';
import styles from '../page.module.css';

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

interface EmotionalElementsSelectorProps {
  data: any;
  onChange: (data: any) => void;
}

export default function EmotionalElementsSelector({ data, onChange }: EmotionalElementsSelectorProps) {
  const [categories, setCategories] = useState<ElementCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedElements, setSelectedElements] = useState<{category: string; element: string; description: string}[]>([]);

  // 初期化時に選択済み要素を設定
  useEffect(() => {
    if (data?.selectedElements) {
      setSelectedElements(data.selectedElements);
    }
  }, [data]);

  // 情緒的要素データの取得
  useEffect(() => {
    const fetchEmotionalElements = async () => {
      try {
        const response = await fetch('/api/tools/emotional-elements');
        if (!response.ok) {
          throw new Error('情緒的・感覚的要素データの取得に失敗しました');
        }
        const data = await response.json();
        setCategories(data.results);
        setLoading(false);
      } catch (error) {
        console.error('情緒的・感覚的要素データ取得エラー:', error);
        setError('情緒的・感覚的要素データの読み込み中にエラーが発生しました。');
        setLoading(false);
      }
    };

    fetchEmotionalElements();
  }, []);

  // 要素の選択処理
  const handleSelectElement = (category: string, element: string, description: string) => {
    // 既に選択されている場合は削除
    const isAlreadySelected = selectedElements.some(
      item => item.category === category && item.element === element
    );

    if (isAlreadySelected) {
      const newSelectedElements = selectedElements.filter(
        item => !(item.category === category && item.element === element)
      );
      setSelectedElements(newSelectedElements);
      updateSelectedData(newSelectedElements);
      return;
    }

    // 同じカテゴリから最大2つまで選択可能
    const sameCategory = selectedElements.filter(item => item.category === category);
    if (sameCategory.length >= 2) {
      alert(`${category}カテゴリからは最大2つまで選択できます。`);
      return;
    }

    // 全体で最大6つまで選択可能
    if (selectedElements.length >= 6) {
      alert('情緒的・感覚的要素は最大6つまで選択できます。');
      return;
    }

    // 選択要素を追加
    const newSelectedElements = [
      ...selectedElements,
      { category, element, description }
    ];
    setSelectedElements(newSelectedElements);
    updateSelectedData(newSelectedElements);
  };

  // 選択要素の削除
  const handleRemoveElement = (category: string, element: string) => {
    const newSelectedElements = selectedElements.filter(
      item => !(item.category === category && item.element === element)
    );
    setSelectedElements(newSelectedElements);
    updateSelectedData(newSelectedElements);
  };

  // 親コンポーネントのデータ更新
  const updateSelectedData = (elements: {category: string; element: string; description: string}[]) => {
    // 選択された要素のカテゴリ情報を取得
    const selectedCategories = new Set(elements.map(el => el.category));
    const categoriesData = categories.filter(cat => selectedCategories.has(cat.title)).map(cat => ({
      title: cat.title,
      usage: cat.usage,
      effectiveScenes: cat.effectiveScenes
    }));
    
    onChange({
      ...data,
      emotionalElements: {
        categories: categoriesData,
        selectedElements: elements
      }
    });
  };

  // カテゴリごとの選択要素数を計算
  const getCategorySelectionCount = (categoryTitle: string) => {
    return selectedElements.filter(item => item.category === categoryTitle).length;
  };

  if (loading) {
    return <div>情緒的・感覚的要素データを読み込み中...</div>;
  }

  if (error) {
    return <div className={styles.errorMessage}>{error}</div>;
  }

  return (
    <div>
      <h2 className={styles.sectionTitle}>情緒的・感覚的要素を選択</h2>
      <p className={styles.sectionDescription}>
        物語に取り入れたい情緒的・感覚的要素を選択してください。各カテゴリから最大2つまで、合計6つまで選択できます。
      </p>
      
      {/* 選択済み要素の表示 */}
      {selectedElements.length > 0 && (
        <div className={styles.selectedElementsList}>
          <h3 className={styles.selectedElementsTitle}>選択済み要素 ({selectedElements.length}/6)</h3>
          {selectedElements.map((item, index) => (
            <div key={index} className={styles.selectedElementItem}>
              <button 
                className={styles.removeButton} 
                onClick={() => handleRemoveElement(item.category, item.element)}
              >
                ×
              </button>
              <span><strong>{item.category}:</strong> {item.element}{item.description ? `（${item.description}）` : ''}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* カテゴリごとの要素表示 */}
      {categories.map((category, categoryIndex) => (
        <div key={categoryIndex} className={styles.categoryContainer}>
          <h3 className={styles.categoryTitle}>
            {category.title} ({getCategorySelectionCount(category.title)}/2)
          </h3>
          
          <div className={styles.elementsGrid}>
            {category.options.map((option, optionIndex) => {
              const isSelected = selectedElements.some(
                item => item.category === category.title && item.element === option.text
              );
              
              return (
                <div 
                  key={optionIndex}
                  className={`${styles.elementItem} ${isSelected ? styles.selectedElement : ''}`}
                  onClick={() => handleSelectElement(category.title, option.text, option.description)}
                >
                  <div className={styles.elementText}>{option.text}</div>
                  {option.description && (
                    <div className={styles.elementDescription}>{option.description}</div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div>
            <p><strong>代表的な活用法:</strong> {category.usage}</p>
            <p><strong>効果的な使用場面:</strong></p>
            <ul className={styles.examplesList}>
              {category.effectiveScenes.map((scene, i) => (
                <li key={i} className={styles.exampleItem}>{scene}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
