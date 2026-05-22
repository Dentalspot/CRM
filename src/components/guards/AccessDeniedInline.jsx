import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

/**
 * @file src/components/guards/AccessDeniedInline.jsx
 *
 * Componente reusable para mostrar "Acceso Denegado" cuando un user logueado
 * intenta acceder a una sección que no le corresponde por su rol.
 *
 * Se usa en RoleGuard cuando user existe pero NO matchea allowedRoles, en
 * vez de redirigir a /dashboard (que puede causar loops si la ruta inicial
 * ya es /dashboard) o a /auth/login (que rompe percepción de sesión activa).
 *
 * Análogo a `<AccessDenied />` interno de PermissionGuard (admin).
 *
 * Props:
 * - homePath: ruta a "Volver al inicio" — por default /dashboard
 * - message: mensaje custom (opcional)
 */
const AccessDeniedInline = ({ homePath = '/dashboard', message }) => (
  <div className="flex items-center justify-center min-h-[60vh] p-4">
    <Card className="w-full max-w-md text-center shadow-lg border-red-100">
      <CardHeader>
        <div className="mx-auto bg-red-100 p-4 rounded-full mb-2 w-fit">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <CardTitle className="text-2xl font-bold">Acceso denegado</CardTitle>
        <CardDescription className="text-base">
          {message || 'No tienes permiso para ver esta sección con tu cuenta actual.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline">
          <Link to={homePath}>Volver al inicio</Link>
        </Button>
      </CardContent>
    </Card>
  </div>
);

export default AccessDeniedInline;
