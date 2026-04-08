import { useState } from 'react';

/**
 * Hook to fetch raw AI interaction logs.
 */
export const useAiLogs = () => {
  return { logs: [], loading: false };
};