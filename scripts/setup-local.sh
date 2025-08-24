#!/bin/bash

# ローカル開発環境セットアップスクリプト

set -e

echo "🚀 ローカル開発環境のセットアップを開始します"
echo "================================================"

# 1. 必要なツールの確認
echo ""
echo "📋 必要なツールの確認..."

# Denoの確認
if command -v deno &> /dev/null; then
    echo "✅ Deno: $(deno --version | head -n 1)"
else
    echo "❌ Denoがインストールされていません"
    echo "   インストール: curl -fsSL https://deno.land/install.sh | sh"
    exit 1
fi

# Wranglerの確認
if command -v wrangler &> /dev/null; then
    echo "✅ Wrangler: $(wrangler --version)"
else
    echo "⚠️  Wranglerがインストールされていません"
    echo "   インストール: npm install -g wrangler"
    echo "   続行しますか？ (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 2. 環境変数の設定
echo ""
echo "🔐 環境変数の設定..."

ENV_FILE=".env.local"
if [ ! -f "$ENV_FILE" ]; then
    echo "📝 $ENV_FILE を作成します"
    cat > "$ENV_FILE" << EOF
# OpenWeatherMap API設定
OPENWEATHER_API_KEY=your_api_key_here
WEATHER_LATITUDE=35.6762
WEATHER_LONGITUDE=139.6503

# SwitchBot API設定（将来用）
SWITCHBOT_API_KEY=your_switchbot_key_here
SWITCHBOT_SECRET=your_switchbot_secret_here

# Google Drive設定（将来用）
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here
EOF
    echo "✅ $ENV_FILE を作成しました"
    echo "   ⚠️  APIキーを設定してください"
else
    echo "✅ $ENV_FILE は既に存在します"
fi

# 3. D1データベースの確認
echo ""
echo "💾 D1データベースの設定..."
echo "   以下のコマンドでD1データベースを作成してください:"
echo ""
echo "   wrangler d1 create childcare-dashboard"
echo ""
echo "   作成後、database_idをwrangler.tomlに設定してください"

# 4. 依存関係のチェック
echo ""
echo "📦 依存関係のチェック..."
deno cache shared/**/*.ts workers/**/*.ts

# 5. テスト実行
echo ""
echo "🧪 テストの実行..."
if deno test --quiet; then
    echo "✅ 全てのテストが成功しました"
else
    echo "⚠️  一部のテストが失敗しました"
fi

# 6. 次のステップ
echo ""
echo "✨ セットアップが完了しました！"
echo ""
echo "📖 次のステップ:"
echo "1. OpenWeatherMap APIキーを取得:"
echo "   https://openweathermap.org/api"
echo ""
echo "2. APIテストを実行:"
echo "   OPENWEATHER_API_KEY=your_key deno run --allow-net --allow-env experimental/weather-api-test.ts"
echo ""
echo "3. ローカルでWorkerを実行:"
echo "   cd workers/weather-collector"
echo "   wrangler dev"
echo ""
echo "4. 手動でデータ収集をトリガー:"
echo "   curl -X POST http://localhost:8787"
echo ""
echo "Happy coding! 🎉"
