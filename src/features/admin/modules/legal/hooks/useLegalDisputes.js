import { useState, useEffect } from 'react';
import { legalApi } from '../api/legalApi';

export const useLegalDisputes = (filters) => {
  const [disputes, setDisputes] = useState([]);
  useEffect(() => {
    legalApi.fetchDisputes(filters).then(res => setDisputes(res.data));
  }, [JSON.stringify(filters)]);
  return { disputes, loading: false };
};