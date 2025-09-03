import type {} from "../../../shared/types/d1.d.ts";

/**
 * Weather Collector Worker環境変数型
 */
export interface Env {
  readonly DB: D1Database;
  readonly OPENWEATHER_API_KEY: string;
  readonly WEATHER_LATITUDE: string;
  readonly WEATHER_LONGITUDE: string;
  readonly SWITCHBOT_TOKEN: string;
  readonly SWITCHBOT_CLIENT_SECRET: string;
}

/**
 * 気象データ収集設定
 */
export interface WeatherConfig {
  readonly latitude: number;
  readonly longitude: number;
}
