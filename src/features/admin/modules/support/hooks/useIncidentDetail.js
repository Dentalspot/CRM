import { useState, useEffect } from 'react';
import { supportApi } from '../api/supportApi';

/**
 * Hook for incident details.
 */
export const useIncidentDetail = (incidentId) => {
  const [incident, setIncident] = useState(null);
  useEffect(() => {
    if (incidentId) supportApi.fetchIncidentById(incidentId).then(setIncident);
  }, [incidentId]);
  return { incident, loading: !incident };
};