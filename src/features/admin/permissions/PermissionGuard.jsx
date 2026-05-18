
import React from 'react';
import { Loader2, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAdminPermissions } from '@/contexts/AdminPermissionContext';

/**
 * Renders when access is denied.
 */
const AccessDenied = () => (
  <div className="flex items-center justify-center min-h-[400px] p-4">
    <Card className="w-full max-w-md text-center shadow-lg border-red-100">
      <CardHeader>
        <div className="mx-auto bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-2">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <CardTitle className="text-2xl font-bold">Acceso Denegado</CardTitle>
        <CardDescription className="text-base">
          No tienes los permisos necesarios para acceder a este módulo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline">
          <Link to="/admin">Volver al Dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  </div>
);

/**
 * Guard component that checks for specific admin permissions.
 */
const PermissionGuard = ({ children, requiredPermissions, module, action, requireAll = false, fallback }) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, permissions, loading, isSuperAdmin } = useAdminPermissions();

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }

  let hasAccess = false;

  if (isSuperAdmin) {
    hasAccess = true;
  } else if (module && action) {
    // Usar hasPermission del contexto en vez de acceso directo a
    // permissions[module]: el helper respeta el wildcard module='all'
    // (un admin con 'all' debe pasar cualquier check de módulo). El acceso
    // directo previo ignoraba 'all' y daba "Acceso Denegado" a admins
    // legítimos en todas las rutas gated por module+action.
    hasAccess = hasPermission(module, action === 'write' ? 'write' : 'read');
  } else if (typeof requiredPermissions === 'string') {
    hasAccess = hasPermission(requiredPermissions);
  } else if (Array.isArray(requiredPermissions)) {
    hasAccess = requireAll 
      ? hasAllPermissions(requiredPermissions) 
      : hasAnyPermission(requiredPermissions);
  }

  if (hasAccess) {
    return children;
  }
  
  return fallback || <AccessDenied />;
};

export default PermissionGuard;
