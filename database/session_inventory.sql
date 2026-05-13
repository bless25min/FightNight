CREATE TABLE IF NOT EXISTS session_inventory (
  session_id TEXT PRIMARY KEY,
  capacity INTEGER NOT NULL DEFAULT 6,
  sold INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (capacity >= 0),
  CHECK (sold >= 0),
  CHECK (sold <= capacity)
);

CREATE INDEX IF NOT EXISTS idx_session_inventory_updated_at
ON session_inventory (updated_at);
