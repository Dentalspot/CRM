import { useState } from 'react';

/**
 * Hook for single training job details.
 */
export const useTrainingJobDetail = (jobId) => {
  return { job: null, loading: false };
};