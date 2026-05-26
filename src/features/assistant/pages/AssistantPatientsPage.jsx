import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Plus, Search, Pencil, Phone, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import useCurrentOrganization from '@/hooks/useCurrentOrganization';
import useDebounce from '@/hooks/useDebounce';
import AssistantPatientDialog from '../components/AssistantPatientDialog';

const PREVISION_LABELS = {
  privado: 'Privado',
  fonasa: 'Fonasa',
  convenio: 'Convenio',
};

const AssistantPatientsPage = () => {
  const { currentOrganizationId, currentOrganization, organizations, loading: orgLoading } = useCurrentOrganization();
  const { signOut } = useAuth();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const fetchPatients = useCallback(async () => {
    if (!currentOrganizationId) return;
    setLoading(true);

    let query = supabase
      .from('patients_admin_view')
      .select('id, full_name, rut, phone, email, patient_type, status, address, emergency_contact_name, emergency_contact_phone, created_at')
      .eq('organization_id', currentOrganizationId)
      .eq('status', 'active')
      .order('full_name');

    if (debouncedSearch) {
      query = query.or(
        `full_name.ilike.%${debouncedSearch}%,rut.ilike.%${debouncedSearch}%,phone.ilike.%${debouncedSearch}%`
      );
    }

    const { data } = await query;
    setPatients(data || []);
    setLoading(false);
  }, [currentOrganizationId, debouncedSearch]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const handleCreate = () => {
    setSelectedPatient(null);
    setDialogOpen(true);
  };

  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setDialogOpen(true);
  };

  // Guard
  if (orgLoading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;
  }

  if (!currentOrganizationId) {
    // Distinguir dos casos (alineado con AssistantDashboard):
    //  - hasNoOrgs: asistente sin vínculo activo (revocado o nunca aceptó
    //    invitación). El selector está vacío → guiar a contactar admin o
    //    cerrar sesión.
    //  - tiene orgs pero no eligió: caso normal multi-org → usar selector.
    const hasNoOrgs = (organizations?.length || 0) === 0;
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        {hasNoOrgs ? (
          <>
            <h2 className="text-xl font-semibold mb-2">Todavía no estás vinculado a una clínica</h2>
            <p className="text-muted-foreground max-w-md mb-4">
              Para gestionar pacientes necesitas pertenecer a una clínica. Si recibiste
              una invitación por email, abre el enlace para aceptarla. Si crees que es
              un error o tu acceso fue dado de baja, contacta al administrador.
            </p>
            <Button variant="outline" onClick={() => signOut()}>Cerrar sesión</Button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-2">Selecciona una organización</h2>
            <p className="text-muted-foreground max-w-md">
              Usa el selector en el menú superior para ver pacientes de la clínica.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Pacientes | {currentOrganization?.name || 'DentalSpot'}</title>
      </Helmet>

      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold">Pacientes</h1>
            <p className="text-muted-foreground text-sm">{currentOrganization?.name} — Datos administrativos</p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Nuevo paciente
          </Button>
        </div>

        {/* Búsqueda */}
        <Card>
          <CardContent className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, RUT o teléfono..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              {loading ? '...' : `${patients.length} pacientes`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>
            ) : patients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {debouncedSearch ? 'Sin resultados para esta búsqueda' : 'No hay pacientes registrados'}
              </p>
            ) : (
              <div className="space-y-2">
                {patients.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.full_name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        {p.rut && <span>{p.rut}</span>}
                        {p.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{p.phone}</span>}
                        {p.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{p.email}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.patient_type && (
                        <Badge variant="outline" className="text-[10px]">
                          {PREVISION_LABELS[p.patient_type] || p.patient_type}
                        </Badge>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar" onClick={() => handleEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AssistantPatientDialog
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        patient={selectedPatient}
        organizationId={currentOrganizationId}
        onSaved={fetchPatients}
      />
    </>
  );
};

export default AssistantPatientsPage;
