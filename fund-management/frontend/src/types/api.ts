export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
  code?: string;
  [extra: string]: unknown;
}

export type ApiErrorKind = 'network' | 'bad-request' | 'not-found' | 'conflict' | 'server' | 'unknown';
