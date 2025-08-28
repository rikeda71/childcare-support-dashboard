# 技術スタックとアーキテクチャ

## コア技術スタック

### ランタイム＆デプロイメント

- **Deno**: 開発とテストのプライマリランタイム
- **Cloudflare Workers**: 本番デプロイメントプラットフォーム
- **Cloudflare D1**: SQLiteベースの時系列データストレージ

### データ可視化

- **Grafana**: 時系列データの可視化とモニタリング
  - Grafana Cloud を利用

### 外部API

- **SwitchBot API**: スマートデバイス管理
- **OpenWeatherMap API**: 気象データ統合
- **Google Drive API**: ぴよログデータ同期

## 開発標準

### コードスタイル＆フォーマッティング

- **Deno標準**: Denoの組み込みフォーマッターとリンターに従う

  ```bash
  deno fmt    # コードフォーマット
  deno lint   # コード品質チェック
  ```

- **Import Maps**: deno.jsonで依存関係管理
- **package.json不使用**: DenoのURLベースインポートを活用

### 命名規則（Readable Code原則）

- **明確で具体的な名前**: `getData` → `fetchWeather`
- **不要な接尾辞を避ける**: `Weather` → `weather`
- **ブール値は疑問形**: `isValid`, `hasError`, `canRetry`
- **単位を含める**: `delayMs`, `timeoutSeconds`, `maxRetries`
- **意図を表現**: `result` → `weatherRecord`, `data` → `temperature`
- **一貫性を保つ**: fetch/get, create/make, find/searchを統一

### プログラミングパラダイム

#### 関数型プログラミングファースト

- **純粋関数**: 副作用のない関数を優先
- **不変性**: `const`宣言を使用し、ミューテーションを避ける
- **関数合成**: シンプルな関数から複雑なロジックを構築
- **クラス不使用**: クラスベースのOOPパターンを避ける

#### 型駆動開発

```typescript
// ドメイン型
export interface Weather {
  readonly timestamp: number;
  readonly temperature: number;
  readonly humidity: number;
  readonly locationId: string;
}

// 関数型
export type DataProcessor<T, R> = (data: T) => R;
export type DataValidator<T> = (data: unknown) => data is T;

// 関数型ドメインモデリング
export const processWeather: DataProcessor<Weather, ProcessedData> =
  (data) => ({
    ...data,
    processedAt: Date.now(),
  });
```

## データアーキテクチャ

### Cloudflare D1設計原則

#### 時系列データ構造

```sql
-- 効率的なクエリのための時間パーティショニング
CREATE TABLE weather_metrics (
  timestamp INTEGER NOT NULL,
  metric_type TEXT NOT NULL,
  value REAL NOT NULL,
  metadata TEXT,
  PRIMARY KEY (timestamp, metric_type)
);

-- 時間範囲クエリ用インデックス
CREATE INDEX idx_weather_timestamp ON weather_metrics(timestamp);
```

#### ストレージ管理

- **D1制限**: データベースあたり10GB、クエリ結果あたり500MB
- **保持ポリシー**:
  - ホットデータ: 直近7日間（フル解像度）
  - ウォームデータ: 7-30日（時間単位の集計）
  - コールドデータ: 30日以上（日単位の集計）
  - 自動削除: 90日以上古いデータ

#### データ保持の実装

```typescript
interface RetentionPolicy {
  readonly hotDataDays: 7;
  readonly warmDataDays: 30;
  readonly coldDataDays: 90;
}

type AggregateData = (
  data: ReadonlyArray<TimeSeriesPoint>,
  interval: "hour" | "day"
) => ReadonlyArray<AggregatedPoint>;

type PurgeOldData = (
  db: D1Database,
  olderThanDays: number
) => Promise<void>;
```

## API設計パターン

### 関数型APIクライアント

```typescript
// 依存性注入を使用した純粋関数としてのAPIクライアント
interface ApiConfig {
  readonly apiKey: string;
  readonly baseUrl: string;
}

type ApiClient<T> = (config: ApiConfig) => (
  endpoint: string,
  params?: Record<string, unknown>
) => Promise<T>;

// 使用例
const createWeatherClient: ApiClient<WeatherResponse> =
  (config) => async (endpoint, params) => {
    // 実装
  };
```

### エラーハンドリング

```typescript
// 明示的なエラーハンドリングのためのResult型
type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

type ApiCall<T> = () => Promise<Result<T>>;
```

## Cloudflare Workers統合

### Worker構造

```typescript
interface Env {
  readonly DB: D1Database;
  readonly SWITCHBOT_API_KEY: string;
  readonly OPENWEATHER_API_KEY: string;
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    // 関数型バッチ処理
  },

  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    // 関数型パイプラインでのリクエスト処理
  },
};
```

### データ収集のためのCronジョブ

```toml
# wrangler.toml
[triggers]
crons = [
  "*/5 * * * *",  # 5分ごとにデバイスメトリクス
  "0 * * * *",    # 毎時気象データ
  "0 2 * * *",    # 毎日午前2時にデータ集計
  "0 3 * * 0",    # 週次で古いデータ削除
]
```

## テスト戦略

### Denoテストフレームワーク

```typescript
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

Deno.test("processWeatherが正しく変換する", () => {
  const input: Weather = {
    timestamp: 1234567890,
    temperature: 25.5,
    humidity: 60,
    locationId: "room1",
  };

  const result = processWeather(input);

  assertEquals(result.temperature, 25.5);
});
```

### テスト構成

- ユニットテスト: ソースファイルの隣（`*.test.ts`）
- 統合テスト: `tests/integration/`
- E2Eテスト: `tests/e2e/`

## セキュリティ考慮事項

### 環境変数

- APIキーにはCloudflare Secretsを使用
- クレデンシャルをコミットしない
- すべての外部入力を検証

### データプライバシー

- 個人データを匿名化
- データアクセス制御の実装
- 定期的なセキュリティ監査

## パフォーマンス最適化

### クエリ最適化

- プリペアドステートメントを使用
- 大量データのバッチインサート
- クエリ結果のキャッシング実装

### Worker最適化

- コールドスタートの最小化
- キャッシングにWorkers KVを使用
- リクエスト結合の実装

## モニタリング＆可観測性

### メトリクス収集

- Worker実行時間
- APIレスポンスタイム
- データベースクエリパフォーマンス
- データ取り込み率

### アラート

- API呼び出し失敗
- ストレージ閾値警告
- データ保持違反
