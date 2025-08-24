/**
 * OpenWeatherMap APIレスポンス型
 */
export interface OpenWeatherResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type?: number;
    id?: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

/**
 * 正規化された気象データ
 */
export interface Weather {
  timestamp: number;
  locationId: string;
  latitude: number;
  longitude: number;
  temperature: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDeg: number;
  weatherMain: string;
  weatherDescription: string;
  visibility: number;
  cloudiness: number;
  sunrise?: number;
  sunset?: number;
}

/**
 * データベースレコード型
 */
export interface WeatherRecord {
  id: number;
  timestamp: number;
  location_id: string;
  latitude: number;
  longitude: number;
  temperature: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_deg: number;
  weather_main: string;
  weather_description: string;
  visibility: number;
  cloudiness: number;
  sunrise?: number;
  sunset?: number;
  raw_data: string;
  created_at: number;
}
