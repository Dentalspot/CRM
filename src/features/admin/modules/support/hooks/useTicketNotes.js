import { supportApi } from '../api/supportApi';

/**
 * Hook to manage notes on a ticket.
 */
export const useTicketNotes = (ticketId) => {
  const addNote = async (content) => {
    return supportApi.addNote({ entityId: ticketId, entityType: 'ticket', content });
  };
  return { addNote };
};