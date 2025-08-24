import type { Env } from "./types.ts";
import { collectWeather } from "./handler.ts";

export default {
  /**
   * Cronトリガーによる定期実行
   */
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<void> {
    const result = await collectWeather(env);
    
    if (!result.ok) {
      console.error(JSON.stringify({
        level: "error",
        message: "Weather collection failed",
        error: result.error.message,
        timestamp: Date.now(),
      }));
      throw result.error; // Cloudflareに失敗を通知（プレゼンテーション層では例外を投げてOK）
    }
  },
  
  /**
   * HTTP経由での手動実行（デバッグ用）
   */
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<Response> {
    // POSTリクエストのみ受け付ける
    if (request.method !== "POST") {
      return new Response("Method not allowed. Use POST.", { 
        status: 405,
        headers: { "Content-Type": "text/plain" },
      });
    }
    
    const result = await collectWeather(env);
    
    if (!result.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error.message,
          timestamp: Date.now(),
        }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Weather collected successfully",
        timestamp: Date.now(),
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  },
};