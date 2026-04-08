import { useState } from 'react';
import { aiToolsApi } from '../api/aiToolsApi';

/**
 * Hook to list training jobs.
 * Use: const { jobs, startJob } = useTrainingJobs();
 */
export const useTrainingJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const startJob = async (config) => {
    return aiToolsApi.createTrainingJob(config);
  };

  return { jobs, loading, startJob };
};