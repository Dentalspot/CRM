
import { useMemo } from 'react';
import { useAdminPermissions } from '@/contexts/AdminPermissionContext';

export const useBlogPermissions = () => {
  const { permissions, isSuperAdmin } = useAdminPermissions();
  
  return useMemo(() => {
    const blogPermissions = permissions?.blog || {};
    const reportesPermissions = permissions?.reportes || {};

    // can_write implies full access for the module
    const canWrite = isSuperAdmin || blogPermissions.can_write === true;
    const canRead = isSuperAdmin || blogPermissions.can_read === true || canWrite;

    const canReadReports = isSuperAdmin || reportesPermissions.can_read === true || reportesPermissions.can_write === true;

    return {
      canCreatePost: canWrite,
      canEditPost: canWrite,
      canDeletePost: canWrite,
      canPublishPost: canWrite,
      canModerate: canWrite,
      canViewAnalytics: canRead || canReadReports,
      canManageCategories: canWrite,
    };
  }, [permissions, isSuperAdmin]);
};
