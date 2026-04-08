import { useState, useEffect } from 'react';
import { legalApi } from '../api/legalApi';

export const useLegalRisks = (filters) => {
  const [risks, setRisks] = useState([]);
  useEffect(() => {
    legalApi.fetchRisks(filters).then(res => setRisks(res.data));
  }, [JSON.stringify(filters)]);
  return { risks, loading: false };
};