/** Error body produced by NestJS HttpException / ValidationPipe. */
export interface ApiErrorBody {
  statusCode: number;
  /** ValidationPipe returns one message per failed constraint. */
  message: string | string[];
  error?: string;
  /** Domain error code set by the backend, e.g. ACTIVE_ORDER_EXISTS. */
  code?: string;
  [extra: string]: unknown;
}

export type ApiErrorKind = 'network' | 'bad-request' | 'not-found' | 'conflict' | 'server' | 'unknown';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

/** Per-screen overrides so the same status code can read differently in context. */
export interface ErrorMessageOverrides {
  conflict?: string;
  notFound?: string;
}
