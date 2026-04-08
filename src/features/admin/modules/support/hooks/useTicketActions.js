import { supportApi } from '../api/supportApi';

/**
 * Hook for ticket operations (create, update, close).
 */
export const useTicketActions = () => {
  const createTicket = async (data) => supportApi.createTicket(data);
  const updateTicket = async (id, data) => supportApi.updateTicket(id, data);
  
  return { createTicket, updateTicket };
};