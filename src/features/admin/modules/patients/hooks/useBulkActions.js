import { useState, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { patientsApi } from '../api/patientsApi';

export const useBulkActions = () => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleSelection = useCallback((id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback((ids) => {
    setSelectedIds(prev => prev.length === ids.length ? [] : [...ids]);
  }, []);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const performAction = useCallback(async (action, onComplete) => {
    if (!selectedIds.length) return;
    setIsProcessing(true);
    try {
      await patientsApi.performBulkAction(selectedIds, action);
      setSelectedIds([]);
      if (onComplete) onComplete();
    } catch (err) {
      logger.error('Bulk action error:', err);
    }
    setIsProcessing(false);
  }, [selectedIds]);

  return { selectedIds, toggleSelection, selectAll, clearSelection, performAction, isProcessing };
};
