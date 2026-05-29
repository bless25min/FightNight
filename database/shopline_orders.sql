CREATE TABLE IF NOT EXISTS course_orders (
  reference_id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending',
  shopline_session_id TEXT,
  shopline_trade_order_id TEXT,
  event_id TEXT,
  course_id TEXT NOT NULL,
  course_name TEXT NOT NULL,
  category TEXT NOT NULL,
  venue_id TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  coach TEXT NOT NULL,
  coach_pricing_tier TEXT NOT NULL,
  route TEXT,
  package_size INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  original_amount_value INTEGER,
  amount_value INTEGER NOT NULL,
  discount_code TEXT,
  discount_label TEXT,
  discount_amount_value INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'TWD',
  session_ids_json TEXT NOT NULL,
  series_dates_json TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  buyer_email TEXT,
  line_user_id TEXT,
  line_display_name TEXT,
  line_picture_url TEXT,
  line_email TEXT,
  line_email_verified INTEGER,
  line_is_friend INTEGER,
  line_context_json TEXT,
  line_payment_notify_status TEXT,
  line_payment_notify_attempted_at TEXT,
  line_payment_notified_at TEXT,
  line_payment_notify_response_json TEXT,
  line_payment_notify_error TEXT,
  source_path TEXT,
  return_url TEXT NOT NULL,
  shopline_session_url TEXT,
  raw_request_json TEXT,
  raw_session_json TEXT,
  raw_webhook_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  paid_at TEXT,
  CHECK (package_size IN (1, 2, 4)),
  CHECK (quantity >= 1),
  CHECK (amount_value >= 0)
);

CREATE INDEX IF NOT EXISTS idx_course_orders_status
ON course_orders (status, updated_at);

CREATE INDEX IF NOT EXISTS idx_course_orders_shopline_session
ON course_orders (shopline_session_id);

CREATE INDEX IF NOT EXISTS idx_course_orders_line_user
ON course_orders (line_user_id, updated_at);
