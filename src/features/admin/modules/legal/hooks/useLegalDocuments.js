import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { legalApi } from '../api/legalApi';

export const useLegalDocuments = (params = {}) => {
  const [documents, setDocuments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, count } = await legalApi.fetchDocuments(params);
      setDocuments(data);
      setTotalCount(count);
    } catch (err) {
      logger.error('Error fetching documents:', err);
    }
    setLoading(false);
  }, [JSON.stringify(params)]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  return { documents, totalCount, loading, refetch: fetchDocs };
};
