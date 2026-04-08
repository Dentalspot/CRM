import { supportApi } from '../api/supportApi';

/**
 * Hook for managing incident lifecycle.
 */
export const useIncidentActions = () => {
  const manageIncident = async (data) => supportApi.manageIncident(data);
  return { manageIncident };
};