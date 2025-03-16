import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CharacterData } from '../lib/types';
import { CharacterItem } from './CharacterItem';
import styles from '../characters.module.css';

interface CharacterListProps {
  characters: CharacterData[];
  selectedCharacterId?: number;
  onSelect: (character: CharacterData) => void;
  isMobile?: boolean;
}

export function CharacterList({
  characters,
  selectedCharacterId,
  onSelect,
  isMobile
}: CharacterListProps) {
  const [showList, setShowList] = useState(true);

  return (
    <div className="mb-6">

      {showList && (
        <div className="mt-4">
          {characters.length > 0 ? (
            <div className="space-y-4">
              {characters.map((character, index) => (
                <CharacterItem
                  key={character.id || index}
                  character={character}
                  index={index}
                  onSelect={onSelect}
                  isSelected={selectedCharacterId === character.id}
                  isMobile={isMobile}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 mb-4">
              キャラクターがまだ登録されていません。
            </p>
          )}
        </div>
      )}
    </div>
  );
}
