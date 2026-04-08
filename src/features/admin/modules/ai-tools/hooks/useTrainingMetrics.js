import { useState } from 'react';

/**
 * Hook to stream live training metrics.
 */
export const useTrainingMetrics = (jobId) => {
  return { metrics: [], isStreaming: false };
};