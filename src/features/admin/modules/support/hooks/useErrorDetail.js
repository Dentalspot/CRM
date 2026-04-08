import { useState, useEffect } from 'react';
import { supportApi } from '../api/supportApi';

/**
 * Hook for specific error details/stacktrace.
 */
export const useErrorDetail = (errorId) => {
  const [errorDetail, setErrorDetail] = useState(null);
  useEffect(() => {
    if (errorId) supportApi.fetchErrorDetail(errorId).then(setErrorDetail);
  }, [errorId]);
  return { errorDetail, loading: !errorDetail };
};