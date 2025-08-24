import type { OpenWeatherResponse, Weather } from "../types/weather.ts";
import type { Result } from "../types/result.ts";
import { err, ok } from "../types/result.ts";

interface FetchWeatherParams {
  apiKey: string;
  latitude: number;
  longitude: number;
}

/**
 * OpenWeatherMap APIから現在の気象情報を取得する
 */
export const fetchWeather = async (
  params: FetchWeatherParams,
): Promise<Result<OpenWeatherResponse>> => {
  const url = buildWeatherUrl(params);

  const responseResult = await fetchWithRetry(url, {
    maxRetries: 3,
    initialDelayMs: 1000,
    timeoutMs: 5000,
  });

  if (!responseResult.ok) {
    return err(responseResult.error);
  }

  const response = responseResult.value;

  if (!response.ok) {
    return err(
      new Error(
        `Weather API error: ${response.status} ${response.statusText}`,
      ),
    );
  }

  // response.json() が例外を投げる可能性があるので、try-catchを利用
  try {
    const json = await response.json();

    if (!isValidWeatherResponse(json)) {
      return err(new Error("Invalid weather response format"));
    }

    // Type guard ensures json is OpenWeatherResponse
    return ok(json);
  } catch (error) {
    return err(new Error(`Failed to parse response: ${error}`));
  }
};

/**
 * APIレスポンスを内部データ形式に変換する
 */
export const transformWeatherResponse = (
  response: OpenWeatherResponse,
): Weather => ({
  timestamp: response.dt * 1000, // Unix秒をミリ秒に変換
  latitude: response.coord.lat,
  longitude: response.coord.lon,
  temperature: response.main.temp,
  feelsLike: response.main.feels_like,
  tempMin: response.main.temp_min,
  tempMax: response.main.temp_max,
  humidity: response.main.humidity,
  pressure: response.main.pressure,
  windSpeed: response.wind.speed,
  windDeg: response.wind.deg,
  weatherMain: response.weather[0]?.main || "Unknown",
  weatherDescription: response.weather[0]?.description || "",
  visibility: response.visibility,
  cloudiness: response.clouds.all,
  sunrise: response.sys.sunrise ? response.sys.sunrise * 1000 : undefined,
  sunset: response.sys.sunset ? response.sys.sunset * 1000 : undefined,
});

/**
 * OpenWeatherMap APIのURLを構築する
 */
const buildWeatherUrl = (params: FetchWeatherParams): string => {
  const baseUrl = "https://api.openweathermap.org/data/2.5/weather";
  const searchParams = new URLSearchParams({
    lat: params.latitude.toString(),
    lon: params.longitude.toString(),
    appid: params.apiKey,
    units: "metric", // 摂氏を使用
    lang: "ja", // 日本語の天気説明
  });

  return `${baseUrl}?${searchParams.toString()}`;
};

/**
 * リトライ機能付きのfetch関数
 */
const fetchWithRetry = async (
  url: string,
  options: {
    maxRetries: number;
    initialDelayMs: number;
    timeoutMs: number;
  },
): Promise<Result<Response>> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(options.timeoutMs),
      });

      // 成功または4xxエラーの場合はリトライしない
      if (response.ok || response.status < 500) {
        return ok(response);
      }

      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error as Error;
    }

    // 最後の試行でなければ待機
    if (attempt < options.maxRetries) {
      const delayMs = options.initialDelayMs * Math.pow(2, attempt); // 指数バックオフ
      await sleep(delayMs);
    }
  }

  return err(lastError || new Error("Request failed after all retries"));
};

/**
 * 指定時間待機する
 */
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * レスポンスが有効なOpenWeatherResponseかを検証する
 * 最小限の必須フィールドのみチェック
 */
const isValidWeatherResponse = (data: unknown): data is OpenWeatherResponse => {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  // 最小限の必須フィールドチェック
  const hasRequiredFields = "coord" in data &&
    "main" in data &&
    "dt" in data &&
    "weather" in data &&
    "wind" in data &&
    "clouds" in data;

  if (!hasRequiredFields) {
    return false;
  }

  // TypeScriptのstructural typingに任せる
  // 詳細な型チェックは as OpenWeatherResponse のキャストで行う
  return true;
};
