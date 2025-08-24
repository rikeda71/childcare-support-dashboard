import type { Result } from "../types/result.ts";
import type { Weather, WeatherRecord } from "../types/weather.ts";
import { tryCatch } from "../types/result.ts";
import type {} from "../types/d1.d.ts";

/**
 * 気象情報をデータベースに保存する
 */
export const insertWeather = (
  db: D1Database,
  weather: Weather,
): Promise<Result<void>> =>
  tryCatch(async () => {
    const query = `
      INSERT INTO weather_data (
        timestamp, location_id, latitude, longitude,
        temperature, feels_like, temp_min, temp_max,
        humidity, pressure, wind_speed, wind_deg,
        weather_main, weather_description, visibility, cloudiness,
        sunrise, sunset, raw_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db
      .prepare(query)
      .bind(
        weather.timestamp,
        weather.locationId,
        weather.latitude,
        weather.longitude,
        weather.temperature,
        weather.feelsLike,
        weather.tempMin,
        weather.tempMax,
        weather.humidity,
        weather.pressure,
        weather.windSpeed,
        weather.windDeg,
        weather.weatherMain,
        weather.weatherDescription,
        weather.visibility,
        weather.cloudiness,
        weather.sunrise || null,
        weather.sunset || null,
        JSON.stringify(weather),
      )
      .run();
  });

/**
 * 指定地点の最新気象情報を取得する
 */
export const fetchLatestWeather = (
  db: D1Database,
  locationId: string,
): Promise<Result<Weather | null>> =>
  tryCatch(async () => {
    const query = `
      SELECT * FROM weather_data
      WHERE location_id = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    const record = await db
      .prepare(query)
      .bind(locationId)
      .first<WeatherRecord>();

    return record ? convertRecordToWeather(record) : null;
  });

/**
 * 指定期間の気象情報を取得する
 */
export const fetchWeatherByTimeRange = (
  db: D1Database,
  locationId: string,
  startTimeMs: number,
  endTimeMs: number,
): Promise<Result<Weather[]>> =>
  tryCatch(async () => {
    const query = `
      SELECT * FROM weather_data
      WHERE location_id = ?
        AND timestamp BETWEEN ? AND ?
      ORDER BY timestamp DESC
    `;

    const result = await db
      .prepare(query)
      .bind(locationId, startTimeMs, endTimeMs)
      .all<WeatherRecord>();

    return result.results.map(convertRecordToWeather);
  });

/**
 * 指定日数より古い気象記録を削除する
 * @returns 削除されたレコード数
 */
export const deleteOldWeatherRecords = (
  db: D1Database,
  olderThanDays: number,
): Promise<Result<number>> =>
  tryCatch(async () => {
    const cutoffTimeMs = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

    const result = await db
      .prepare("DELETE FROM weather_data WHERE timestamp < ?")
      .bind(cutoffTimeMs)
      .run();

    return result.meta.changes || 0;
  });

/**
 * データベースレコードをWeather型に変換する
 */
const convertRecordToWeather = (record: WeatherRecord): Weather => ({
  timestamp: record.timestamp,
  locationId: record.location_id,
  latitude: record.latitude,
  longitude: record.longitude,
  temperature: record.temperature,
  feelsLike: record.feels_like,
  tempMin: record.temp_min,
  tempMax: record.temp_max,
  humidity: record.humidity,
  pressure: record.pressure,
  windSpeed: record.wind_speed,
  windDeg: record.wind_deg,
  weatherMain: record.weather_main,
  weatherDescription: record.weather_description,
  visibility: record.visibility,
  cloudiness: record.cloudiness,
  sunrise: record.sunrise,
  sunset: record.sunset,
});
