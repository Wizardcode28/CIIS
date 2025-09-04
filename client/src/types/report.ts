export interface ReportData {
  text_for_analysis?: string;
  clean_text?: string;
  sentiment?: string;
  sentiment_score?: number;
  nature?: string;
  topic?: number | string;
  dangerous?: boolean | string;
  created_at?: string;
  score?: number;
  subreddit?: string;
  username?: string;
  url?: string;
  // Support various column name aliases
  [key: string]: any;
}

export type ProcessedReportData = Required<ReportData>;

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface TimelineDataPoint {
  date: string;
  count: number;
}

export type DashboardStatus = 'idle' | 'processing' | 'success' | 'error';