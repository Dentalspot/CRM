import { useState, useEffect } from 'react';
import { supportApi } from '../api/supportApi';

/**
 * Hook to fetch audit logs specifically for support actions.
 */
export const useSupportAuditLogs = (filters) => {
  const [auditLogs, setAuditLogs] = useState([]);
  useEffect(() => {
    supportApi.fetchSupportAuditLogs(filters).then(res => setAuditLogs(res.data));
  }, [JSON.stringify(filters)]);
  return { auditLogs, loading: false };
};