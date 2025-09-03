// Cloudflare D1 type definitions
declare global {
  interface D1Database {
    prepare(query: string): D1PreparedStatement;
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>;
  }

  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = unknown>(): Promise<T | null>;
    all<T = unknown>(): Promise<{ results: T[]; success: boolean; meta: unknown }>;
    run(): Promise<{ success: boolean; meta: { changes: number } }>;
  }
}

export {};
