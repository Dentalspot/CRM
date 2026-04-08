import { useState, useEffect } from 'react';
import { supportApi } from '../api/supportApi';

/**
 * Hook to manage incidents list.
 */
export const useIncidents = (filters) => {
  const [incidents, setIncidents] = useState([]);
  useEffect(() => {
    supportApi.fetchIncidents(filters).then(res => setIncidents(res.data));
  }, [JSON.stringify(filters)]);
  return { incidents, loading: false };
};