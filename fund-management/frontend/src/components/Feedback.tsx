import type { ReactNode } from 'react';
import { getErrorMessage, type ErrorMessageOverrides } from '../utils/errorMessage';

export function Spinner({ label = 'กำลังโหลด…' }: { label?: string }) {
  return (
    <div className="state state--loading" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  overrides?: ErrorMessageOverrides;
}

export function ErrorState({ error, onRetry, overrides }: ErrorStateProps) {
  return (
    <div className="state state--error" role="alert">
      <p>{getErrorMessage(error, overrides)}</p>
      {onRetry && (
        <button type="button" className="btn btn--ghost" onClick={onRetry}>
          ลองใหม่
        </button>
      )}
    </div>
  );
}

export function InlineError({ error, overrides }: { error: unknown; overrides?: ErrorMessageOverrides }) {
  if (!error) return null;
  return (
    <p className="inline-error" role="alert">
      {getErrorMessage(error, overrides)}
    </p>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="state state--empty">{children}</div>;
}
