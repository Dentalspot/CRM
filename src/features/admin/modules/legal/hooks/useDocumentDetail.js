import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { legalApi } from '../api/legalApi';

export const useDocumentDetail = (id) => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDoc = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await legalApi.fetchDocumentById(id);
      setDocument(data);
    } catch (err) {
      logger.error('Error fetching document:', err);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchDoc(); }, [fetchDoc]);

  return { document, loading, refetch: fetchDoc };
};
