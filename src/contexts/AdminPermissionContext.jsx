/**
 * @file src/contexts/AdminPermissionContext.jsx
 *
 * Contexto global de permisos admin.
 * Consulta admin_permissions y expone helpers para verificar acceso por modulo.
 *
 * SEGURIDAD (DentalSpot):
 * - NO existe super_admin — cada admin solo accede a sus modulos asignados
 * - Modulo 'all' en admin_permissions = acceso a todos los modulos (pero sigue filtrando por app)
 * - Los datos se filtran por origin_app='dentalspot' para no mezclar con FonoKit/otros
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

export const AdminPermissionContext = createContext(undefined);

/**
 * Identificador de esta app — se usa para filtrar datos en queries admin.
 * Cada clon de Comunicare tiene el suyo.
 */
export const CURRENT_APP_ID = 'dentalspot';

export const AdminPermissionProvider = ({ children }) => {
  const { user, profile, loading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const isAdmin = useMemo(() => profile?.role === 'admin', [profile]);

  const fetchAdminPermissions = useCallback(async () => {
    if (authLoading) return;

    if (!user || !profile || !isAdmin) {
      setPermissions(null);
      setLoading(false);
      setError(null);
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
  }, [user, profile, isAdmin, authLoading]);

  useEffect(() => {
    fetchAdminPermissions();
  }, [fetchAdminPermissions]);

  /**
   * Verifica si tiene permiso en un modulo
   */
  const hasPermission = useCallback((permissionKey, check = 'any') => {
    if (!permissions || !permissionKey) return false;

    // Modulo 'all' = acceso a todos los modulos
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
  }, [permissions]);

  const hasAnyPermission = useCallback((permissionKeys = []) => {
    if (!permissions) return false;
    return permissionKeys.some(key => hasPermission(key));
  }, [permissions, hasPermission]);

  const hasAllPermissions = useCallback((permissionKeys = []) => {
    if (!permissions) return false;
    return permissionKeys.every(key => hasPermission(key));
  }, [permissions, hasPermission]);

  const getAccessibleModules = useCallback(() => {
    if (!permissions) return [];
    if (permissions['all']) return ['all'];
    return Object.keys(permissions).filter(key => {
      const perm = permissions[key];
      return perm && (perm.can_read || perm.can_write);
    });
  }, [permissions]);

  const value = useMemo(() => ({
    permissions,
    loading,
    error,
    lastUpdated,
    isAdmin,
    isSuperAdmin: false, // Eliminado por seguridad — siempre false
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessModule: hasPermission,
    getAccessibleModules,
    refreshPermissions: fetchAdminPermissions,
  }), [
    permissions, loading, error, lastUpdated,
    isAdmin,
    hasPermission, hasAnyPermission, hasAllPermissions,
    getAccessibleModules, fetchAdminPermissions,
  ]);

  return (
    <AdminPermissionContext.Provider value={value}>
      {children}
    </AdminPermissionContext.Provider>
  );
};

export const useAdminPermissions = () => {
  const context = useContext(AdminPermissionContext);
  if (context === undefined) {
    throw new Error('useAdminPermissions must be used within an AdminPermissionProvider');
  }
  return context;
};
