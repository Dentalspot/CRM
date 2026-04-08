import { useState, useEffect } from 'react';
import { supportApi } from '../api/supportApi';

/**
 * Hook to manage support tickets list.
 * Usage: const { tickets, loading, refetch } = useSupportTickets({ status: 'open' });
 */
export const useSupportTickets = (filters) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supportApi.fetchTickets(filters).then(res => {
      setTickets(res.data);
      setLoading(false);
    });
  }, [JSON.stringify(filters)]);

  return { tickets, loading, refetch: () => {} };
};