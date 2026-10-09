import { isApiError } from '../api/client';

/** Per-screen overrides so the same status code can read differently in context. */
export interface ErrorMessageOverrides {
  conflict?: string;
  notFound?: string;
}

/** Turns any thrown value into a user-facing Thai message, keyed on HTTP status. */
export function getErrorMessage(error: unknown, overrides: ErrorMessageOverrides = {}): string {
  if (!isApiError(error)) {
    return error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
  }

  switch (error.kind) {
    case 'network':
      return 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่า backend ทำงานอยู่';
    case 'bad-request':
      return `ข้อมูลไม่ถูกต้อง: ${error.messages.join(', ')}`;
    case 'not-found':
      return overrides.notFound ?? 'ไม่พบข้อมูลที่ต้องการ (404)';
    case 'conflict':
      return overrides.conflict ?? `ไม่สามารถดำเนินการได้: ${error.message}`;
    case 'server':
      return 'เซิร์ฟเวอร์เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
    default:
      return error.message;
  }
}
