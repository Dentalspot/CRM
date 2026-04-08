import { useState, useEffect } from 'react';
import { legalApi } from '../api/legalApi';

export const useLegalAudits = (filters) => {
  const [audits, setAudits] = useState([]);
  useEffect(() => {
    legalApi.fetchAudits(filters).then(res => setAudits(res.data));
  }, [JSON.stringify(filters)]);
  return { audits, loading: false };
};