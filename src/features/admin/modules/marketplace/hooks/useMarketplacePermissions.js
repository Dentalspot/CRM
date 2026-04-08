import { useAdminPermissions } from '@/contexts/AdminPermissionContext';

export const useMarketplacePermissions = () => {
  const { hasPermission, isSuperAdmin } = useAdminPermissions();

  return {
    canRead: isSuperAdmin || hasPermission('marketplace', 'read') || hasPermission('sales', 'read') || hasPermission('commissions', 'read') || hasPermission('withdrawals', 'read'),
    canWrite: isSuperAdmin || hasPermission('marketplace', 'write') || hasPermission('sales', 'write') || hasPermission('commissions', 'write') || hasPermission('withdrawals', 'write'),
    isSuperAdmin,
  };
};
