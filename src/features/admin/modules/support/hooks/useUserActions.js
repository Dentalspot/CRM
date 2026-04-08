import { supportApi } from '../api/supportApi';

/**
 * Hook for administrative user actions (reset password, block).
 */
export const useUserActions = () => {
  const performAction = async (userId, action) => {
    return supportApi.performUserAction(userId, action);
  };
  return { performAction };
};