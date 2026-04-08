/**
 * Hook to fetch the history of manual level changes and recalculations.
 * @param {string} therapistId
 * @returns {{history: Array, loading: boolean}}
 */
export const useLevelChangeHistory = (therapistId) => {
  return {
    history: [],
    loading: false,
  };
};