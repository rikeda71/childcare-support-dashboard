import type { Result } from "../types/result.ts";
import { tryCatch } from "../types/result.ts";
import type {} from "../types/d1.d.ts";

/**
 * 室内センサーレコード型
 */
export interface IndoorSensorRecord {
  readonly id?: number;
  readonly timestamp: number;
  readonly device_id: string;
  readonly device_name: string;
  readonly temperature: number;
  readonly humidity: number;
  readonly battery?: number | null;
  readonly raw_data: string;
  readonly created_at?: number;
}

/**
 * 室内センサーデータをデータベースに保存する
 */
export const insertIndoorSensorData = (
  db: D1Database,
  sensorData: Omit<IndoorSensorRecord, "id" | "created_at">,
): Promise<Result<void>> =>
  tryCatch(async () => {
    const query = `
      INSERT INTO indoor_sensors (
        timestamp, device_id, device_name,
        temperature, humidity, battery, raw_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db
      .prepare(query)
      .bind(
        sensorData.timestamp,
        sensorData.device_id,
        sensorData.device_name,
        sensorData.temperature,
        sensorData.humidity,
        sensorData.battery || null,
        sensorData.raw_data,
      )
      .run();
  });

/**
 * 複数の室内センサーデータをバッチで保存する
 */
export const insertIndoorSensorDataBatch = async (
  db: D1Database,
  sensorDataList: Omit<IndoorSensorRecord, "id" | "created_at">[],
): Promise<Result<void>> =>
  tryCatch(async () => {
    const statements = sensorDataList.map((sensorData) =>
      db
        .prepare(
          `
          INSERT INTO indoor_sensors (
            timestamp, device_id, device_name,
            temperature, humidity, battery, raw_data
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        )
        .bind(
          sensorData.timestamp,
          sensorData.device_id,
          sensorData.device_name,
          sensorData.temperature,
          sensorData.humidity,
          sensorData.battery || null,
          sensorData.raw_data,
        ),
    );

    await db.batch(statements);
  });

/**
 * 指定期間の室内センサーデータを取得する
 */
export const fetchIndoorSensorsByTimeRange = (
  db: D1Database,
  startTimeMs: number,
  endTimeMs: number,
): Promise<Result<IndoorSensorRecord[]>> =>
  tryCatch(async () => {
    const query = `
      SELECT * FROM indoor_sensors
      WHERE timestamp BETWEEN ? AND ?
      ORDER BY timestamp DESC
    `;

    const result = await db
      .prepare(query)
      .bind(startTimeMs, endTimeMs)
      .all<IndoorSensorRecord>();

    return result.results;
  });

/**
 * 最新の室内センサーデータを取得する（各デバイスごと）
 */
export const fetchLatestIndoorSensorData = (
  db: D1Database,
): Promise<Result<IndoorSensorRecord[]>> =>
  tryCatch(async () => {
    const query = `
      SELECT * FROM indoor_sensors
      WHERE timestamp IN (
        SELECT MAX(timestamp)
        FROM indoor_sensors
        GROUP BY device_id
      )
      ORDER BY device_name
    `;

    const result = await db.prepare(query).all<IndoorSensorRecord>();
    return result.results;
  });

/**
 * 指定日数より古い室内センサー記録を削除する
 * @returns 削除されたレコード数
 */
export const deleteOldIndoorSensorRecords = (
  db: D1Database,
  olderThanDays: number,
): Promise<Result<number>> =>
  tryCatch(async () => {
    const cutoffTimeMs = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

    const result = await db
      .prepare("DELETE FROM indoor_sensors WHERE timestamp < ?")
      .bind(cutoffTimeMs)
      .run();

    return result.meta.changes || 0;
  });