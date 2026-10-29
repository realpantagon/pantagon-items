-- Pantagon Items lives in the shared PANTAGON_PERSONAL D1 database
CREATE TABLE IF NOT EXISTS items (
  id                   TEXT PRIMARY KEY,
  name                 TEXT NOT NULL,
  tags                 TEXT NOT NULL DEFAULT '[]', -- JSON array of strings
  buy_date             TEXT NOT NULL,              -- YYYY-MM-DD
  buy_price            REAL NOT NULL DEFAULT 0,
  extra_cost           REAL NOT NULL DEFAULT 0,
  extra_cost_details   TEXT NOT NULL DEFAULT '[]', -- JSON array of {id,label,amount,date}
  sell_date            TEXT,
  sell_price           REAL,
  status               TEXT NOT NULL DEFAULT 'owned' CHECK (status IN ('owned', 'sold')),
  purchase_source      TEXT,
  warranty_expire_date TEXT,
  reason_to_sell       TEXT,
  note                 TEXT,
  daily_burn           INTEGER NOT NULL DEFAULT 1,
  rating               INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  created_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_items_buy_date ON items(buy_date);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
