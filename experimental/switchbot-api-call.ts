import { parseArgs } from "@std/cli/parse_args.ts";
import { load } from "@std/dotenv/mod.ts";

/**
 * リクエストに必要な署名を生成する
 * @param token アクセストークン
 * @param secret シークレットキー
 * @param nonce リクエストID
 * @returns 生成された署名
 */
async function generateSignature(args: {
  token: string;
  secret: string;
  nonce: string;
  time: number;
}): Promise<string> {
  const data = `${args.token}${args.time}${args.nonce}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(args.secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signTerm = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data),
  );
  return btoa(String.fromCharCode(...new Uint8Array(signTerm)));
}

const env = await load();
const SWITCHBOT_TOKEN = env.SWITCHBOT_TOKEN;
const SWITCHBOT_CLIENT_SECRET = env.SWITCHBOT_CLIENT_SECRET;

if (!SWITCHBOT_TOKEN || !SWITCHBOT_CLIENT_SECRET) {
  console.error(
    "環境変数 SWITCHBOT_TOKEN と SWITCHBOT_CLIENT_SECRET が必要です",
  );
  Deno.exit(1);
}

const BASE_URL = "https://api.switch-bot.com/v1.1";

const flags = parseArgs(Deno.args, {
  string: ["path", "method"],
  default: { method: "GET" },
});

const path = flags.path;
const method = flags.method;

if (!path) {
  console.error(
    "パスは必須です。例: deno task start --path /devices",
  );
  Deno.exit(1);
}

const url = `${BASE_URL}${path}`;
const uuid = crypto.randomUUID();
const time = Date.now();

try {
  const response = await fetch(url, {
    method: method,
    headers: {
      "Authorization": SWITCHBOT_TOKEN,
      "Content-Type": "application/json",
      "sign": await generateSignature({
        token: SWITCHBOT_TOKEN,
        secret: SWITCHBOT_CLIENT_SECRET,
        nonce: uuid,
        time: time,
      }),
      "t": time.toString(),
      "nonce": uuid,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
} catch (error) {
  console.error("エラーが発生しました:", error);
  Deno.exit(1);
}
