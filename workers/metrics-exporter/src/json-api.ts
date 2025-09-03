import type { Env, IndoorMetrics, WeatherMetrics } from "./types.ts";
import { err, ok, type Result } from "../../../shared/types/result.ts";

interface GrafanaQuery {
  target: string;
}

interface GrafanaRequest {
  range?: {
    from: string;
    to: string;
  };
  targets: GrafanaQuery[];
}

interface GrafanaTimeSeries {
  target: string;
  datapoints: Array<[number, number]>;
}

export function handleHealthCheck(): Response {
  return new Response("OK", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export function handleSearchRequest(): Response {
  const metrics = [
    "temperature",
    "humidity",
    "pressure",
    "wind_speed",
    "visibility",
    "cloudiness",
    "indoor_temperature",
    "indoor_humidity",
  ];

  return new Response(JSON.stringify(metrics), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function handleQueryRequest(
  env: Env,
  request: Request,
): Promise<Response> {
  try {
    const body: GrafanaRequest = await request.json();

    const to = body.range?.to ? new Date(body.range.to).getTime() : Date.now();
    const from = body.range?.from
      ? new Date(body.range.from).getTime()
      : to - (24 * 60 * 60 * 1000);

    const results: GrafanaTimeSeries[] = [];

    for (const target of body.targets) {
      if (target.target.startsWith("indoor_")) {
        const indoorData = await queryIndoorMetricData(env, from, to);
        if (indoorData.ok) {
          results.push({
            target: target.target,
            datapoints: indoorData.value.map((m) => {
              const value = target.target === "indoor_temperature"
                ? m.temperature
                : m.humidity;
              return [value, m.timestamp];
            }),
          });
        }
      } else {
        const data = await queryMetricData(env, from, to);
        if (data.ok) {
          results.push({
            target: target.target,
            datapoints: data.value.map((m) => {
              const value = extractMetricValue(m, target.target);
              return [value, m.timestamp];
            }),
          });
        }
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Query error:", error);
    return new Response(JSON.stringify({ error: "Query failed" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }
}

async function queryIndoorMetricData(
  env: Env,
  fromMs: number,
  toMs: number,
): Promise<Result<IndoorMetrics[]>> {
  try {
    const result = await env.DB
      .prepare(`
        WITH hourly_data AS (
          SELECT
            strftime('%Y-%m-%d %H:00:00', datetime(timestamp/1000, 'unixepoch')) as hour,
            timestamp,
            device_id as deviceId,
            device_name as deviceName,
            temperature,
            humidity,
            battery,
            ROW_NUMBER() OVER (
              PARTITION BY strftime('%Y-%m-%d %H', datetime(timestamp/1000, 'unixepoch'))
              ORDER BY timestamp DESC
            ) as rn
          FROM indoor_sensors
          WHERE timestamp BETWEEN ? AND ?
        )
        SELECT
          timestamp,
          deviceId,
          deviceName,
          temperature,
          humidity,
          battery
        FROM hourly_data
        WHERE rn = 1
        ORDER BY timestamp ASC
      `)
      .bind(fromMs, toMs)
      .all<IndoorMetrics>();

    if (!result.results) {
      return err(new Error("No indoor data available"));
    }

    return ok(result.results);
  } catch (error) {
    return err(new Error(`Indoor query error: ${error}`));
  }
}

async function queryMetricData(
  env: Env,
  fromMs: number,
  toMs: number,
): Promise<Result<WeatherMetrics[]>> {
  try {
    const result = await env.DB
      .prepare(`
        WITH hourly_data AS (
          SELECT
            strftime('%Y-%m-%d %H:00:00', datetime(timestamp/1000, 'unixepoch')) as hour,
            timestamp,
            temperature,
            humidity,
            pressure,
            wind_speed as windSpeed,
            cloudiness,
            visibility,
            ROW_NUMBER() OVER (
              PARTITION BY strftime('%Y-%m-%d %H', datetime(timestamp/1000, 'unixepoch'))
              ORDER BY timestamp DESC
            ) as rn
          FROM weather
          WHERE timestamp BETWEEN ? AND ?
        )
        SELECT
          timestamp,
          temperature,
          humidity,
          pressure,
          windSpeed,
          cloudiness,
          visibility
        FROM hourly_data
        WHERE rn = 1
        ORDER BY timestamp ASC
      `)
      .bind(fromMs, toMs)
      .all<WeatherMetrics>();

    if (!result.results) {
      return err(new Error("No data available"));
    }

    return ok(result.results);
  } catch (error) {
    return err(new Error(`Query error: ${error}`));
  }
}

function extractMetricValue(metrics: WeatherMetrics, metricName: string): number {
  switch (metricName) {
    case "temperature":
      return metrics.temperature;
    case "humidity":
      return metrics.humidity;
    case "pressure":
      return metrics.pressure;
    case "wind_speed":
      return metrics.windSpeed;
    case "visibility":
      return metrics.visibility;
    case "cloudiness":
      return metrics.cloudiness;
    default:
      return 0;
  }
}
