import { parseArgs } from "std/cli/parse_args.ts";
import { load } from "std/dotenv/mod.ts";

const TOKYO_LAT = 35.6895;
const TOKYO_LON = 139.6917;
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

/**
 * OpenWeatherMap APIから天気情報を取得する
 * @param args API呼び出しに必要な引数
 * @returns APIレスポンス
 */
async function getWeather(args: {
  apiKey: string;
  lat: number;
  lon: number;
}): Promise<Response> {
  const url = new URL(BASE_URL);
  url.searchParams.append("lat", args.lat.toString());
  url.searchParams.append("lon", args.lon.toString());
  url.searchParams.append("appid", args.apiKey);
  url.searchParams.append("units", "metric");
  url.searchParams.append("lang", "ja");

  const requestUrl = url.toString();
  console.log("リクエストURL:", requestUrl);
  return await fetch(requestUrl, {
    method: "GET",
  });
}

const env = await load();
const OPENWEATHER_API_KEY = env.OPENWEATHER_API_KEY;

if (!OPENWEATHER_API_KEY) {
  console.error("環境変数 OPENWEATHER_API_KEY が必要です");
  Deno.exit(1);
}

const args = parseArgs(Deno.args, {
  string: ["lat", "lon"],
});

const lat = args.lat ? Number.parseFloat(args.lat) : TOKYO_LAT;
const lon = args.lon ? Number.parseFloat(args.lon) : TOKYO_LON;

try {
  const response = await getWeather({
    apiKey: OPENWEATHER_API_KEY,
    lat,
    lon,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
} catch (error) {
  console.error("エラーが発生しました:", error);
  Deno.exit(1);
}
