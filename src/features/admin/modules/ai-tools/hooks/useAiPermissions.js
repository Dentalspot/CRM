import { useAdminPermissions } from '@/contexts/AdminPermissionContext';

/**
 * Hook to check specific AI module permissions.
 */
export const useAiPermissions = () => {
  const { hasPermission } = useAdminPermissions();
  
  return {
    canExecute: hasPermission('ai-tools', 'execute'),
    canManage: hasPermission('ai-tools', 'write'),
    canView: hasPermission('ai-tools', 'read')
  };
};