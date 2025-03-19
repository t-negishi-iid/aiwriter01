/**
 * APIレスポンスの型定義
 */
export interface ApiResponse<T = any> {
  success: boolean | string;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  // DRF標準ページネーション対応
  count?: number;
  next?: string | null;
  previous?: string | null;
  status?: string;
  statusText?: string;
  meta?: Record<string, any>;
  results?: T[];
  error?: {
    message?: string;
    details?: string;
  };
}

/**
 * ストーリーの型定義
 */
export interface Story {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  status: StoryStatus;
}

/**
 * ストーリーの状態を表す型
 */
export type StoryStatus =
  | "init" // 初期状態
  | "basic_setting_data_ready" // 基本設定データ作成済み
  | "basic_setting_ready" // 基本設定作成済み
  | "character_ready" // キャラクター詳細作成済み
  | "plot_ready" // あらすじ作成済み
  | "episode_ready" // エピソード詳細作成済み
  | "content_ready" // 小説本文作成済み
  | "completed"; // 完了

/**
 * 基本設定作成用データの型定義
 */
export interface BasicSettingData {
  genre: string; // ジャンル
  theme: string; // テーマ
  setting: string; // 舞台設定
  era: string; // 時代
  emotions: string[]; // 情緒的要素
  plot_type: string; // プロットタイプ
  mystery: string; // 過去の謎
  additional_info?: string; // 追加情報
}

/**
 * 基本設定の型定義
 */
export interface BasicSetting {
  id: number;
  story: number;
  title: string; // 小説のタイトル
  concept: string; // コンセプト
  world_setting: string; // 世界観設定
  main_plot: string; // メインプロット
  story_setting: string; // 作品設定
  characters: string; // 登場人物設定
  plot_overview: string; // あらすじ概要
  act1_overview: string; // 第1幕概要
  act2_overview: string; // 第2幕概要
  act3_overview: string; // 第3幕概要
  created_at: string;
  updated_at: string;
}

/**
 * キャラクターの型定義
 */
export interface Character {
  id: number;
  story: number;
  name: string; // キャラクター名
  role: string; // 役割
  age: string; // 年齢
  gender: string; // 性別
  appearance: string; // 外見
  personality: string; // 性格
  background: string; // 背景
  goal: string; // 目標
  conflict: string; // 葛藤
  development: string; // 成長
  relationship: string; // 他キャラクターとの関係
  created_at: string;
  updated_at: string;
}

/**
 * キャラクター詳細の型定義
 */
export interface CharacterDetail {
  id: number;
  ai_story: Story;
  name: string;
  role: string;
  age?: string;
  gender?: string;
  appearance?: string;
  personality?: string;
  background?: string;
  motivation?: string;
  relationship?: string;
  development?: string;
  raw_content: string;
  created_at: string;
  updated_at: string;
}

/**
 * キャラクター詳細作成用の型定義
 */
export interface CharacterDetailCreate {
  name: string;
  role: string;
  age?: string;
  gender?: string;
  appearance?: string;
  personality?: string;
  background?: string;
  motivation?: string;
  relationship?: string;
  development?: string;
  raw_content: string;
}

/**
 * あらすじの型定義
 */
export interface PlotDetail {
  id: number;
  story: number;
  overview: string; // 概要
  story_structure: string; // 物語構造
  act1: string; // 第1幕
  act2: string; // 第2幕
  act3: string; // 第3幕
  climax: string; // クライマックス
  theme_development: string; // テーマ展開
  created_at: string;
  updated_at: string;
}

/**
 * エピソードの型定義
 */
export interface Episode {
  id: number;
  story: number;
  number: number; // エピソード番号
  title: string; // エピソードタイトル
  summary: string; // 要約
  scene_description: string; // シーン描写
  conflict: string; // 葛藤
  character_development: string; // キャラクター成長
  foreshadowing: string; // 伏線
  created_at: string;
  updated_at: string;
}

/**
 * エピソード本文の型定義
 */
export interface EpisodeContent {
  id: number;
  episode: number;
  content: string; // 本文
  created_at: string;
  updated_at: string;
}

/**
 * タスクステータスの型定義
 */
export interface TaskStatus {
  task_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  result?: any;
  error?: string;
  progress?: number;
  created_at: string;
  updated_at: string;
}

/**
 * エラーレスポンスの型定義
 */
export interface ErrorResponse {
  detail: string;
  code?: string;
  errors?: Record<string, string[]>;
}
