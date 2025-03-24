import { useState } from 'react';
import styles from '../characters.module.css';
import { CharacterData } from '../lib/types';

interface CharacterItemProps {
  character: CharacterData;
  index: number;
  onSelect: (character: CharacterData) => void;
  isSelected: boolean;
  isMobile?: boolean;
}

export function CharacterItem({ character, index, onSelect, isSelected, isMobile }: CharacterItemProps) {
  // useState内で条件分岐は使用できないため、外部で変数を定義
  const initialExpanded = index === 0;
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(character);

    // モバイル表示の場合は、キャラクター編集タブに切り替え
    if (isMobile) {
      const tabsElement = document.querySelector('[data-value="character-edit"]');
      if (tabsElement) {
        (tabsElement as HTMLElement).click();
      }
    }
  };

  return (
    <div key={character.id || index} className="bg-white rounded-md w-full mb-4">
      <div
        className={`${styles.characterHeader} ${isExpanded ? styles.characterHeaderExpanded : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        aria-expanded={isExpanded ? "true" : "false"}
        aria-controls={`character-content-${character.id || index}`}
      >
        <span className={styles.expandIcon} aria-hidden="true">
          {isExpanded ? '▼' : '▶'}
        </span>
        <h3 className="text-lg font-semibold">{character.name}</h3>
        <span className="text-sm text-gray-500 ml-2">{character.role}</span>
      </div>
      {isExpanded && (
        <div
          id={`character-content-${character.id || index}`}
          className="p-4"
        >
          <div className="grid grid-cols-1 gap-3">
            <div>
              <button
                onClick={handleEditClick}
                className={`px-3 py-1 text-sm rounded-md ${isSelected
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                編集
              </button>

              <textarea
                id={`character-content-${character.id || index}-textarea`}
                className="mt-1 text-sm w-full border-none bg-transparent resize-none outline-none story-textarea th-300"
                value={character.raw_content || ''}
                readOnly
                rows={4}
                aria-label={`${character.name}の設定内容`}
                placeholder="設定内容がありません"
              />
            </div>

            <div className="flex justify-end space-x-2 mt-2">
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
