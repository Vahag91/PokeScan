import { useState, useEffect, useCallback } from 'react';

export default function useSafeAsync(fetchFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const run = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const result = await fetchFn();
      setData(result);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, retry: run };
}