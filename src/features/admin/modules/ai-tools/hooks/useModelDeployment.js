import { useState } from 'react';

/**
 * Hook to manage deployment status of models.
 */
export const useModelDeployment = () => {
  return { deployments: [], deploy: async () => {}, loading: false };
};