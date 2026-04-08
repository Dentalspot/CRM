import logger from '@/lib/utils/logger';

/**
 * Wraps an async API function with standardized error handling.
 *
 * READS: return fallback value on error (no throw)
 * WRITES: always throw on error (caller must handle)
 *
 * Usage:
 *   // Read - returns [] on error
 *   export const fetchPatients = apiHandler('fetchPatients', async () => {
 *     const { data, error } = await supabase.from('patients').select('*');
 *     if (error) throw error;
 *     return data;
 *   }, []);
 *
 *   // Write - throws on error (no fallback)
 *   export const savePatient = apiHandler.mutation('savePatient', async (patientData) => {
 *     const { data, error } = await supabase.from('patients').insert(patientData).select().single();
 *     if (error) throw error;
 *     return data;
 *   });
 */

/**
 * For READ operations — returns fallback on error, never throws.
 * @param {string} name - Operation name for logging
 * @param {Function} fn - Async function that does the actual work
 * @param {*} fallback - Value to return on error (default: null)
 */
export function apiHandler(name, fn, fallback = null) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      logger.error(`[${name}]`, error.message || error);
      return fallback;
    }
  };
}

/**
 * For WRITE operations — always throws on error.
 * @param {string} name - Operation name for logging
 * @param {Function} fn - Async function that does the actual work
 */
apiHandler.mutation = function (name, fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      logger.error(`[${name}]`, error.message || error);
      throw error;
    }
  };
};
