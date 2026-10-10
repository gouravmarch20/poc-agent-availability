import { useCallback, useState } from 'react';

export function useApiRequest() {
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState('');

  const execute = useCallback(async <T,>(request: () => Promise<T>): Promise<T> => {
    setPendingCount((count) => count + 1);
    setError('');
    try {
      return await request();
    } catch (cause) {
      if (!(cause instanceof Error && cause.name === 'AbortError')) {
        setError(cause instanceof Error ? cause.message : 'Request failed');
      }
      throw cause;
    } finally {
      setPendingCount((count) => Math.max(0, count - 1));
    }
  }, []);

  const clearError = useCallback(() => setError(''), []);

  return { execute, loading: pendingCount > 0, error, clearError };
}