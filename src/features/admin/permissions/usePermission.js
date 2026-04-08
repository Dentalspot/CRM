/**
 * @file src/features/admin/permissions/usePermission.js
 * 
 * Hook para verificar permisos admin granulares.
 * Conecta AdminPermissionContext con permissionMap.
 * 
 * La tabla admin_permissions solo tiene can_read y can_write.
 * can_write implica acceso completo (read + write + delete + approve).
 */

import { useCallback, useMemo } from 'react';
import { useAdminPermissions } from '@/contexts/AdminPermissionContext';
import logger from '@/lib/utils/logger';
import { permissionMap } from './permissionMap';

export function usePermission() {
  const { permissions, loading, error, isSuperAdmin } = useAdminPermissions();

  /**
   * Valida que un módulo exista en el permissionMap
   */
  const validateModule = useCallback((module) => {
    if (!permissionMap[module]) {
      logger.warn('[usePermission] Invalid module requested:', module);
      return false;
    }
    return true;
  }, []);

  /**
   * Verifica si el usuario tiene permiso para un módulo y acción.
   * 
   * Lógica de permisos:
   * - 'all' en permissions = acceso total (debug admin)
   * - can_write = true implica can_read = true
   * - action 'read' → requiere can_read OR can_write
   * - action 'write'/'delete'/'approve' → requiere can_write
   * 
   * @param {string} module - Key del módulo (debe coincidir con admin_permissions.module)
   * @param {'read' | 'write' | 'delete' | 'approve'} action - Acción a verificar
   * @returns {boolean}
   */
  const can = useCallback((module, action = 'read') => {
    // Super admin bypass
    if (isSuperAdmin) return true;

    // Loading o error → denegar por seguridad
    if (loading || error || !permissions) return false;

    // Validar módulo existe en el map
    if (!validateModule(module)) return false;

    // Check 'all' permission (debug admin tiene módulo 'all')
    if (permissions['all']) {
      return permissions['all'].can_read || permissions['all'].can_write;
    }

    // Check permiso específico del módulo
    const perm = permissions[module];
    if (!perm) return false;

    // read → can_read OR can_write
    if (action === 'read') {
      return perm.can_read || perm.can_write;
    }

    // write/delete/approve → requiere can_write
    return perm.can_write === true;
  }, [permissions, loading, error, isSuperAdmin, validateModule]);

  // Shortcuts
  const canRead = useCallback((module) => can(module, 'read'), [can]);
  const canWrite = useCallback((module) => can(module, 'write'), [can]);
  const canDelete = useCallback((module) => can(module, 'delete'), [can]);
  const canApprove = useCallback((module) => can(module, 'approve'), [can]);

  /**
   * Verifica si tiene permiso en AL MENOS UNO de los módulos
   */
  const hasAny = useCallback((modules, action = 'read') => {
    if (isSuperAdmin) return true;
    return modules.some(module => can(module, action));
  }, [can, isSuperAdmin]);

  /**
   * Verifica si tiene permiso en TODOS los módulos
   */
  const hasAll = useCallback((modules, action = 'read') => {
    if (isSuperAdmin) return true;
    return modules.every(module => can(module, action));
  }, [can, isSuperAdmin]);

  /**
   * Retorna los permisos detallados de un módulo
   */
  const getModulePermissions = useCallback((module) => {
    if (isSuperAdmin) {
      return { can_read: true, can_write: true };
    }
    if (!permissions || !validateModule(module)) return null;
    return permissions[module] || { can_read: false, can_write: false };
  }, [permissions, isSuperAdmin, validateModule]);

  /**
   * Retorna la lista de módulos a los que el usuario tiene acceso
   */
  const getAccessibleModules = useCallback(() => {
    if (isSuperAdmin) return Object.keys(permissionMap);
    if (!permissions) return [];

    // Si tiene 'all', puede acceder a todo
    if (permissions['all']) return Object.keys(permissionMap);

    return Object.keys(permissions).filter(key => {
      const perm = permissions[key];
      return perm && (perm.can_read || perm.can_write);
    });
  }, [permissions, isSuperAdmin]);

  return useMemo(() => ({
    can,
    canRead,
    canWrite,
    canDelete,
    canApprove,
    hasAny,
    hasAll,
    getModulePermissions,
    getAccessibleModules,
    isLoading: loading,
    isSuperAdmin,
    permissionError: error,
  }), [can, canRead, canWrite, canDelete, canApprove, hasAny, hasAll, getModulePermissions, getAccessibleModules, loading, isSuperAdmin, error]);
}