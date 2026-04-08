import { supportApi } from '../api/supportApi';

/**
 * Hook to manage notes on an incident.
 */
export const useIncidentNotes = (incidentId) => {
  const addNote = async (content) => {
    return supportApi.addNote({ entityId: incidentId, entityType: 'incident', content });
  };
  return { addNote };
};