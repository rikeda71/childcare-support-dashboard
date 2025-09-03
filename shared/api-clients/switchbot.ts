import type { Result } from "../types/result.ts";
import { err, ok } from "../types/result.ts";

const SWITCHBOT_API_URL = "https://api.switch-bot.com";

/**
 * SwitchBot APIクライアント設定
 */
export interface SwitchBotConfig {
  readonly token: string;
  readonly secret: string;
}

/**
 * SwitchBotデバイスの基本型
 */
export interface SwitchBotDevice {
  readonly deviceId: string;
  readonly deviceName: string;
  readonly deviceType: string;
  readonly hubDeviceId?: string;
}

/**
 * SwitchBot Meterデバイスの型
 */
export interface SwitchBotMeterDevice extends SwitchBotDevice {
  readonly deviceType: "Meter" | "MeterPlus" | "WoIOSensor";
  readonly temperature: number;
  readonly humidity: number;
  readonly battery?: number;
}

/**
 * SwitchBotデバイスリストレスポンス
 */
export interface SwitchBotDeviceListResponse {
  readonly statusCode: number;
  readonly message: string;
  readonly body: {
    readonly deviceList: SwitchBotDevice[];
  };
}

/**
 * SwitchBotデバイスステータスレスポンス
 */
export interface SwitchBotDeviceStatusResponse {
  readonly statusCode: number;
  readonly message: string;
  readonly body: {
    readonly deviceId: string;
    readonly deviceType: string;
    readonly hubDeviceId?: string;
    readonly temperature: number;
    readonly humidity: number;
    readonly battery?: number;
  };
}

/**
 * 室内センサーデータ
 */
export interface IndoorSensorData {
  readonly deviceId: string;
  readonly deviceName: string;
  readonly temperature: number;
  readonly humidity: number;
  readonly battery?: number;
  readonly timestamp: number;
}

/**
 * SwitchBot API v1.1の認証ヘッダーを生成
 */
const generateAuthHeaders = async (token: string, secret: string): Promise<Record<string, string>> => {
  const t = Date.now();
  const nonce = "";
  const data = token + t + nonce;

  // Web Crypto APIを使用してHMAC-SHA256署名を生成
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data),
  );

  // Base64エンコード
  const sign = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return {
    "Authorization": token,
    "sign": sign,
    "t": String(t),
    "nonce": nonce,
    "Content-Type": "application/json",
  };
};

/**
 * SwitchBotデバイスリストを取得
 */
export const fetchSwitchBotDevices = async (
  config: SwitchBotConfig,
): Promise<Result<SwitchBotDeviceListResponse>> => {
  try {
    const headers = await generateAuthHeaders(config.token, config.secret);
    const response = await fetch(`${SWITCHBOT_API_URL}/v1.1/devices`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      return err(
        new Error(`SwitchBot API request failed: ${response.status} ${response.statusText}`),
      );
    }

    const data = await response.json() as SwitchBotDeviceListResponse;

    if (data.statusCode !== 100) {
      return err(new Error(`SwitchBot API error: ${data.message}`));
    }

    return ok(data);
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error(`Unknown error: ${String(error)}`),
    );
  }
};

/**
 * 特定のSwitchBotデバイスのステータスを取得
 */
export const fetchSwitchBotDeviceStatus = async (
  config: SwitchBotConfig,
  deviceId: string,
): Promise<Result<SwitchBotDeviceStatusResponse>> => {
  try {
    const headers = await generateAuthHeaders(config.token, config.secret);
    const response = await fetch(
      `${SWITCHBOT_API_URL}/v1.1/devices/${deviceId}/status`,
      {
        method: "GET",
        headers,
      },
    );

    if (!response.ok) {
      return err(
        new Error(`SwitchBot API request failed: ${response.status} ${response.statusText}`),
      );
    }

    const data = await response.json() as SwitchBotDeviceStatusResponse;

    if (data.statusCode !== 100) {
      return err(new Error(`SwitchBot API error: ${data.message}`));
    }

    return ok(data);
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error(`Unknown error: ${String(error)}`),
    );
  }
};

/**
 * 室内温湿度センサーのデータを取得
 */
export const fetchIndoorSensors = async (
  config: SwitchBotConfig,
): Promise<Result<IndoorSensorData[]>> => {
  // デバイスリストを取得
  const devicesResult = await fetchSwitchBotDevices(config);
  if (!devicesResult.ok) {
    return err(devicesResult.error);
  }

  // 温湿度計デバイスのみをフィルタ
  const meterDevices = devicesResult.value.body.deviceList.filter(
    (device) =>
      device.deviceType === "Meter" ||
      device.deviceType === "MeterPlus" ||
      device.deviceType === "WoIOSensor",
  );

  if (meterDevices.length === 0) {
    return ok([]);
  }

  // 各デバイスの詳細ステータスを取得
  const timestamp = Date.now();
  const sensorDataPromises = meterDevices.map(async (device) => {
    const statusResult = await fetchSwitchBotDeviceStatus(config, device.deviceId);
    if (!statusResult.ok) {
      console.error(
        `Failed to fetch status for device ${device.deviceId}: ${statusResult.error.message}`,
      );
      return null;
    }

    const status = statusResult.value.body;
    return {
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      temperature: status.temperature,
      humidity: status.humidity,
      battery: status.battery,
      timestamp,
    } as IndoorSensorData;
  });

  const results = await Promise.all(sensorDataPromises);
  const validResults = results.filter(
    (result): result is IndoorSensorData => result !== null,
  );

  return ok(validResults);
};

/**
 * レスポンスをログ用の簡潔な形式に変換
 */
export const transformIndoorSensorResponse = (
  sensorData: IndoorSensorData[],
): Record<string, unknown> => {
  return {
    devices: sensorData.map((sensor) => ({
      id: sensor.deviceId,
      name: sensor.deviceName,
      temperature: sensor.temperature,
      humidity: sensor.humidity,
      battery: sensor.battery,
    })),
    count: sensorData.length,
    timestamp: sensorData[0]?.timestamp || Date.now(),
  };
};