# 技術コンテキスト

## 開発環境

### プラットフォーム

- Deno: v2.x
- TypeScript: Denoに組み込まれたバージョン
- 開発OS: macOS
- MySQL: 8.x
- Grafana: Latest
- Terraform: Latest

### セットアップ要件

- Denoのインストール
- 環境変数の設定
  - SWITCHBOT_TOKEN: SwitchBot APIトークン
  - SWITCHBOT_CLIENT_SECRET: SwitchBotクライアントシークレット
  - OPENWEATHER_API_KEY: OpenWeatherMap APIキー
  - GOOGLE_DRIVE_API_KEY: Google Drive APIキー
  - MYSQL_CONNECTION_STRING: MySQLデータベース接続文字列

## APIクライアント仕様

### SwitchBot API

- ベースURL: https://api.switch-bot.com/v1.1
- 認証方式: トークンベース認証
- セキュリティ: HMAC-SHA256署名

### OpenWeatherMap API

- ベースURL: https://api.openweathermap.org/data/2.5
- 認証方式: APIキー認証
- データ形式: JSON
- 実装済み機能:
  - 現在の天気取得
    - 摂氏温度指定（units=metric）
    - 日本語レスポンス（lang=ja）
    - 緯度経度による位置指定
    - デフォルト位置: 東京（35.6895, 139.6917）
- レスポンスデータ:
  - 温度情報（現在気温、体感温度、最高/最低気温）
  - 湿度
  - 気圧
  - 風速・風向
  - 天気状況（説明、アイコン）
  - 視界
  - 降水量

### Google Drive API

- ベースURL: https://www.googleapis.com/drive/v3
- 認証方式: APIキー認証
- スコープ: ファイル読み取り専用

### 主要機能

1. SwitchBot API
   - リクエスト署名生成
   - デバイスデータ取得
   - コマンド実行

2. OpenWeatherMap API
   - 現在の天気取得
   - 天気予報取得
   - 気象アラート監視

3. Google Drive API
   - ファイル一覧取得
   - ファイルダウンロード
   - 変更監視

4. APIリクエスト
   - メソッド: GET（デフォルト）
   - 必須ヘッダー:
     - Authorization
     - Content-Type
     - sign
     - t (timestamp)
     - nonce

### エラーハンドリング

- HTTP エラーの検出と報告
- 環境変数未設定の検証
- パス未指定時のエラーメッセージ
- APIレート制限の管理
- 接続タイムアウトの処理
- リトライポリシーの実装

## 開発規約

### コード規約

- インデント: 2スペース
- クォート: ダブルクォート
- セミコロン: 必須
- 厳格な型チェック: strict modeとnoImplicitAny有効
- インターフェース定義: すべてのAPIレスポンス型を定義
- エラー型: カスタムエラークラスの使用

### リンター設定

- recommended タグのルールを使用
- カスタムルール
  - 未使用変数の警告
  - 型定義の必須化
  - エラーハンドリングの強制

### フォーマッター設定

- インデント幅: 2
- ダブルクォート使用
- セミコロン付与
- 最大行長: 100文字
- インポート順序の統一

### データベース規約

- テーブル名: スネークケース
- カラム名: スネークケース
- プライマリキー: id（bigint）
- タイムスタンプ: created_at, updated_at（必須）
- 外部キー制約: 必須
- インデックス: 検索・結合カラムに設定

### インフラストラクチャ規約

- Terraformモジュール化
- 環境ごとの設定分離
- 状態ファイルのリモート管理
- タグ付けの標準化
- 変数定義の明確化
