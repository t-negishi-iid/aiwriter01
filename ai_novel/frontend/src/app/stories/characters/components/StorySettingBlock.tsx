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
        <h2 className="text-xl font-semibold">作品設定</h2>
      </div>
      <div className={styles.settingBlockContent}>
        <p className="text-gray-600 mb-2">作品設定の登場人物情報</p>
        <Textarea
          className={styles.charactersMark}
          value={charactersMarkdown}
          readOnly
          rows={6}
        />

        {basicSetting?.raw_content && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">BasicSetting の raw_content</h3>
            <Textarea
              className={styles.charactersMark}
              value={basicSetting.raw_content}
              readOnly
              rows={10}
            />
          </div>
        )}

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
