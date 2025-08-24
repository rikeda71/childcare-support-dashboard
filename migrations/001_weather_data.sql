-- Weather data table
CREATE TABLE IF NOT EXISTS weather (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  location_id TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  temperature REAL NOT NULL,
  feels_like REAL,
  temp_min REAL,
  temp_max REAL,
  humidity INTEGER,
  pressure INTEGER,
  wind_speed REAL,
  wind_deg INTEGER,
  weather_main TEXT,
  weather_description TEXT,
  visibility INTEGER,
  cloudiness INTEGER,
  sunrise INTEGER,
  sunset INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_weather_timestamp ON weather(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_weather_created_at ON weather(created_at);
