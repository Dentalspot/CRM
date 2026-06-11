import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Plus, Search, Loader2, Briefcase } from 'lucide-react';
import useCurrentOrganization from '@/hooks/useCurrentOrganization';
import {
  SPECIALTIES,
  listClinicsForOrg,
  listServicesByClinic,
  groupServicesBySpecialty,
} from '../api/clinicServicesApi';
import ServiceFormModal from '../components/ServiceFormModal';
import ServicesBySpecialtyList from '../components/ServicesBySpecialtyList';

export default function ClinicServicesPage() {
  const { currentOrganizationId, currentOrganization } = useCurrentOrganization();

  const [clinics, setClinics] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // Carga sucursales de la org
  useEffect(() => {
    if (!currentOrganizationId) return;
    (async () => {
      try {
        const list = await listClinicsForOrg(currentOrganizationId);
        setClinics(list);
        if (list.length > 0 && !selectedClinicId) {
          setSelectedClinicId(list[0].id);
        }
      } catch (err) {
        toast({
          title: 'No se pudieron cargar las sucursales',
          description: err.message,
          variant: 'destructive',
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganizationId]);

  // Carga servicios de la sucursal seleccionada
  const loadServices = async () => {
    if (!selectedClinicId) return;
    setLoading(true);
    try {
      const list = await listServicesByClinic(selectedClinicId, { includeInactive: showInactive });
      setServices(list);
    } catch (err) {
      toast({
        title: 'No se pudieron cargar los servicios',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClinicId, showInactive]);

  const filteredServices = useMemo(() => {
    let list = services;
    if (specialtyFilter !== 'all') {
      list = list.filter((s) => s.specialty === specialtyFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [services, specialtyFilter, search]);

  const groups = useMemo(() => groupServicesBySpecialty(filteredServices), [filteredServices]);

  const handleOpenNew = () => {
    setEditingService(null);
    setModalOpen(true);
  };

  const handleEdit = (svc) => {
    setEditingService(svc);
    setModalOpen(true);
  };

  if (!currentOrganizationId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">Selecciona una organización para ver los servicios.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            Servicios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Catálogo de prestaciones que ofrece {currentOrganization?.name || 'tu clínica'}.
            Estos servicios se usan al crear presupuestos y agendar citas.
          </p>
        </div>
        <Button onClick={handleOpenNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo servicio
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las especialidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las especialidades</SelectItem>
                {SPECIALTIES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {clinics.length > 1 ? (
              <Select value={selectedClinicId || ''} onValueChange={setSelectedClinicId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {clinics.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center justify-end gap-2 pr-1">
                <Label htmlFor="show-inactive" className="text-sm cursor-pointer">
                  Mostrar inactivos
                </Label>
                <Switch
                  id="show-inactive"
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
              </div>
            )}
          </div>

          {clinics.length > 1 && (
            <div className="flex items-center justify-end gap-2">
              <Label htmlFor="show-inactive-2" className="text-sm cursor-pointer">
                Mostrar inactivos
              </Label>
              <Switch
                id="show-inactive-2"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista por especialidad */}
      {loading ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Cargando servicios...</p>
          </CardContent>
        </Card>
      ) : filteredServices.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No hay servicios para mostrar</CardTitle>
            <CardDescription>
              {search || specialtyFilter !== 'all'
                ? 'Probá ajustando los filtros.'
                : 'Crea el primer servicio del catálogo con el botón "Nuevo servicio".'}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ServicesBySpecialtyList groups={groups} onEdit={handleEdit} onReload={loadServices} />
      )}

      <ServiceFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        clinicId={selectedClinicId}
        initialService={editingService}
        defaultSpecialty={specialtyFilter !== 'all' ? specialtyFilter : ''}
        onSaved={loadServices}
      />
    </div>
  );
}
