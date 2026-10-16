export type HealthStatus = "HEALTHY" | "CHANGED" | "FAILED" | "CHECKING" | "PENDING";

export interface User {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface IgnoredRegion {
  id: number;
  website_id: number;
  selector_type: "css" | "xpath" | "tag";
  selector_value: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface Snapshot {
  id: number;
  website_id: number;
  content_hash: string;
  page_title?: string;
  http_status: number;
  response_time_ms: number;
  text_length: number;
  raw_html_path?: string;
  normalized_text_path?: string;
  screenshot_path?: string;
  created_at: string;
  raw_html?: string;
  normalized_text?: string;
}

export interface DiffChunk {
  type: "equal" | "replace" | "delete" | "insert";
  prev_start: number;
  prev_end: number;
  curr_start: number;
  curr_end: number;
  prev_lines: string[];
  curr_lines: string[];
}

export interface DiffPayload {
  has_changes: boolean;
  similarity_ratio: number;
  change_percentage: number;
  lines_added: number;
  lines_removed: number;
  lines_modified: number;
  summary: string;
  unified_diff: string;
  chunks: DiffChunk[];
  category?: string;
  category_label?: string;
  severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  executive_summary?: string;
  key_entities?: string[];
}

export interface DetectedChange {
  id: number;
  website_id: number;
  previous_snapshot_id?: number;
  current_snapshot_id: number;
  change_percentage: number;
  lines_added: number;
  lines_removed: number;
  summary?: string;
  diff_data_path?: string;
  detected_at: string;
  previous_snapshot?: Snapshot;
  current_snapshot?: Snapshot;
  diff_details?: DiffPayload;
}

export interface Website {
  id: number;
  user_id: number;
  name: string;
  url: string;
  check_interval_minutes: number;
  is_active: boolean;
  status: HealthStatus;
  last_checked_at?: string;
  last_changed_at?: string;
  last_status_code?: number;
  last_error_message?: string;
  min_change_percentage?: number;
  keyword_watchlist?: string;
  notify_on_downtime?: boolean;
  created_at: string;
  updated_at: string;
  ignored_regions?: IgnoredRegion[];
  recent_snapshots?: Snapshot[];
  recent_changes?: DetectedChange[];
}

export type WebsiteUpdateData = Partial<{
  name: string;
  url: string;
  check_interval_minutes: number;
  is_active: boolean;
  min_change_percentage: number;
  keyword_watchlist?: string;
  notify_on_downtime?: boolean;
}>;

export interface NotificationChannel {
  id: number;
  user_id: number;
  channel_type: "email" | "discord" | "telegram";
  name: string;
  config: Record<string, any>;
  is_enabled: boolean;
  created_at: string;
}

export interface NotificationLog {
  id: number;
  change_id: number;
  channel_id: number;
  status: "SENT" | "FAILED" | "PENDING";
  sent_at?: string;
  error_message?: string;
  created_at: string;
}

export interface DashboardSummary {
  status_counts: {
    total: number;
    healthy: number;
    changed: number;
    failed: number;
    checking: number;
    pending: number;
  };
  total_checks_24h: number;
  total_changes_24h: number;
  average_response_time_ms: number;
  recent_activity: Array<{
    id: number;
    website_id: number;
    website_name: string;
    website_url: string;
    event_type: "change_detected" | "baseline_established" | "check_healthy" | string;
    change_percentage?: number;
    lines_added?: number;
    lines_removed?: number;
    text_preview_added?: string[];
    text_preview_removed?: string[];
    tracked_text_snippet?: string;
    summary?: string;
    occurred_at: string;
  }>;
  health_metrics: Array<{
    timestamp: string;
    response_time_ms: number;
    healthy_count: number;
    failed_count: number;
  }>;
}
