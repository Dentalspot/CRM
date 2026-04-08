import { useState } from 'react';

/**
 * Hook to fetch detail of a specific evaluation run.
 */
export const useAiEvaluationDetail = (evalId) => {
  return { evaluation: null, loading: false };
};