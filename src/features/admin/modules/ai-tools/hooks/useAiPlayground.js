import { useState } from 'react';
import { aiToolsApi } from '../api/aiToolsApi';

/**
 * Hook for AI Playground interactions.
 * Use: const { run, output, isRunning } = useAiPlayground();
 */
export const useAiPlayground = () => {
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const run = async (modelId, prompt) => {
    setIsRunning(true);
    const res = await aiToolsApi.runInference(modelId, prompt, {});
    setOutput(res.output);
    setIsRunning(false);
  };

  return { run, output, isRunning };
};