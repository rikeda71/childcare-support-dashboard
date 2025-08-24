# OpenWeatherMap API統合 - 要件定義

## 1. 機能要件

### 1.1 APIクライアント実装

#### 基本機能
- OpenWeatherMap Current Weather Data APIの呼び出し
- APIレスポンスの型安全な処理
- エラーハンドリングとリトライ機構

#### 取得データ
- **現在の気象情報**
  - 気温（現在値、体感温度、最高/最低）
  - 湿度
  - 気圧
  - 風速・風向
  - 天候状態（晴れ、曇り、雨など）
  - UV指数（別APIエンドポイント）

#### APIエンドポイント
```
GET https://api.openweathermap.org/data/2.5/weather
パラメータ:
- lat: 緯度（環境変数から取得）
- lon: 経度（環境変数から取得）
- units: metric（摂氏）
- lang: ja（日本語）
- appid: APIキー
```

#### 設定管理
```typescript
// Worker環境変数
interface Env {
  readonly DB: D1Database;
  readonly OPENWEATHER_API_KEY: string;
  readonly WEATHER_LATITUDE: string;  // 例: "35.6762"（東京）
  readonly WEATHER_LONGITUDE: string; // 例: "139.6503"
}
```

### 1.2 データ収集Worker

#### スケジューリング
- 1時間ごとに定期実行（Cron: `0 * * * *`）
- 手動実行のサポート（デバッグ用）

#### データ処理フロー
1. 環境変数から緯度経度を取得
2. OpenWeatherMap APIからデータ取得
3. データのバリデーション
4. 正規化（統一フォーマットへの変換）
5. Cloudflare D1への保存
6. 実行ログの記録

### 1.3 データ永続化

#### D1スキーマ設計
```sql
CREATE TABLE weather_data (
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
  created_at INTEGER DEFAULT (unixepoch()),
  INDEX idx_timestamp (timestamp),
  INDEX idx_location_timestamp (location_id, timestamp)
);
```

## 2. 非機能要件

### 2.1 パフォーマンス
- API応答時間: 500ms以下（95パーセンタイル）
- Worker実行時間: 10秒以内
- メモリ使用量: 128MB以下

### 2.2 信頼性
- データ収集成功率: 99.9%以上
- APIタイムアウト: 5秒
- リトライ: 最大3回（指数バックオフ）

### 2.3 セキュリティ
- APIキーの安全な管理（環境変数）
- HTTPSによる通信
- 入力データのバリデーション

### 2.4 拡張性
- 複数地点のサポート（将来対応）
- 他の気象APIへの切り替え可能な設計
- データフォーマットの後方互換性

## 3. 制約事項

### 3.1 API制限
- OpenWeatherMap Free Tier
  - 60 calls/minute
  - 1,000,000 calls/month
  - Current weather dataのみ（予報は含まない）

### 3.2 Cloudflare制限
- Workers実行時間: 30秒（有料プラン）
- D1クエリサイズ: 最大1MB
- D1データベース: 最大10GB

## 4. データモデル

### 4.1 入力（OpenWeatherMap APIレスポンス）
```typescript
interface OpenWeatherResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
  };
  dt: number;
  sys: {
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
}
```

### 4.2 出力（正規化データ）
```typescript
interface WeatherData {
  timestamp: number;
  locationId: string;
  latitude: number;
  longitude: number;
  temperature: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDeg: number;
  weatherMain: string;
  weatherDescription: string;
  visibility: number;
  sunrise?: number;
  sunset?: number;
}
```

## 5. エラー処理

### 5.1 エラーケース
- APIキー無効
- API制限超過
- ネットワークエラー
- 不正なレスポンス形式
- D1書き込みエラー
- 環境変数未設定

### 5.2 エラー対応
- ログ記録（構造化ログ）
- メトリクス送信（成功/失敗率）
- アラート（将来実装）

## 6. テスト要件

### 6.1 単体テスト
- APIクライアント関数
- データ変換関数
- バリデーション関数
- エラーハンドリング

### 6.2 テストカバレッジ
- 目標: 80%以上
- 重要パス: 100%

## 7. 依存関係

### 7.1 外部サービス
- OpenWeatherMap API
- Cloudflare Workers
- Cloudflare D1

### 7.2 内部モジュール
- 共有型定義（shared/types）
- データベースクエリ（shared/db）
- 共有関数（shared/）

## 8. 設定例

### 8.1 wrangler.toml
```toml
name = "weather-collector"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[triggers]
crons = ["0 * * * *"] # 毎時実行

[[d1_databases]]
binding = "DB"
database_name = "childcare-dashboard"
database_id = "xxx-xxx-xxx"

[vars]
WEATHER_LATITUDE = "35.6762"   # 東京の緯度
WEATHER_LONGITUDE = "139.6503"  # 東京の経度
LOCATION_NAME = "Tokyo"         # 場所の識別名
```