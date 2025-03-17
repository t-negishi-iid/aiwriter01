'use client';

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import styles from '../characters.module.css';

interface CharacterType {
  id?: number;
  name?: string;
  description?: string;
  role?: string;
  personality?: string;
  appearance?: string;
  background?: string;
  raw_content?: string;
  [key: string]: unknown;
}

interface BasicSettingType {
  story_setting?: string;
  content?: string;
  characters?: CharacterType[];
  raw_content?: string;
  [key: string]: unknown;
}

interface StorySettingBlockProps {
  charactersMarkdown: string;
  onEditClick: () => void;
  basicSetting?: BasicSettingType;
}

export const StorySettingBlock = ({ charactersMarkdown, onEditClick, basicSetting }: StorySettingBlockProps) => {
  return (
    <div className={styles.settingBlock}>
      <div className={styles.settingBlockHeader}>
        <h2 className="text-xl font-semibold">作品設定の登場人物</h2>
      </div>
      <div className={styles.settingBlockContent}>
        <Textarea
          className={styles.charactersMark}
          style={{ width: '100%', height: '170px', minHeight: '100px', boxSizing: 'border-box', padding: '20px', margin: '0' }}
          value={charactersMarkdown}
          readOnly
          rows={6}
        />

        <Button
          variant="outline"
          onClick={onEditClick}
          className="w-full mt-2"
        >
          作品設定を編集
        </Button>
      </div>
    </div>
  );
};
