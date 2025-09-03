# Grafana Cloud セットアップガイド

## 1. Grafana Cloudアカウントの作成

1. [Grafana Cloud](https://grafana.com/auth/sign-up/create-user?pg=prod-cloud) にアクセス
2. 無料プランでアカウントを作成
3. スタック名を設定（例：`childcare-dashboard`）

## 2. Infinity Datasourceの設定

### Infinity Datasourceプラグインのインストール

1. **プラグインのインストール**
   - Settings → Plugins で「Infinity」を検索
   - 「Infinity」プラグインをインストール（yesoreyeram-infinity-datasource）

2. **データソースの追加**
   - Configuration → Data Sources → Add data source
   - 「Infinity」を選択
   - 以下の設定を行う：

     ```txt
     Name: childcare-datasource
     Base URL: (空白のまま)
     ```

   - 認証設定は不要（APIは公開エンドポイント）

3. **接続テスト**
   - 「Save & Test」をクリック
   - 「Success」と表示されれば成功

## 3. ダッシュボードのインポート

### 自動インポート方法

1. Grafana Cloudにログイン
2. 左メニューから「Dashboards」→「New」→「Import」
3. `/grafana/dashboard.json`の内容をコピーしてペースト
4. Data sourceの選択で「childcare-datasource」が自動的に選択される
5. 「Import」をクリック

### 手動でのパネル設定

各パネルでInfinity datasourceを使用する際の設定：

#### 現在値表示（Statパネル）

```json
設定例（温度）:
- Type: JSON
- Source: URL
- Format: Dataframe
- Parser: Backend
- URL: https://childcare-metrics-exporter.rikeda71.workers.dev/query
- Method: POST (url_optionsで設定)
- Body: {"targets":[{"target":"temperature","type":"timeserie"}]}
- Root Selector: $[0].datapoints.{"value": $[0], "time": $[1]}
```

#### 時系列グラフ（TimeSeriesパネル）

```json
設定例（温度推移）:
- Type: JSON
- Source: URL
- Format: Table
- URL: https://childcare-metrics-exporter.rikeda71.workers.dev/query
- Method: POST (url_optionsで設定)
- Body: {"targets":[{"target":"temperature","type":"timeserie"}]}
- Root Selector: $[0].datapoints
- Columns:
  - Selector: [0], Text: Temperature, Type: Number
  - Selector: [1], Text: Time, Type: Timestamp (Unix ms)
```

### 重要な設定ポイント

1. **POSTメソッドの設定**
   - `url_options`構造を使用してPOSTメソッドを指定
   - GUIでMethodをPOSTに設定しても、保存時にGETに戻る場合があるため注意

2. **JSONata式の利用**
   - Statパネルでは`{"value": $[0], "time": $[1]}`形式でデータを構造化
   - Backend Parserを使用することで安定した動作を実現

3. **Columns設定**
   - TimeSeriesパネルでは`[0]`、`[1]`の形式でセレクターを指定（`$`は不要）
   - 時間フィールドは`timestamp_epoch_ms`タイプを指定

## 4. 利用可能なメトリクス

以下のメトリクスが`/query`エンドポイントから取得可能：

- **temperature**: 温度（摂氏）
- **humidity**: 湿度（%）
- **pressure**: 気圧（hPa）
- **wind_speed**: 風速（m/s）
- **visibility**: 視程（m）
- **cloudiness**: 雲量（%）

各メトリクスは以下の形式で返される：

```json
[{
  "target": "temperature",
  "datapoints": [
    [値, タイムスタンプ（ミリ秒）],
    ...
  ]
}]
```

## 5. ダッシュボードの機能

### 現在値パネル

- 温度、湿度、気圧、風速の現在値を色分け表示
- 保育施設の環境基準に基づいた閾値設定：
  - 温度: 18-28℃（適正）、30℃以上（警告）
  - 湿度: 45-60%（適正）、40%以下・65%以上（警告）

### 時系列グラフ

- 24時間の推移を表示
- 平均、最大、最小値を凡例に表示
- スムーズな線形補間で見やすいグラフ

## 6. トラブルシューティング

### "Data is missing a time field"エラーが出る場合

1. **Columns設定を確認**：
   - セレクターが`[0]`、`[1]`形式になっているか（`$`なし）
   - 時間フィールドのタイプが`timestamp_epoch_ms`になっているか

2. **Format設定を確認**：
   - TimeSeriesパネルでは`table`形式を使用
   - Statパネルでは`dataframe`形式を使用

### POSTメソッドがGETに戻る場合

1. JSONモードでダッシュボードを編集
2. `url_options`構造を使用してメソッドを指定：

```json
"url_options": {
  "method": "POST",
  "data": "{\"targets\":[{\"target\":\"temperature\",\"type\":\"timeserie\"}]}",
  "headers": [
    {
      "key": "Content-Type",
      "value": "application/json"
    }
  ]
}
```

### データが表示されない場合

1. **Query Inspectorで確認**：
   - パネルメニュー → Inspect → Query
   - レスポンスデータの形式を確認

2. **APIエンドポイントの直接確認**：

   ```bash
   curl -X POST https://childcare-metrics-exporter.rikeda71.workers.dev/query \
     -H "Content-Type: application/json" \
     -d '{"targets":[{"target":"temperature","type":"timeserie"}]}'
   ```

3. **Backend Parserの使用**：
   - `parser: "backend"`を指定してサーバーサイドでのパース処理を有効化

## 7. 推奨設定

- **リフレッシュ間隔**: 5分（気象データの更新頻度に合わせて）
- **タイムゾーン**: Asia/Tokyo
- **時間範囲**: 過去24時間（now-24h to now）

## 8. データソース変数の活用

ダッシュボードには`datasource`変数が設定されており、以下の利点があります：

- 複数の環境（開発、本番）でのデータソース切り替えが容易
- ダッシュボードのポータビリティが向上
- `childcare-datasource`という名前のInfinity datasourceを自動選択

## 参考リンク

- [Infinity Datasource Documentation](https://grafana.com/grafana/plugins/yesoreyeram-infinity-datasource/)
- [Grafana Cloud Documentation](https://grafana.com/docs/grafana-cloud/)
- [JSONata Documentation](https://jsonata.org/)
