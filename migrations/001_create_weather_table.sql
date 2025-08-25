-- 気象データテーブル
CREATE TABLE IF NOT EXISTS weather (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
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
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- インデックスを別途作成
CREATE INDEX IF NOT EXISTS idx_weather_timestamp ON weather (timestamp);
CREATE INDEX IF NOT EXISTS idx_weather_lat_lon_timestamp ON weather (latitude, longitude, timestamp DESC);

-- データ保持期間管理用のビュー（直近30日分）
CREATE VIEW IF NOT EXISTS recent_weather AS
SELECT * FROM weather
WHERE timestamp > unixepoch() - (30 * 24 * 60 * 60);