import { useState } from 'react';

/**
 * Hook to analyze user feedback on AI responses.
 */
export const useFeedbackStats = () => {
  return { stats: {}, loading: false };
};