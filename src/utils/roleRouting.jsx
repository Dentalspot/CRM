import { USER_ROLES } from '@/constants/roles';

export const getDashboardPathByRole = (role) => {
  if (!role) return '/dashboard';

  switch (role) {
    case USER_ROLES.THERAPIST:
      return '/dashboard/therapist';
    case USER_ROLES.PATIENT:
      return '/dashboard/patient';
    case USER_ROLES.ADMIN:
      return '/admin';
    case USER_ROLES.CLINIC:
      return '/dashboard/clinic';
    default:
      return '/dashboard';
  }
};

export const getRoleFromPath = (path) => {
  if (!path) return null;

  if (path.includes('/therapist')) return USER_ROLES.THERAPIST;
  if (path.includes('/patient')) return USER_ROLES.PATIENT;
  if (path.includes('/admin')) return USER_ROLES.ADMIN;
  if (path.includes('/clinic')) return USER_ROLES.CLINIC;

  return null;
};

export const canAccessRoute = (userRole, path) => {
  if (!userRole || !path) return false;

  // Admin puede acceder a todo
  if (userRole === USER_ROLES.ADMIN) return true;

  // Verificar acceso según rol
  const pathRole = getRoleFromPath(path);

  // Rutas compartidas
  const sharedRoutes = ['/dashboard/settings', '/dashboard/reports'];
  if (sharedRoutes.some(route => path.startsWith(route))) {
    return true;
  }

  // Rutas específicas por rol
  if (pathRole === userRole) return true;

  // Clínica puede ver calendario y pacientes
  if (userRole === USER_ROLES.CLINIC) {
    const clinicAllowedPaths = ['/dashboard/calendar', '/dashboard/patients'];
    if (clinicAllowedPaths.some(route => path.startsWith(route))) {
      return true;
    }
  }

  return false;
};