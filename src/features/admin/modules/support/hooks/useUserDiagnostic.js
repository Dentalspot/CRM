import { useState, useEffect } from 'react';
import { supportApi } from '../api/supportApi';

/**
 * Hook to fetch detailed diagnostic data for a user.
 */
export const useUserDiagnostic = (userId) => {
  const [diagnostic, setDiagnostic] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      setLoading(true);
      supportApi.fetchUserDiagnostic(userId).then(data => {
        setDiagnostic(data);
        setLoading(false);
      });
    }
  }, [userId]);

  return { diagnostic, loading };
};