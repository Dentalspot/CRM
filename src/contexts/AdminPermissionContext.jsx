/**
 * @file src/contexts/AdminPermissionContext.jsx
 * 
 * Contexto global de permisos admin.
 * Consulta admin_permissions y expone helpers para verificar acceso por módulo.
 * 
 * Lógica de acceso:
 * - is_super_admin = true → bypass total (reservado para emergencias)
 * - role = 'admin' → permisos vienen de admin_permissions
 * - módulo 'all' en admin_permissions → acceso total (debug admin)
 * - Cualquier otro rol → sin permisos admin
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

export const AdminPermissionContext = createContext(undefined);

export const AdminPermissionProvider = ({ children }) => {
  const { user, profile, loading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // is_super_admin es solo para emergencias (no debería estar activo en producción)
  const isSuperAdmin = useMemo(() => profile?.is_super_admin === true, [profile]);

  const isAdmin = useMemo(() => profile?.role === 'admin', [profile]);

  const fetchAdminPermissions = useCallback(async () => {
    // Esperar a que auth termine de cargar
    if (authLoading) return;

    // Si no es admin, limpiar y salir
    if (!user || !profile || !isAdmin) {
      setPermissions(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Super admin bypass (emergencias)
    if (isSuperAdmin) {
      setPermissions({ _superAdmin: true });
      setLoading(false);
      setError(null);
      setLastUpdated(new Date());
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('admin_permissions')
        .select('module, can_read, can_write')
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      // Transformar array a objeto indexado por módulo
      const permsObject = data.reduce((acc, perm) => {
        acc[perm.module] = {
          can_read: perm.can_read,
          can_write: perm.can_write,
        };
        return acc;
      }, {});

      setPermissions(permsObject);
      setLastUpdated(new Date());

    } catch (err) {
      logger.error('[AdminPermissionContext] Error fetching permissions:', err);
      setError(err);
      setPermissions(null);
    } finally {
      setLoading(false);
    }
  }, [user, profile, isAdmin, isSuperAdmin, authLoading]);

  useEffect(() => {
    fetchAdminPermissions();
  }, [fetchAdminPermissions]);

  /**
   * Verifica si tiene permiso en un módulo
   * @param {string} permissionKey - Key del módulo
   * @param {'read' | 'write' | 'any'} check - Tipo de verificación
   */
  const hasPermission = useCallback((permissionKey, check = 'any') => {
    if (isSuperAdmin) return true;
    if (!permissions || !permissionKey) return false;

    // Módulo 'all' = acceso total (debug admin)
    if (permissions['all']) {
      const allPerm = permissions['all'];
      if (check === 'read') return allPerm.can_read || allPerm.can_write;
      if (check === 'write') return allPerm.can_write;
      return allPerm.can_read || allPerm.can_write;
    }

    const perm = permissions[permissionKey];
    if (!perm) return false;

    if (check === 'read') return perm.can_read || perm.can_write;
    if (check === 'write') return perm.can_write;
    return perm.can_read || perm.can_write;
  }, [permissions, isSuperAdmin]);

  const hasAnyPermission = useCallback((permissionKeys = []) => {
    if (isSuperAdmin) return true;
    if (!permissions) return false;
    return permissionKeys.some(key => hasPermission(key));
  }, [permissions, isSuperAdmin, hasPermission]);

  const hasAllPermissions = useCallback((permissionKeys = []) => {
    if (isSuperAdmin) return true;
    if (!permissions) return false;
    return permissionKeys.every(key => hasPermission(key));
  }, [permissions, isSuperAdmin, hasPermission]);

  /**
   * Retorna los módulos accesibles para construir sidebar dinámico
   */
  const getAccessibleModules = useCallback(() => {
    if (isSuperAdmin) return ['all'];
    if (!permissions) return [];

    // Si tiene 'all', acceso total
    if (permissions['all']) return ['all'];

    return Object.keys(permissions).filter(key => {
      const perm = permissions[key];
      return perm && (perm.can_read || perm.can_write);
    });
  }, [permissions, isSuperAdmin]);

  const value = useMemo(() => ({
    permissions,
    loading,
    error,
    lastUpdated,
    isAdmin,
    isSuperAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessModule: hasPermission,
    getAccessibleModules,
    refreshPermissions: fetchAdminPermissions,
  }), [
    permissions, loading, error, lastUpdated,
    isAdmin, isSuperAdmin,
    hasPermission, hasAnyPermission, hasAllPermissions,
    getAccessibleModules, fetchAdminPermissions,
  ]);

  return (
    <AdminPermissionContext.Provider value={value}>
      {children}
    </AdminPermissionContext.Provider>
  );
};

/**
 * Hook para acceder al contexto de permisos admin
 */
export const useAdminPermissions = () => {
  const context = useContext(AdminPermissionContext);
  if (context === undefined) {
    throw new Error('useAdminPermissions must be used within an AdminPermissionProvider');
  }
  return context;
};