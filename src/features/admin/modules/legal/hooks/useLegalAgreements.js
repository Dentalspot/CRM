import { useState, useEffect } from 'react';
import { legalApi } from '../api/legalApi';

export const useLegalAgreements = (filters) => {
  const [agreements, setAgreements] = useState([]);
  useEffect(() => {
    legalApi.fetchAgreements(filters).then(res => setAgreements(res.data));
  }, [JSON.stringify(filters)]);
  return { agreements, loading: false };
};