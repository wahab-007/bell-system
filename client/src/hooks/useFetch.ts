import { useCallback, useEffect, useState } from 'react';

export const useFetch = <T>(fn: () => Promise<{ data: T }>, deps: unknown[] = []) => {
  const [data, setData] = useState<T | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const execute = useCallback(() => {
    setLoading(true);
    setError(undefined);
    return fn()
      .then((response) => setData(response.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [fn, ...deps]);

  useEffect(() => {
    let cancelled = false;
    if (!cancelled) execute();
    return () => {
      cancelled = true;
    };
  }, [execute]);

  return { data, loading, error, refetch: execute };
};
