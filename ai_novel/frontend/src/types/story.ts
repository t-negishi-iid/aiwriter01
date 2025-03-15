export interface Story {
  id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Episode {
  id: number;
  story: number;
  title: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface EpisodeContent {
  id: number;
  episode: number;
  content: string;
  created_at: string;
  updated_at: string;
}
