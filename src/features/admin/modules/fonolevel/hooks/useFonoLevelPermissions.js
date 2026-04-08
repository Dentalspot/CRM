import { useAdminPermissions } from '@/contexts/AdminPermissionContext';

/**
 * Centralized hook for checking DentalLevel module permissions.
 * @returns {{canRead: boolean, canWrite: boolean, canManageSystem: boolean}}
 */
export const useDentalLevelPermissions = () => {
  const { hasPermission, isSuperAdmin } = useAdminPermissions();
  
  // A super admin or someone with 'dentallevel.write' can manage the system
  const canManageSystem = isSuperAdmin || hasPermission('dentallevel', 'write');

  return {
    canRead: hasPermission('dentallevel', 'read') || canManageSystem,
    canWrite: canManageSystem,
    canManageSystem: canManageSystem,
  };
};