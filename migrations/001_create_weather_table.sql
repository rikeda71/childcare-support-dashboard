-- 気象データテーブル
CREATE TABLE IF NOT EXISTS weathers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  location_id TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  temperature REAL NOT NULL,
  feels_like REAL NOT NULL,
  temp_min REAL NOT NULL,
  temp_max REAL NOT NULL,
  humidity INTEGER NOT NULL,
  pressure INTEGER NOT NULL,
  wind_speed REAL NOT NULL,
  wind_deg INTEGER NOT NULL,
  weather_main TEXT NOT NULL,
  weather_description TEXT NOT NULL,
  visibility INTEGER NOT NULL,
  cloudiness INTEGER NOT NULL,
  sunrise INTEGER,
  sunset INTEGER,
  raw_data TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),

  -- インデックス用
  INDEX idx_weathers_timestamp (timestamp),
  INDEX idx_weathers_location_timestamp (location_id, timestamp DESC)
);

-- データ保持期間管理用のビュー（直近30日分）
CREATE VIEW IF NOT EXISTS recent_weather AS
SELECT * FROM weathers
WHERE timestamp > unixepoch() - (30 * 24 * 60 * 60);