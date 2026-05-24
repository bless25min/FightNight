CREATE TABLE IF NOT EXISTS tracking_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  anonymous_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_id TEXT,
  event_value REAL,
  currency TEXT DEFAULT 'TWD',
  source_url TEXT,
  referrer TEXT,
  referrer_host TEXT,
  route_path TEXT,
  landing_path TEXT,
  first_landing_path TEXT,
  source_channel TEXT,
  first_source_channel TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  click_id_type TEXT,
  click_id_value TEXT,
  device_type TEXT,
  browser_name TEXT,
  os_name TEXT,
  in_app_browser TEXT,
  browser_language TEXT,
  timezone TEXT,
  visitor_type TEXT,
  session_index INTEGER,
  viewport_width INTEGER,
  viewport_height INTEGER,
  screen_width INTEGER,
  screen_height INTEGER,
  duration_ms INTEGER,
  scroll_depth INTEGER,
  max_scroll_depth INTEGER,
  interaction_count INTEGER,
  is_bounce INTEGER,
  section_id TEXT,
  cta_id TEXT,
  target_text TEXT,
  cf_country TEXT,
  cf_region TEXT,
  cf_city TEXT,
  cf_continent TEXT,
  cf_timezone TEXT,
  cf_colo TEXT,
  cf_asn INTEGER,
  cf_as_organization TEXT,
  cf_ray TEXT,
  cf_http_protocol TEXT,
  cf_tls_version TEXT,
  payload_json TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tracking_events_event_id
ON tracking_events (event_id);

CREATE INDEX IF NOT EXISTS idx_tracking_events_created_at
ON tracking_events (created_at);

CREATE INDEX IF NOT EXISTS idx_tracking_events_name_created
ON tracking_events (event_name, created_at);

CREATE INDEX IF NOT EXISTS idx_tracking_events_anonymous
ON tracking_events (anonymous_id, created_at);

CREATE INDEX IF NOT EXISTS idx_tracking_events_source_created
ON tracking_events (source_channel, created_at);

CREATE INDEX IF NOT EXISTS idx_tracking_events_route_created
ON tracking_events (route_path, created_at);

CREATE TABLE IF NOT EXISTS line_customers (
  line_user_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  picture_url TEXT,
  status_message TEXT,
  is_friend INTEGER NOT NULL DEFAULT 0,
  access_count INTEGER NOT NULL DEFAULT 1,
  raw_profile_json TEXT,
  first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_line_customers_last_seen
ON line_customers (last_seen_at);

CREATE TABLE IF NOT EXISTS liff_access_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  line_user_id TEXT NOT NULL,
  placement TEXT,
  source_path TEXT,
  is_friend INTEGER NOT NULL DEFAULT 0,
  raw_profile_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (line_user_id) REFERENCES line_customers(line_user_id)
);

CREATE INDEX IF NOT EXISTS idx_liff_access_events_user
ON liff_access_events (line_user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_liff_access_events_created_at
ON liff_access_events (created_at);
