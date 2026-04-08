import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { supportApi } from '../api/supportApi';

export const useTicketDetail = (ticketId) => {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTicket = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const data = await supportApi.fetchTicketById(ticketId);
      setTicket(data);
    } catch (err) {
      logger.error('Error fetching ticket:', err);
      setTicket(null);
    }
    setLoading(false);
  }, [ticketId]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  return { ticket, loading, refetch: fetchTicket };
};
