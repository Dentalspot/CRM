import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, SlidersHorizontal } from 'lucide-react';
import { useAdminPermissions } from '@/contexts/AdminPermissionContext';
import { AdminPermissionProvider } from '@/contexts/AdminPermissionContext'; // Import provider

const GeneralSettings = () => (
    <Card>
        <CardHeader>
            <CardTitle>Configuración General</CardTitle>
            <CardDescription>Ajustes generales de la plataforma. Solo visible si tienes el permiso 'manage_settings'.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>Contenido de configuración general...</p>
        </CardContent>
    </Card>
);

const UserManagementSettings = () => (
    <Card>
        <CardHeader>
            <CardTitle>Gestión de Usuarios</CardTitle>
            <CardDescription>Ajustes de roles y usuarios. Solo visible si tienes el permiso 'manage_users'.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>Contenido de gestión de usuarios...</p>
        </CardContent>
    </Card>
);

const BillingAndReports = () => (
     <Card>
        <CardHeader>
            <CardTitle>Facturación y Reportes</CardTitle>
            <CardDescription>Visible si tienes 'manage_billing' O 'view_reports'.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>Contenido de facturación y reportes...</p>
        </CardContent>
    </Card>
);

const AdvancedContentManagement = () => (
    <Card>
        <CardHeader>
            <CardTitle>Gestión de Contenido Avanzada</CardTitle>
            <CardDescription>Visible si tienes 'manage_content' Y 'approve_posts'.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>Contenido para la gestión y aprobación de posts...</p>
        </CardContent>
    </Card>
);

const AdminSettingsContent = () => {
    const { hasPermission, hasAnyPermission, hasAllPermissions, loading, isSuperAdmin } = useAdminPermissions();

    if (loading) {
        return (
            <div className="flex h-[300px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    // In a real scenario, the entire page might be protected by a top-level PermissionGuard.
    // Here, we conditionally render components to demonstrate the hook.
    
    const canSeeGeneralSettings = isSuperAdmin || hasPermission('manage_settings');
    const canSeeUserManagement = isSuperAdmin || hasPermission('manage_users');
    const canSeeBilling = isSuperAdmin || hasAnyPermission(['manage_billing', 'view_reports']);
    const canSeeAdvancedContent = isSuperAdmin || hasAllPermissions(['manage_content', 'approve_posts']);

    return (
        <div className="space-y-8">
            <Alert>
                <AlertTitle>Página de Demostración (Refactorizada)</AlertTitle>
                <AlertDescription>
                    Esta página demuestra el uso del nuevo hook <code>useAdminPermissions</code>. Los módulos se renderizan condicionalmente en lugar de usar <code>PermissionGuard</code> para cada uno, lo cual es más eficiente.
                </AlertDescription>
            </Alert>

            {canSeeGeneralSettings && <GeneralSettings />}
            
            {canSeeUserManagement && <UserManagementSettings />}

            {canSeeBilling && <BillingAndReports />}
            
            {canSeeAdvancedContent && <AdvancedContentManagement />}

            <Card>
                <CardHeader>
                    <CardTitle>Módulo sin Permiso Específico</CardTitle>
                    <CardDescription>Este módulo no está protegido por un permiso específico y es visible para cualquier administrador.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Este contenido es siempre visible para roles de administrador.</p>
                </CardContent>
            </Card>

            {!canSeeGeneralSettings && !canSeeUserManagement && !canSeeBilling && !canSeeAdvancedContent && !isSuperAdmin && (
                 <Alert variant="destructive">
                    <AlertTitle>Sin Permisos Asignados</AlertTitle>
                    <AlertDescription>
                       No tienes permisos para ver ningún módulo de configuración. Contacta a un super-administrador.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
};

// Main page component wraps content with the provider
const AdminSettingsPage = () => {
    return (
        <AdminPermissionProvider>
            <Helmet>
                <title>Configuración de Administrador | DentalSpot</title>
                <meta name="description" content="Gestiona la configuración avanzada de la plataforma DentalSpot." />
            </Helmet>
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <SlidersHorizontal className="w-8 h-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold">Configuración de Administrador</h1>
                        <p className="text-muted-foreground">
                            Ajusta los parámetros y módulos de la plataforma.
                        </p>
                    </div>
                </div>
                <AdminSettingsContent />
            </div>
        </AdminPermissionProvider>
    );
};

export default AdminSettingsPage;