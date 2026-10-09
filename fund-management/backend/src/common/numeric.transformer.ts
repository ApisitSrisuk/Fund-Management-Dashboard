import { ValueTransformer } from 'typeorm';

/**
 * pg returns NUMERIC columns as strings to avoid precision loss.
 * Amounts here are capped at 2 decimals / 18 digits, so converting to a JS number is safe for display.
 */
export const numericTransformer: ValueTransformer = {
  to: (value: number | null | undefined) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};
