import { assertEquals } from "@std/assert/mod.ts";
import { parseWeatherConfig } from "./handler.ts";
import type { Env } from "./types.ts";

Deno.test("parseWeatherConfig parses valid coordinates", () => {
  const mockEnv = {
    WEATHER_LATITUDE: "35.6762",
    WEATHER_LONGITUDE: "139.6503",
  } as Env;

  const result = parseWeatherConfig(mockEnv);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.latitude, 35.6762);
    assertEquals(result.value.longitude, 139.6503);
  }
});

Deno.test("parseWeatherConfig validates latitude range", () => {
  const invalidEnv = {
    WEATHER_LATITUDE: "91", // Invalid: > 90
    WEATHER_LONGITUDE: "139.6503",
  } as Env;

  const result = parseWeatherConfig(invalidEnv);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.message.includes("Invalid latitude"), true);
  }
});

Deno.test("parseWeatherConfig validates longitude range", () => {
  const invalidEnv = {
    WEATHER_LATITUDE: "35.6762",
    WEATHER_LONGITUDE: "181", // Invalid: > 180
  } as Env;

  const result = parseWeatherConfig(invalidEnv);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.message.includes("Invalid longitude"), true);
  }
});

Deno.test("parseWeatherConfig handles non-numeric latitude", () => {
  const invalidEnv = {
    WEATHER_LATITUDE: "not-a-number",
    WEATHER_LONGITUDE: "139.6503",
  } as Env;

  const result = parseWeatherConfig(invalidEnv);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.message.includes("Invalid latitude"), true);
  }
});

Deno.test("parseWeatherConfig handles boundary values", () => {
  const boundaryEnv = {
    WEATHER_LATITUDE: "-90",
    WEATHER_LONGITUDE: "180",
  } as Env;

  const result = parseWeatherConfig(boundaryEnv);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.latitude, -90);
    assertEquals(result.value.longitude, 180);
  }
});
