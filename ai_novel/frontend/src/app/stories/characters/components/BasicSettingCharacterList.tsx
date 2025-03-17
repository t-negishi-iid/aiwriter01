import { useState } from 'react';
import { Button } from '@/components/ui/button';
import styles from '../characters.module.css';
import { Loader2, Plus } from 'lucide-react';
import { CharacterData } from '../lib/types';

interface BasicSettingCharacterListProps {
  basicSettingCharacters: CharacterData[];
  isLoading: boolean;
  onCreateCharacter: (character: CharacterData) => void;
}

export function BasicSettingCharacterList({ 
  basicSettingCharacters, 
  isLoading, 
  onCreateCharacter 
}: BasicSettingCharacterListProps) {
  const [showList, setShowList] = useState(true);
  
  return (
    <div className="mb-6">
      <div 
        className={`${styles.sectionHeader} ${showList ? styles.sectionHeaderExpanded : ''}`}
        onClick={() => setShowList(!showList)}
        role="button"
        aria-expanded={showList ? "true" : "false"}
      >
        <span className={styles.expandIcon} aria-hidden="true">
          {showList ? '▼' : '▶'}
        </span>
        <h2 className="text-xl font-semibold">作品設定の登場人物</h2>
      </div>
      
      {showList && (
        <div className="mt-4">
          {basicSettingCharacters.length > 0 ? (
            <>
              <p className="mb-2 text-sm text-gray-600">
                作品設定に以下の登場人物が含まれています。追加ボタンをクリックしてキャラクター情報を作成できます。
              </p>
              
              <ul className="mb-4 space-y-2">
                {basicSettingCharacters.map((character: CharacterData, index: number) => (
                  <li key={index} className="p-3 bg-gray-50 rounded-md flex justify-between items-center">
                    <div>
                      <div className="font-medium">{character.name}</div>
                      <div className="text-sm text-gray-500">{character.raw_content || character.role || '説明なし'}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCreateCharacter(character)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          追加
                        </>
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-gray-500">
              作品設定に登場人物情報が含まれていません。作品設定の作成が必要です。
            </p>
          )}
        </div>
      )}
    </div>
  );
}
