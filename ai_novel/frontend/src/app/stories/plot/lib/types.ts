export interface PlotData {
  id?: number;
  storyId?: string;
  act: number;
  act_number?: number;
  title: string;
  content: string;
  detailedContent?: string;
  raw_content?: string;
  status?: string;
  is_edited?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BasicSetting {
  id?: number;
  storyId?: string;
  act1_overview?: string;
  act2_overview?: string;
  act3_overview?: string;
  raw_content?: string;
}
