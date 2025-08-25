#!/bin/bash

# Cloudflare D1データベースセットアップスクリプト

set -e

echo "🚀 Cloudflare D1データベースのセットアップを開始します"
echo "================================================"

# 1. Wranglerの確認
echo ""
echo "📋 Wranglerの確認..."
if command -v wrangler &> /dev/null; then
    echo "✅ Wrangler: $(wrangler --version)"
else
    echo "❌ Wranglerがインストールされていません"
    echo "   インストール: npm install -g wrangler"
    exit 1
fi

# 2. Cloudflareへのログイン確認
echo ""
echo "🔐 Cloudflareアカウントの確認..."
wrangler whoami || {
    echo "⚠️  Cloudflareにログインしていません"
    echo "   実行: wrangler login"
    exit 1
}

# 3. D1データベースの作成
echo ""
echo "💾 D1データベースを作成しますか？"
echo "   既に作成済みの場合はスキップしてください"
echo "   作成する場合は 'y' を入力: "
read -r create_db

if [[ "$create_db" =~ ^[Yy]$ ]]; then
    echo ""
    echo "📝 データベース名を入力 (デフォルト: childcare-dashboard): "
    read -r db_name
    db_name=${db_name:-childcare-dashboard}

    echo "Creating D1 database: $db_name"
    wrangler d1 create "$db_name"

    echo ""
    echo "⚠️  作成されたデータベースIDをwrangler.tomlに設定してください："
    echo ""
    echo "[[d1_databases]]"
    echo "binding = \"DB\""
    echo "database_name = \"$db_name\""
    echo "database_id = \"<作成されたID>\""
    echo ""
    echo "設定後、Enterキーを押して続行..."
    read -r
fi

# 4. wrangler.tomlの確認
echo ""
echo "📄 wrangler.tomlの確認..."
if [ ! -f "workers/weather-collector/wrangler.toml" ]; then
    echo "⚠️  workers/weather-collector/wrangler.tomlが見つかりません"
    echo "   ファイルを作成してから再実行してください"
    exit 1
fi

# 5. マイグレーションの実行
echo ""
echo "🔄 マイグレーションを実行しますか？"
echo "   ローカル環境: l"
echo "   本番環境: p"
echo "   スキップ: その他のキー"
read -r migrate_env

if [[ "$migrate_env" =~ ^[Ll]$ ]]; then
    echo ""
    echo "🏠 ローカル環境へのマイグレーション実行..."

    # データベース名の確認
    echo "データベース名を入力 (デフォルト: childcare-dashboard): "
    read -r local_db_name
    local_db_name=${local_db_name:-childcare-dashboard}

    for migration in migrations/*.sql; do
        if [ -f "$migration" ]; then
            echo "  実行中: $(basename "$migration")"
            wrangler d1 execute "$local_db_name" --local --file="$migration"
        fi
    done
    echo "✅ ローカルマイグレーション完了"

elif [[ "$migrate_env" =~ ^[Pp]$ ]]; then
    echo ""
    echo "☁️  本番環境へのマイグレーション実行..."
    echo "⚠️  本番環境への変更を行います。続行しますか？ (y/N)"
    read -r confirm_prod

    if [[ "$confirm_prod" =~ ^[Yy]$ ]]; then
        echo "データベース名を入力 (デフォルト: childcare-dashboard): "
        read -r prod_db_name
        prod_db_name=${prod_db_name:-childcare-dashboard}

        for migration in migrations/*.sql; do
            if [ -f "$migration" ]; then
                echo "  実行中: $(basename "$migration")"
                wrangler d1 execute "$prod_db_name" --file="$migration"
            fi
        done
        echo "✅ 本番マイグレーション完了"
    else
        echo "本番マイグレーションをスキップしました"
    fi
fi

# 6. 完了
echo ""
echo "✨ D1データベースのセットアップが完了しました！"
echo ""
echo "📖 次のステップ:"
echo "1. wrangler.tomlにデータベースIDが設定されていることを確認"
echo "2. 環境変数の設定を確認"
echo "3. Workerのローカルテスト:"
echo "   cd workers/weather-collector"
echo "   wrangler dev"
echo ""
echo "Happy coding! 🎉"
