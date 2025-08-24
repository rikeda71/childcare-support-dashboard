-- SwitchBotセンサーデータテーブル
CREATE TABLE IF NOT EXISTS switchbot_sensors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  temperature REAL,
  humidity INTEGER,
  battery_level INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),

  -- インデックス用
  INDEX idx_switchbot_timestamp (timestamp),
  INDEX idx_switchbot_device_timestamp (device_id, timestamp DESC)
);

-- データ保持期間管理用のビュー（直近30日分）
CREATE VIEW IF NOT EXISTS recent_switchbot_sensors AS
SELECT * FROM switchbot_sensors
WHERE timestamp > unixepoch() - (30 * 24 * 60 * 60);