import { useState, useEffect, useCallback } from 'react';

const DEFAULT_RETRYABLE_MESSAGES = [
  'statement timeout',
  'socket hang up',
  'network request failed',
];

export default function useSafeAsync(fetchFn, options = {}) {
  const { retries = 1, retryDelay = 600, retryOn = DEFAULT_RETRYABLE_MESSAGES } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const shouldRetry = useCallback(
    (err) => {
      if (!err?.message) return false;
      const message = err.message.toLowerCase();
      return retryOn.some((needle) => message.includes(needle.toLowerCase()));
    },
    [retryOn],
  );

  const run = useCallback(async () => {
    let attempt = 0;
    setLoading(true);
    setError(null);

    while (attempt <= retries) {
      try {
        const result = await fetchFn();
        setData(result);
        setLoading(false);
        return;
      } catch (e) {
        console.error('[useSafeAsync] fetch failed', {
          fn: fetchFn?.name || 'anonymous',
          attempt,
          message: e?.message,
          stack: e?.stack,
        });

        const canRetry = attempt < retries && shouldRetry(e);
        if (!canRetry) {
          setError(e);
          setLoading(false);
          return;
        }

        attempt += 1;
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }, [fetchFn, retries, retryDelay, shouldRetry]);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, retry: run };
}
