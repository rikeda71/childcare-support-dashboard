import type { Env, WeatherConfig } from "./types.ts";
import { fetchWeather, transformWeatherResponse } from "../../../shared/api-clients/openweather.ts";
import { insertWeather } from "../../../shared/db/weather-queries.ts";
import type { Result } from "../../../shared/types/result.ts";
import { err, ok } from "../../../shared/types/result.ts";

/**
 * 気象データを収集してデータベースに保存する
 */
export const collectWeather = async (env: Env): Promise<Result<void>> => {
  const configResult = parseWeatherConfig(env);
  if (!configResult.ok) {
    return err(configResult.error);
  }
  const config = configResult.value;

  // APIから気象データを取得
  const apiResult = await fetchWeather({
    apiKey: env.OPENWEATHER_API_KEY,
    latitude: config.latitude,
    longitude: config.longitude,
  });
  if (!apiResult.ok) {
    return err(
      new Error(
        `Failed to fetch weather data: ${apiResult.error.message}`,
      ),
    );
  }

  // レスポンスを内部形式に変換
  const weather = transformWeatherResponse(
    apiResult.value,
    config.locationName,
  );

  // データベースに保存
  const saveResult = await insertWeather(env.DB, weather);
  if (!saveResult.ok) {
    return err(
      new Error(
        `Failed to save weather data: ${saveResult.error.message}`,
      ),
    );
  }

  console.log(JSON.stringify({
    level: "info",
    message: "Weather collected successfully",
    location: config.locationName,
    temperature: weather.temperature,
    humidity: weather.humidity,
    timestamp: weather.timestamp,
  }));

  return ok(undefined);
};

/**
 * 環境変数から気象収集設定を取得する
 */
export const parseWeatherConfig = (env: Env): Result<WeatherConfig> => {
  const latitude = parseFloat(env.WEATHER_LATITUDE);
  const longitude = parseFloat(env.WEATHER_LONGITUDE);

  if (isNaN(latitude) || latitude < -90 || latitude > 90) {
    return err(
      new Error(
        `Invalid latitude: ${env.WEATHER_LATITUDE}. Must be between -90 and 90.`,
      ),
    );
  }

  if (isNaN(longitude) || longitude < -180 || longitude > 180) {
    return err(
      new Error(
        `Invalid longitude: ${env.WEATHER_LONGITUDE}. Must be between -180 and 180.`,
      ),
    );
  }

  return ok({
    latitude,
    longitude,
    locationName: env.LOCATION_NAME || `${latitude.toFixed(4)},${longitude.toFixed(4)}`,
  });
};
