// テーマの型定義
export interface ThemeData {
  selectedTheme?: string;
}

// 時代と場所の型定義
export interface TimePlaceData {
  selectedTimePlace?: string;
}

// 世界観の型定義
export interface WorldSettingData {
  selectedWorldSetting?: string;
}

// 文体の型定義
export interface WritingStyleData {
  selectedStyle?: string;
}

// 情緒的・感覚的要素の型定義
export interface EmotionalElementData {
  category: string;
  element: string;
  description: string;
}

export interface EmotionalElementsData {
  selectedElements?: EmotionalElementData[];
  categories?: {
    title: string;
    options: string[];
    usage: string;
    effectiveScenes: string[];
  }[];
}

// 過去の謎の型定義
export interface PastMysteryData {
  title?: string;
  description?: string;
  events?: string[];
  sections?: { [sectionName: string]: string[] };
}

// プロットパターンの型定義
export interface PlotPatternData {
  title?: string;
  description?: string;
  filename?: string;
  overview?: string;
  sections?: {
    title: string;
    content: string[];
    subsections: {
      title: string;
      content: string[];
    }[];
  }[];
}

// 基本設定データの型定義
export interface BasicSettingData {
  theme?: ThemeData;
  timePlace?: TimePlaceData;
  worldSetting?: WorldSettingData;
  writingStyle?: WritingStyleData;
  emotionalElements?: EmotionalElementsData;
  pastMystery?: PastMysteryData;
  plotPattern?: PlotPatternData;
}
