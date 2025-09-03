-- 室内センサーデータ用テーブル
CREATE TABLE IF NOT EXISTS indoor_sensors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  temperature REAL NOT NULL,
  humidity INTEGER NOT NULL,
  battery INTEGER,
  raw_data TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- タイムスタンプとデバイスIDでのクエリ用インデックス
CREATE INDEX IF NOT EXISTS idx_indoor_sensors_timestamp ON indoor_sensors(timestamp);