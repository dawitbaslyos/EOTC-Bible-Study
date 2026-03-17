import { useState, useEffect, useCallback } from 'react';

interface UseLazyDataOptions<T> {
  fetchFn: () => Promise<T>;
  enabled?: boolean;
  onError?: (error: Error) => void;
}

interface UseLazyDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useLazyData<T>({
  fetchFn,
  enabled = true,
  onError
}: UseLazyDataOptions<T>): UseLazyDataReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch data');
      setError(error);
      if (onError) {
        onError(error);
      }
      console.error('Lazy data fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, enabled, onError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

