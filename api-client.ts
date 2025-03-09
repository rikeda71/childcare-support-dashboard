import { parse } from "std/flags/mod.ts";

const flags = parse(Deno.args, {
  string: ["url", "method"],
  default: { method: "GET" },
});

if (!flags.url) {
  console.error(
    "URLは必須です。例: deno run --allow-net api-client.ts --url https://api.example.com",
  );
  Deno.exit(1);
}

try {
  const response = await fetch(flags.url, {
    method: flags.method,
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
} catch (error) {
  console.error("エラーが発生しました:", error.message);
  Deno.exit(1);
}
