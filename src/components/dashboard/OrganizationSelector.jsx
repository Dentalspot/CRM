import React from 'react';
import { Building2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import useCurrentOrganization from '@/hooks/useCurrentOrganization';

const OrganizationSelector = () => {
  const {
    currentOrganizationId,
    currentOrganization,
    organizations,
    isMultiOrg,
    loading,
    setCurrentOrganizationId,
  } = useCurrentOrganization();

  // Cargando: skeleton discreto
  if (loading) {
    return <Skeleton className="h-8 w-36 rounded-md" />;
  }

  // Sin orgs: no mostrar nada
  if (organizations.length === 0) {
    return null;
  }

  // 1 org: badge sin interacción
  if (!isMultiOrg) {
    return (
      <Badge variant="outline" className="gap-1.5 px-2.5 py-1 text-xs font-medium text-muted-foreground">
        <Building2 className="h-3 w-3" />
        {currentOrganization?.name || 'Organización'}
      </Badge>
    );
  }

  // 2+ orgs: dropdown selector
  return (
    <Select value={currentOrganizationId || ''} onValueChange={setCurrentOrganizationId}>
      <SelectTrigger
        className={`h-8 w-auto min-w-[160px] max-w-[240px] gap-1.5 text-xs ${
          !currentOrganizationId ? 'border-amber-400 bg-amber-50' : ''
        }`}
      >
        <Building2 className="h-3 w-3 shrink-0" />
        <SelectValue placeholder="Seleccionar organización" />
      </SelectTrigger>
      <SelectContent>
        {organizations.map((org) => (
          <SelectItem key={org.id} value={org.id} className="text-xs">
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default OrganizationSelector;
