import { describe, expect, it } from 'vitest';
import { ApiError } from '../api/client';
import { getErrorMessage } from './errorMessage';

describe('getErrorMessage', () => {
  it('uses the screen-specific message for 409 Conflict', () => {
    const error = new ApiError(409, { statusCode: 409, message: 'active order', code: 'ACTIVE_ORDER_EXISTS' }, '');
    expect(error.kind).toBe('conflict');
    expect(getErrorMessage(error, { conflict: 'มี order ค้างอยู่' })).toBe('มี order ค้างอยู่');
  });

  it('lists every validation message for 400', () => {
    const error = new ApiError(400, { statusCode: 400, message: ['amount must be positive', 'portfolioId must be a UUID'] }, '');
    expect(getErrorMessage(error)).toContain('amount must be positive, portfolioId must be a UUID');
  });

  it('maps 404 and network errors', () => {
    expect(getErrorMessage(new ApiError(404, null, ''), { notFound: 'ไม่พบ' })).toBe('ไม่พบ');
    expect(getErrorMessage(new ApiError(0, null, ''))).toContain('ไม่สามารถเชื่อมต่อ');
  });
});
