import { useCallback, useState } from 'react';
import { ApiError } from '../api';
import { notifyError } from '../lib/notify';

interface ApiRequestOptions {
  // Pages that replace their content with an inline error (instead of a toast) pass silent: true.
  silent?: boolean;
}

function toastDetails(cause: unknown): string | undefined {
  if (!(cause instanceof ApiError) || cause.details.length === 0) return undefined;
  return cause.details.slice(0, 3).map((detail) => detail.message).join(' · ');
}

export function useApiRequest({ silent = false }: ApiRequestOptions = {}) {
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState('');

  const execute = useCallback(async <T,>(request: () => Promise<T>): Promise<T> => {
    setPendingCount((count) => count + 1);
    setError('');
    try {
      return await request();
    } catch (cause) {
      if (!(cause instanceof Error && cause.name === 'AbortError')) {
        const message = cause instanceof Error ? cause.message : 'Request failed';
        setError(message);
        // 401s are handled globally (session-expired toast and redirect), so skip them here.
        const unauthorized = cause instanceof ApiError && cause.status === 401;
        if (!silent && !unauthorized) notifyError(message, { description: toastDetails(cause) });
      }
      throw cause;
    } finally {
      setPendingCount((count) => Math.max(0, count - 1));
    }
  }, [silent]);

  const clearError = useCallback(() => setError(''), []);

  return { execute, loading: pendingCount > 0, error, clearError };
}
