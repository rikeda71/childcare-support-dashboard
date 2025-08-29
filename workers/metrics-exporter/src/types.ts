export interface Env {
  DB: D1Database;
  API_KEY?: string; // Optional API key for basic authentication
}

export interface WeatherMetrics {
  timestamp: number;
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  cloudiness: number;
  visibility: number;
}

export interface StatsMetrics {
  avgTemperature: number;
  maxTemperature: number;
  minTemperature: number;
  avgHumidity: number;
  maxHumidity: number;
  minHumidity: number;
  dataPoints: number;
}
