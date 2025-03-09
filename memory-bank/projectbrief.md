# プロジェクト概要

childcare-support-dashboardは、子育て支援のためのダッシュボードアプリケーションです。

## 主要目的

- 子育て支援に関連する情報の可視化
- SwitchBot APIを利用したスマートデバイスの管理
- 効率的な育児環境のモニタリング
- 育児記録データの統合と分析
- 気象情報との連携による快適な育児環境の実現

## 技術スタック

- TypeScript
- Cloudflare Workers
- SwitchBot API
- OpenWeatherMap API
- MySQL
- Grafana
- (Deno)
  - 実験的なスクリプトの実装に利用

## コアコンポーネント

1. APIクライアント
   - SwitchBot APIとの通信
   - OpenWeatherMap APIとの連携
   - セキュアな認証処理
   - デバイス情報の取得

2. データ統合
   - ぴよログからの育児記録データ取得
   - Google Driveとの連携
   - 天気データの収集
   - データの永続化と分析

## 開発フェーズ

- [] SwitchBot API クライアントの基本実装
  - [x] サンプル実装
  - [ ] 情報源、利用するエンドポイントの選定
  - [ ] cloudflare workers によるバッチアプリケーションの実装
- [ ] OpenWeatherMap API クライアントの基本実装
  - [ ] サンプル実装
  - [ ] 情報源、利用するエンドポイントの選定
  - [ ] cloudflare workers によるバッチアプリケーションの実装
- [ ] ぴよログデータ取得
  - [ ] アプリの調査
  - [ ] サンプル実装
  - [ ] cloudflare workers によるバッチアプリケーションの実装
- [ ] MySQL データベース設計
- [ ] Grafana によるデータ可視化
