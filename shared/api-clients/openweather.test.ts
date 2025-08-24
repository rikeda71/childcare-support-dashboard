import { assertEquals, assertExists } from "@std/assert/mod.ts";
import { transformWeatherResponse } from "./openweather.ts";
import type { OpenWeatherResponse } from "../types/weather.ts";

const mockApiResponse: OpenWeatherResponse = {
  coord: { lon: 139.6503, lat: 35.6762 },
  weather: [
    {
      id: 800,
      main: "Clear",
      description: "clear sky",
      icon: "01d",
    },
  ],
  base: "stations",
  main: {
    temp: 25.5,
    feels_like: 26.2,
    temp_min: 23.0,
    temp_max: 28.0,
    pressure: 1013,
    humidity: 65,
  },
  visibility: 10000,
  wind: { speed: 3.5, deg: 180 },
  clouds: { all: 0 },
  dt: 1700000000,
  sys: {
    type: 1,
    id: 8074,
    country: "JP",
    sunrise: 1699999000,
    sunset: 1700040000,
  },
  timezone: 32400,
  id: 1850144,
  name: "Tokyo",
  cod: 200,
};

Deno.test("transformWeatherResponse converts API response correctly", () => {
  const result = transformWeatherResponse(mockApiResponse, "Tokyo");
  
  assertEquals(result.temperature, 25.5);
  assertEquals(result.humidity, 65);
  assertEquals(result.pressure, 1013);
  assertEquals(result.windSpeed, 3.5);
  assertEquals(result.windDeg, 180);
  assertEquals(result.locationId, "Tokyo");
  assertEquals(result.weatherMain, "Clear");
  assertEquals(result.weatherDescription, "clear sky");
  assertEquals(result.visibility, 10000);
  assertEquals(result.cloudiness, 0);
  assertExists(result.sunrise);
  assertExists(result.sunset);
});

Deno.test("transformWeatherResponse handles missing weather array", () => {
  const incompleteResponse: OpenWeatherResponse = {
    ...mockApiResponse,
    weather: [],
  };
  
  const result = transformWeatherResponse(incompleteResponse, "Tokyo");
  
  assertEquals(result.weatherMain, "Unknown");
  assertEquals(result.weatherDescription, "");
});

Deno.test("transformWeatherResponse converts timestamps to milliseconds", () => {
  const result = transformWeatherResponse(mockApiResponse, "Tokyo");
  
  // API returns Unix seconds, we should have milliseconds
  assertEquals(result.timestamp, 1700000000 * 1000);
  assertEquals(result.sunrise, 1699999000 * 1000);
  assertEquals(result.sunset, 1700040000 * 1000);
});