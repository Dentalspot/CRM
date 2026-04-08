import { useState } from 'react';
import { aiToolsApi } from '../api/aiToolsApi';

/**
 * Hook to manage datasets.
 * Use: const { datasets, upload } = useDatasets();
 */
export const useDatasets = () => {
  const [datasets, setDatasets] = useState([]);
  
  const upload = async (file) => {
    return aiToolsApi.uploadDataset(file, {});
  };

  return { datasets, loading: false, upload };
};