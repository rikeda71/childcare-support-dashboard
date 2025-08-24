# OpenWeatherMap API統合 - タスクリスト

## フェーズ1: 基盤準備

### 1.1 プロジェクト構造の初期化
- [ ] `workers/weather-collector/` ディレクトリ作成
- [ ] `shared/` ディレクトリ構造作成
- [ ] `migrations/` ディレクトリ作成
- [ ] Deno設定ファイル（`deno.json`）の作成

### 1.2 型定義
- [ ] `shared/types/result.ts` - Result型の実装
- [ ] `shared/types/weather.ts` - 気象データ型定義
- [ ] `workers/weather-collector/src/types.ts` - Worker環境型定義

## フェーズ2: データベース準備

### 2.1 スキーマ定義
- [ ] `migrations/001_weather_data.sql` - weather_dataテーブル作成
- [ ] `scripts/setup-d1.sh` - D1初期設定スクリプト

### 2.2 データベースクエリ
- [ ] `shared/db/weather-queries.ts` - 基本クエリ関数実装
  - [ ] `insertWeatherData` - データ挿入
  - [ ] `getLatestWeatherData` - 最新データ取得
- [ ] `shared/db/weather-queries.test.ts` - クエリ関数のテスト

## フェーズ3: APIクライアント実装

### 3.1 OpenWeatherMapクライアント
- [ ] `shared/api-clients/openweather.ts` - APIクライアント実装
  - [ ] `fetchWeatherData` - メイン関数
  - [ ] `buildWeatherApiUrl` - URL構築
  - [ ] `fetchWithRetry` - リトライ機構
  - [ ] `validateApiResponse` - レスポンス検証
- [ ] `shared/api-clients/openweather.test.ts` - クライアントテスト

## フェーズ4: Worker実装

### 4.1 メインWorker
- [ ] `workers/weather-collector/src/index.ts` - エントリーポイント
  - [ ] scheduled handler - Cron実行
  - [ ] fetch handler - 手動実行（デバッグ用）

### 4.2 ビジネスロジック
- [ ] `workers/weather-collector/src/handler.ts` - メインロジック
  - [ ] `collectWeatherData` - メイン処理
  - [ ] `getWeatherConfig` - 設定取得
  - [ ] `transformToWeatherData` - データ変換
- [ ] `workers/weather-collector/src/handler.test.ts` - ハンドラーテスト

### 4.3 Worker設定
- [ ] `workers/weather-collector/wrangler.toml` - Worker設定ファイル
  - [ ] Cronトリガー設定
  - [ ] D1バインディング
  - [ ] 環境変数設定

## フェーズ5: デプロイメント準備

### 5.1 スクリプト作成
- [ ] `scripts/deploy-weather-collector.sh` - 個別デプロイスクリプト
- [ ] `scripts/test-local.sh` - ローカルテスト実行スクリプト

### 5.2 ドキュメント
- [ ] `workers/weather-collector/README.md` - Worker使用方法
- [ ] 環境変数設定ガイド

## フェーズ6: テストと検証

### 6.1 単体テスト実行
- [ ] APIクライアントのテスト
- [ ] データ変換のテスト
- [ ] エラーハンドリングのテスト

### 6.2 統合テスト
- [ ] ローカル環境でのWorker動作確認
- [ ] 実際のAPIを使用したテスト（開発環境）

### 6.3 デプロイと動作確認
- [ ] Cloudflare Workersへのデプロイ
- [ ] Cronジョブの動作確認
- [ ] D1へのデータ保存確認

## 完了条件

すべてのタスクが完了し、以下が確認できること：

1. **機能要件の充足**
   - 1時間ごとに気象データが自動収集される
   - データがD1に正しく保存される
   - エラー時に適切にログが記録される

2. **非機能要件の充足**
   - API応答時間が500ms以下
   - リトライ機構が正しく動作する
   - テストカバレッジが80%以上

3. **運用準備**
   - デプロイスクリプトが動作する
   - ドキュメントが整備されている
   - 環境変数の設定方法が明確

## 優先順位

1. **必須（MVP）**
   - 型定義
   - APIクライアント基本実装
   - Worker基本実装
   - D1への保存

2. **重要**
   - エラーハンドリング
   - リトライ機構
   - テスト

3. **オプション**
   - 詳細なログ
   - メトリクス収集
   - 複数地点対応の準備

## 見積もり時間

- フェーズ1: 1時間
- フェーズ2: 1時間
- フェーズ3: 2時間
- フェーズ4: 2時間
- フェーズ5: 1時間
- フェーズ6: 1時間

**合計: 約8時間**

## 注意事項

- OpenWeatherMap APIキーの取得が事前に必要
- Cloudflare D1データベースの作成が必要
- Wranglerのセットアップが必要