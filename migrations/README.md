# データベースマイグレーション

## セットアップ手順

### 1. D1データベースの作成

```bash
# 本番環境用
wrangler d1 create childcare-dashboard

# 開発環境用（ローカル）
wrangler d1 create childcare-dashboard-dev
```

### 2. wrangler.tomlの設定

作成されたデータベースIDを`wrangler.toml`に設定：

```toml
[[d1_databases]]
binding = "DB"
database_name = "childcare-dashboard"
database_id = "your-database-id-here"
```

### 3. マイグレーションの実行

```bash
# 本番環境
wrangler d1 execute childcare-dashboard --file=./migrations/001_create_weather_table.sql
wrangler d1 execute childcare-dashboard --file=./migrations/002_create_switchbot_table.sql
wrangler d1 execute childcare-dashboard --file=./migrations/003_create_cleanup_triggers.sql

# ローカル環境
wrangler d1 execute childcare-dashboard --local --file=./migrations/001_create_weather_table.sql
wrangler d1 execute childcare-dashboard --local --file=./migrations/002_create_switchbot_table.sql
wrangler d1 execute childcare-dashboard --local --file=./migrations/003_create_cleanup_triggers.sql
```

## テーブル構造

### weather テーブル

- 気象データを保存
- 30日間のデータ保持（古いデータは自動削除）
- location_idとtimestampでインデックス化

### switchbot_sensors テーブル

- SwitchBotセンサーデータを保存
- 30日間のデータ保持（古いデータは自動削除）
- device_idとtimestampでインデックス化

### cleanup_logs テーブル

- データクリーンアップの実行ログ
- 削除されたレコード数と期間を記録

## データ保持ポリシー

- デフォルト: 30日間
- Cloudflare D1の容量制限: 500MB
- 推定データサイズ:
  - 気象データ: 約1KB/レコード × 24回/日 × 30日 = 約720KB
  - SwitchBotデータ: 約0.5KB/レコード × 288回/日 × 30日 = 約4.3MB
  - 合計: 約5MB（十分な余裕あり）

## メンテナンス

定期的なクリーンアップはWorkerで実装（`workers/data-cleanup/`）
