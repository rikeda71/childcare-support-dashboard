# デプロイメント設定ガイド

## GitHub Actions CI/CD パイプライン

このプロジェクトではGitHub Actionsを使用してCloudflare Workersへの自動デプロイを行います。

## 必要なシークレット設定

GitHubリポジトリの Settings > Secrets and variables > Actions で以下のシークレットを設定する必要があります：

### CLOUDFLARE_API_TOKEN（必須）

Cloudflare APIトークンの取得手順：

1. [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)にアクセス
2. 「Create Token」をクリック
3. 「Custom token」を選択し、以下の権限を設定：
   - **Account**: Cloudflare Workers Scripts:Edit
   - **Account**: D1:Edit
   - **Zone**: Zone:Read（必要に応じて）
4. Account Resources で対象のアカウントを選択
5. トークンを生成し、GitHubシークレットに `CLOUDFLARE_API_TOKEN` として保存

**重要**: D1データベースの操作には `D1:Edit` 権限が必須です。この権限がないと `Authentication error [code: 10000]` が発生します。

## ワークフロー構成

### メインワークフロー: deploy-workers.yml

```yaml
パス: .github/workflows/deploy-workers.yml
```

このワークフローは以下のWorkerを管理します：

- Weather Collector Worker
- Metrics Exporter Worker
- Database Migrations

#### トリガー条件

- `main`ブランチへのpush
- 対象ディレクトリに変更があった場合のみデプロイ

#### ジョブ構成

1. **detect-changes**: 変更検出
   - dorny/paths-filterを使用して変更されたWorkerを特定

2. **deploy-weather-collector**: Weather Collectorのデプロイ
   - 条件: `workers/weather-collector/`または`shared/`に変更がある場合

3. **deploy-metrics-exporter**: Metrics Exporterのデプロイ
   - 条件: `workers/metrics-exporter/`または`shared/`に変更がある場合

4. **run-migrations**: データベースマイグレーション
   - 条件: `migrations/`に変更がある場合

5. **notify-deployment**: デプロイサマリー
   - 全ジョブの結果をまとめて表示

## ローカル開発環境のセットアップ

### Wrangler CLIのインストール

```bash
npm install -g wrangler
```

### 認証設定

```bash
wrangler login
```

### 環境変数の設定

各Workerディレクトリの `.dev.vars` ファイルに環境変数を設定：

```bash
# workers/weather-collector/.dev.vars
OPENWEATHER_API_KEY=your_api_key_here
```

### ローカルでのテスト

```bash
# Weather Collector
cd workers/weather-collector
wrangler dev

# Metrics Exporter
cd workers/metrics-exporter
wrangler dev --local
```

## デプロイコマンド

### 手動デプロイ

```bash
# Weather Collector
cd workers/weather-collector
wrangler deploy

# Metrics Exporter
cd workers/metrics-exporter
wrangler deploy

# Database Migration
wrangler d1 execute childcare-dashboard --file=migrations/001_initial_schema.sql
```

### GitHub Actions経由のデプロイ

mainブランチにpushすると自動的にデプロイされます：

```bash
git add .
git commit -m "feat: update worker configuration"
git push origin main
```

## トラブルシューティング

### デプロイが失敗する場合

1. **API Token権限の確認**
   - Cloudflare APIトークンに必要な権限があることを確認
   - Workers Scripts:EditとD1:Edit権限が必要

2. **wrangler.tomlの確認**
   - `name`フィールドがCloudflareのWorker名と一致
   - `compatibility_date`が適切に設定されている

3. **シークレットの確認**
   ```bash
   # GitHubでシークレットが設定されているか確認
   # Settings > Secrets and variables > Actions
   ```

4. **ログの確認**
   - GitHub Actionsのログで詳細なエラーメッセージを確認
   - `wrangler tail`でWorkerのログを確認

### ローカルテストが動作しない場合

1. **Node.jsバージョン確認**
   ```bash
   node --version  # v20以上を推奨
   ```

2. **Wranglerバージョン確認**
   ```bash
   wrangler --version  # 最新版を推奨
   ```

3. **D1データベースの確認**
   ```bash
   wrangler d1 list
   wrangler d1 execute childcare-dashboard --command "SELECT * FROM weather_data LIMIT 1"
   ```

## セキュリティベストプラクティス

1. **APIトークンの管理**
   - 最小権限の原則に従う
   - 定期的にトークンをローテーション
   - 本番環境と開発環境で異なるトークンを使用

2. **シークレットの取り扱い**
   - `.dev.vars`ファイルは`.gitignore`に追加
   - 環境変数はGitHubシークレットまたはWrangler secretsで管理
   - ログにシークレットを出力しない

3. **デプロイ権限**
   - mainブランチの保護を有効化
   - Pull Requestレビューを必須化
   - 自動デプロイは信頼できるブランチのみ

## 参考リンク

- [Wrangler Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [D1 Database Documentation](https://developers.cloudflare.com/d1/)
