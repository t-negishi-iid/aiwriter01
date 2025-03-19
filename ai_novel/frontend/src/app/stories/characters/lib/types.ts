// キャラクターデータの型定義
export interface CharacterData {
  id?: number;
  storyId: string | null;
  name: string;
  role: string;
  age?: string;
  gender?: string;
  appearance: string;
  personality: string;
  background: string;
  motivation?: string;
  relationship?: string;
  development?: string;
  raw_content?: string;
  createdAt?: string;
  updatedAt?: string;
}
