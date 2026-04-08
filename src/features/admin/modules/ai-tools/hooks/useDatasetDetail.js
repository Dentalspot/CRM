import { useState } from 'react';

/**
 * Hook for dataset details and statistics.
 */
export const useDatasetDetail = (datasetId) => {
  return { dataset: null, loading: false };
};