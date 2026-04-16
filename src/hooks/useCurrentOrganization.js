import { useOrganization } from '@/contexts/OrganizationContext';

/**
 * Hook de conveniencia que expone el contexto de organización.
 * Mantiene la misma API pública que usaban los consumidores existentes.
 *
 * Si se llama fuera de OrganizationProvider (ej: páginas públicas),
 * devuelve valores seguros por defecto sin romper.
 */
const useCurrentOrganization = () => {
  try {
    return useOrganization();
  } catch {
    // Fuera del provider: devolver defaults seguros
    return {
      currentOrganizationId: null,
      currentOrganization: null,
      organizations: [],
      isMultiOrg: false,
      loading: false,
      setCurrentOrganizationId: () => {},
      userOrgRoles: [],
      effectiveRole: null,
    };
  }
};

export default useCurrentOrganization;
