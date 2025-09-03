import type { Env, WeatherConfig } from "./types.ts";
import { fetchWeather, transformWeatherResponse } from "../../../shared/api-clients/openweather.ts";
import { fetchIndoorSensors } from "../../../shared/api-clients/switchbot.ts";
import { insertWeather } from "../../../shared/db/weather-queries.ts";
import { insertIndoorSensorsBatch } from "../../../shared/db/indoor-sensor-queries.ts";
import type { Result } from "../../../shared/types/result.ts";
import { err, ok } from "../../../shared/types/result.ts";

/**
 * 室内センサーデータを収集してデータベースに保存する
 */
const collectIndoorSensors = async (env: Env): Promise<Result<void>> => {
  // SwitchBot APIから室内センサーデータを取得
  const sensorsResult = await fetchIndoorSensors({
    token: env.SWITCHBOT_TOKEN,
    secret: env.SWITCHBOT_CLIENT_SECRET,
  });

  if (!sensorsResult.ok) {
    return err(
      new Error(
        `Failed to fetch indoor sensor data: ${sensorsResult.error.message}`,
      ),
    );
  }

  const sensorDataList = sensorsResult.value;

  if (sensorDataList.length === 0) {
    console.log(JSON.stringify({
      level: "info",
      message: "No indoor sensors found",
      timestamp: Date.now(),
    }));
    return ok(undefined);
  }

  // データベースに保存
  const sensorRecords = sensorDataList.map((sensor) => ({
    timestamp: sensor.timestamp,
    device_id: sensor.deviceId,
    device_name: sensor.deviceName,
    temperature: sensor.temperature,
    humidity: sensor.humidity,
    battery: sensor.battery,
    raw_data: JSON.stringify(sensor),
  }));

  const saveResult = await insertIndoorSensorsBatch(env.DB, sensorRecords);
  if (!saveResult.ok) {
    return err(
      new Error(
        `Failed to save indoor sensor data: ${saveResult.error.message}`,
      ),
    );
  }

  console.log(JSON.stringify({
    level: "info",
    message: "Indoor sensors collected successfully",
    devices: sensorDataList.length,
    timestamp: Date.now(),
  }));

  return ok(undefined);
};

/**
 * 気象データと室内センサーデータを収集してデータベースに保存する
 */
export const collectWeather = async (env: Env): Promise<Result<void>> => {
  // 屋外気象データと室内センサーデータを並行して収集
  const [weatherResult, indoorResult] = await Promise.all([
    collectOutdoorWeather(env),
    collectIndoorSensors(env),
  ]);

  // エラーがあればまとめて返す
  const errors: string[] = [];
  if (!weatherResult.ok) {
    errors.push(`Weather: ${weatherResult.error.message}`);
  }
  if (!indoorResult.ok) {
    errors.push(`Indoor: ${indoorResult.error.message}`);
  }

  if (errors.length > 0) {
    return err(new Error(`Collection errors: ${errors.join("; ")}`));
  }

  return ok(undefined);
};

/**
 * 屋外気象データを収集してデータベースに保存する
 */
const collectOutdoorWeather = async (env: Env): Promise<Result<void>> => {
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
  const weather = transformWeatherResponse(apiResult.value);

  // データベースに保存（生のAPIレスポンスも保存）
  const saveResult = await insertWeather(env.DB, weather, apiResult.value);
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
    location: `${config.latitude},${config.longitude}`,
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
  });
};
