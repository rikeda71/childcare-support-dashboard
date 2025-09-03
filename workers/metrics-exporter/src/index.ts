import type { Env } from "./types.ts";
import type { ExecutionContext } from "@cloudflare/workers-types";
import { handleHealthCheck, handleQueryRequest, handleSearchRequest } from "./json-api.ts";

export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (env.API_KEY) {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response("Unauthorized", {
          status: 401,
          headers: { "WWW-Authenticate": "Bearer" },
        });
      }

      const token = authHeader.substring(7);
      if (token !== env.API_KEY) {
        return new Response("Invalid token", { status: 403 });
      }
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (url.pathname === "/") {
      return handleHealthCheck();
    }

    if (url.pathname === "/search" && request.method === "POST") {
      return handleSearchRequest();
    }

    if (url.pathname === "/query" && request.method === "POST") {
      return await handleQueryRequest(env, request);
    }

    return new Response("Not Found", { status: 404 });
  },
};
