/** Discriminated union for service-layer success/failure without throwing. */
export type Result<T, E = ServiceFailure> =
  | { success: true; data: T }
  | { success: false; error: E };

export interface ServiceFailure {
  code: string;
  message: string;
  statusCode: number;
  cause?: unknown;
}

export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function err<E extends ServiceFailure>(error: E): Result<never, E> {
  return { success: false, error };
}
