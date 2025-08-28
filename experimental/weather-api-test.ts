#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

/**
 * OpenWeatherMap API接続テストスクリプト
 *
 * 使用方法:
 * 1. OpenWeatherMap APIキーを取得（https://openweathermap.org/api）
 * 2. .envファイルにOPENWEATHER_API_KEYを設定
 * 3. 実行:
 *    deno task test:weather-api
 *    または
 *    deno run --allow-net --allow-env --allow-read experimental/weather-api-test.ts
 */

import { load } from "@std/dotenv/mod.ts";
import { fetchWeather } from "../shared/api-clients/openweather.ts";

// テスト用の地点（東京）
const TEST_LOCATION = {
  latitude: 35.6762,
  longitude: 139.6503,
  name: "Tokyo",
};

async function testOpenWeatherAPI() {
  // .envファイルから環境変数を読み込み
  await load({ export: true });

  // APIキーの取得
  const apiKey = Deno.env.get("OPENWEATHER_API_KEY") || Deno.args[0];

  if (!apiKey) {
    console.error("❌ APIキーが設定されていません");
    console.log("\n使用方法:");
    console.log(
      "  環境変数: OPENWEATHER_API_KEY=your_key deno run --allow-net --allow-env experimental/weather-api-test.ts",
    );
    console.log("  引数指定: deno run --allow-net experimental/weather-api-test.ts your_api_key");
    Deno.exit(1);
  }

  console.log("🌤️  OpenWeatherMap API接続テスト開始");
  console.log(
    `📍 テスト地点: ${TEST_LOCATION.name} (${TEST_LOCATION.latitude}, ${TEST_LOCATION.longitude})`,
  );
  console.log("=".repeat(50));

  try {
    // API呼び出し
    console.log("\n🔄 APIを呼び出しています...");
    const result = await fetchWeather({
      apiKey,
      latitude: TEST_LOCATION.latitude,
      longitude: TEST_LOCATION.longitude,
    });

    if (!result.ok) {
      console.error(`\n❌ APIエラー: ${result.error.message}`);
      return;
    }

    // 成功時の表示
    const data = result.value;
    console.log("\n✅ API接続成功！\n");
    console.log("📊 取得したデータ:");
    console.log("-".repeat(30));
    console.log(`🌡️  気温: ${data.main.temp}°C (体感: ${data.main.feels_like}°C)`);
    console.log(`💧 湿度: ${data.main.humidity}%`);
    console.log(`🎯 気圧: ${data.main.pressure} hPa`);
    console.log(`💨 風速: ${data.wind.speed} m/s (風向: ${data.wind.deg}°)`);
    console.log(`☁️  雲量: ${data.clouds.all}%`);
    console.log(`🌅 日の出: ${new Date(data.sys.sunrise * 1000).toLocaleTimeString("ja-JP")}`);
    console.log(`🌇 日の入: ${new Date(data.sys.sunset * 1000).toLocaleTimeString("ja-JP")}`);
    console.log(`📝 天気: ${data.weather[0]?.main} (${data.weather[0]?.description})`);
    console.log(`👁️  視程: ${data.visibility}m`);
    console.log("-".repeat(30));

    // 内部データ形式への変換テスト
    console.log("\n🔄 データ変換テスト...");
    const { transformWeatherResponse } = await import("../shared/api-clients/openweather.ts");
    const weather = transformWeatherResponse(data);

    console.log("✅ 変換成功！");
    console.log("\n📦 変換後のデータ（抜粋）:");
    console.log(JSON.stringify(
      {
        timestamp: new Date(weather.timestamp).toISOString(),
        latitude: weather.latitude,
        longitude: weather.longitude,
        temperature: weather.temperature,
        humidity: weather.humidity,
        weatherMain: weather.weatherMain,
      },
      null,
      2,
    ));

    // API制限情報
    console.log("\n📈 API使用状況:");
    console.log("  Free Tier制限: 60 calls/minute, 1,000,000 calls/month");
    console.log("  推奨: 1時間ごとの収集で月間約720回の呼び出し");
  } catch (error) {
    console.error(`\n❌ エラーが発生しました: ${error}`);
  }
}

// メイン実行
if (import.meta.main) {
  await testOpenWeatherAPI();
}
