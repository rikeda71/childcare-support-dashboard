# デプロイメント設定

## GitHub Actions設定

### 必要なシークレット

GitHub リポジトリの Settings > Secrets and variables > Actions から以下のシークレットを設定してください：

#### CLOUDFLARE_API_TOKEN

Cloudflare APIトークンの作成手順：

1. [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) にアクセス
2. 「Create Token」をクリック
3. 「Custom token」を選択して以下の権限を設定：

**必要な権限：**
- Account permissions:
  - `Cloudflare Workers Scripts:Edit`
  - `D1:Edit`
- Zone permissions:
  - 不要（Workers は Zone に依存しない）

4. トークンを作成し、GitHubのシークレットに `CLOUDFLARE_API_TOKEN` として保存

## ローカルデプロイ

### 手動デプロイ

```bash
# Weather Collector Worker
cd workers/weather-collector
wrangler deploy

# APIキーの設定（初回のみ）
wrangler secret put OPENWEATHER_API_KEY
```

### データベースマイグレーション

```bash
# 本番環境
wrangler d1 execute childcare-dashboard --remote --file=migrations/001_create_weather_table.sql
wrangler d1 execute childcare-dashboard --remote --file=migrations/002_create_switchbot_table.sql
wrangler d1 execute childcare-dashboard --remote --file=migrations/003_create_cleanup_triggers.sql

# ローカル環境
wrangler d1 execute childcare-dashboard --local --file=migrations/001_create_weather_table.sql
wrangler d1 execute childcare-dashboard --local --file=migrations/002_create_switchbot_table.sql
wrangler d1 execute childcare-dashboard --local --file=migrations/003_create_cleanup_triggers.sql
```

## 自動デプロイ

mainブランチへのプッシュで自動デプロイが実行されます：

- `workers/**` または `shared/**` に変更がある場合：該当Workerが自動デプロイ
- `migrations/**` に変更がある場合：データベースマイグレーションが実行

## デプロイ済みURL

- Weather Collector: https://weather-collector.rikeda71.workers.dev

## Cron実行スケジュール

- Weather Collector: 毎時0分（`0 * * * *`）

## 監視とログ

Cloudflare Dashboardでログを確認：

1. [Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers) にアクセス
2. 該当Workerを選択
3. 「Logs」タブでリアルタイムログを確認

## トラブルシューティング

### デプロイが失敗する場合

1. `CLOUDFLARE_API_TOKEN` が正しく設定されているか確認
2. トークンに必要な権限があるか確認
3. `wrangler.toml` の `account_id` が正しいか確認

### Workerが動作しない場合

1. シークレット（APIキー）が設定されているか確認：
   ```bash
   wrangler secret list
   ```

2. D1データベースが正しくバインドされているか確認：
   ```bash
   wrangler d1 list
   ```

3. ログを確認：
   ```bash
   wrangler tail
   ```