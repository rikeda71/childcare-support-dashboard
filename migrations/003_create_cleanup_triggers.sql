-- 古いデータを自動削除するトリガー
-- 注: Cloudflare D1ではトリガーのサポートが限定的なため、
-- 定期的なクリーンアップはWorkerで実装する必要があります

-- クリーンアップ記録テーブル
CREATE TABLE IF NOT EXISTS cleanup_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  deleted_count INTEGER NOT NULL,
  oldest_timestamp INTEGER,
  newest_timestamp INTEGER,
  executed_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- クリーンアップ用のストアドプロシージャ的なビュー
-- 削除対象データを特定するためのビュー
CREATE VIEW IF NOT EXISTS weather_to_delete AS
SELECT id, timestamp FROM weather
WHERE timestamp < unixepoch() - (30 * 24 * 60 * 60);

CREATE VIEW IF NOT EXISTS switchbot_to_delete AS
SELECT id, timestamp FROM switchbot_sensors
WHERE timestamp < unixepoch() - (30 * 24 * 60 * 60);