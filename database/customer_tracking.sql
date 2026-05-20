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
  route_path TEXT,
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
