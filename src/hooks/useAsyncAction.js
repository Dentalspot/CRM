import { useState, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { useToast } from '@/components/ui/use-toast';

/**
 * Standardized hook for async operations with loading, error, and toast.
 *
 * Usage:
 *   const { execute, loading, error } = useAsyncAction();
 *
 *   // In a handler:
 *   const result = await execute(
 *     () => savePatient(data),
 *     { success: 'Paciente guardado', error: 'Error al guardar paciente' }
 *   );
 *   if (result) { // success }
 *
 *   // For fetches (no success toast):
 *   const data = await execute(() => fetchPatients(id));
 */
export function useAsyncAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const execute = useCallback(async (fn, options = {}) => {
    const { success, error: errorMsg } = options;

    setLoading(true);
    setError(null);

    try {
      const result = await fn();

      if (success) {
        toast({ title: success });
      }

      return result;
    } catch (err) {
      const message = err?.message || errorMsg || 'Ocurrió un error inesperado';
      setError(message);
      logger.error('[useAsyncAction]', message, err);

      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMsg || message,
      });

      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const reset = useCallback(() => setError(null), []);

  return { execute, loading, error, reset };
}
