/**
 * Result型: エラーハンドリングを明示的に行うための型
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T> => ({
  ok: true,
  value,
});

export const err = <E = Error>(error: E): Result<never, E> => ({
  ok: false,
  error,
});

export const tryCatch = async <T>(
  fn: () => Promise<T>,
): Promise<Result<T>> => {
  try {
    return ok(await fn());
  } catch (error) {
    return err(error as Error);
  }
};

export const isOk = <T>(result: Result<T>): result is { ok: true; value: T } => {
  return result.ok;
};

export const isErr = <T, E>(result: Result<T, E>): result is { ok: false; error: E } => {
  return !result.ok;
};
