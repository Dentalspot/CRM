/**
 * @file src/pages/clinic/ClinicPatientsPage.jsx
 *
 * Listado de pacientes de la clínica (vista admin-level).
 * Spec: `clinic-dashboard-sections-expansion` Phase B2.
 *
 * Scope:
 * - Query scoped por organization_id (RLS pat_admin_* enforces que el
 *   clinic_admin solo ve pacientes de su org).
 * - Columnas admin-level: nombre, contacto (email, phone), dentista
 *   asignado, última cita, acciones (agendar cita — stub por ahora).
 * - Búsqueda por nombre/email
 * - Filtro por dentista asignado
 *
 * NO incluye (Ley 20.584 art. 12 — RLS lo bloquea automáticamente):
 * - Ficha clínica detallada (historial, tratamientos, evoluciones)
 * - Odontograma, radiografías, notas clínicas
 * - Diagnósticos
 *
 * Click en paciente → por ahora no abre ficha detallada. Queda como
 * follow-up: crear vista `ClinicPatientDetailModal` admin-level con
 * contacto + historial de citas (sin clinical_history).
 *
 * Fuera de scope MVP (backlog):
 * - Integrar NewAppointmentForm real para agendar desde este listado
 *   (requiere adaptar form para aceptar dentist seleccionable por admin)
 * - Edición inline de contacto (email, phone)
 * - CSV export/import
 * - Vista admin-level de detalle de paciente (modal con citas)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Search,
  CalendarPlus,
  Phone,
  Mail,
  Loader2,
  RefreshCw,
  Plus,
  Shield,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger from '@/lib/utils/logger';
import ClinicPatientCreateModal from './ClinicPatientCreateModal';
import { useDentistList } from '@/features/patients/hooks/useDentistList';

const ClinicPatientsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [clinic, setClinic] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDentist, setSelectedDentist] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);

  // Hook compartido — misma fuente de verdad que PatientModal y
  // AssistantPatientDialog. Lista dentistas activos de la org via
  // clinic_therapists + fallback dentista solo si data drift.
  const { dentists } = useDentistList({
    organizationId: clinic?.organization_id,
    currentUserId: user?.id,
  });

  const fetchData = useCallback(async () => {
    try {
      if (!user) return;
      setRefreshing(true);

      // 1. Clinic + organization_id
      const { data: myClinic, error: clinicErr } = await supabase
        .from('clinics')
        .select('id, name, organization_id')
        .eq('therapist_id', user.id)
        .maybeSingle();

      if (clinicErr) throw clinicErr;
      if (!myClinic) {
        setClinic(null);
        return;
      }
      setClinic(myClinic);

      // Dentistas activos los carga el hook useDentistList — fuente única
      // compartida con PatientModal/AssistantPatientDialog/ClinicPatientCreateModal.

      // Pacientes de la org (RLS pat_admin_select enforces)
      // Hacemos 3 queries y mergeamos en JS — evita problemas de FK ambigua en embeds
      const { data: patRows, error: patErr } = await supabase
        .from('patients')
        .select('id, profile_id, therapist_id, status, last_appointment_date, created_at, full_name, email, phone, rut')
        .eq('organization_id', myClinic.organization_id)
        .order('created_at', { ascending: false });

      if (patErr) throw patErr;

      const patientList = patRows || [];

      // Resolver datos personales de pacientes y dentistas
      const profileIds = new Set();
      patientList.forEach(p => {
        if (p.profile_id) profileIds.add(p.profile_id);
        if (p.therapist_id) profileIds.add(p.therapist_id);
      });

      let profilesById = {};
      if (profileIds.size > 0) {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone')
          .in('id', Array.from(profileIds));
        profilesById = (profileRows || []).reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
      }

      // Fallback al campo denormalizado en `patients` cuando no hay profile.
      const enriched = patientList.map(p => ({
        ...p,
        full_name: profilesById[p.profile_id]?.full_name || p.full_name || '—',
        email: profilesById[p.profile_id]?.email || p.email || '',
        phone: profilesById[p.profile_id]?.phone || p.phone || '',
        rut: p.rut || '',
        therapist: p.therapist_id ? profilesById[p.therapist_id] || null : null,
      }));

      setPatients(enriched);
    } catch (err) {
      logger.error('ClinicPatientsPage fetch error:', err);
      toast({
        variant: 'destructive',
        title: 'Error al cargar pacientes',
        description: err.message || 'Inténtalo de nuevo.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtrado client-side
  const filteredPatients = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return patients.filter(p => {
      const matchesSearch = !term
        || p.full_name?.toLowerCase().includes(term)
        || p.email?.toLowerCase().includes(term);
      const matchesDentist = selectedDentist === 'all'
        || p.therapist_id === selectedDentist;
      return matchesSearch && matchesDentist;
    });
  }, [patients, searchTerm, selectedDentist]);

  if (loading && !refreshing) {
    return (
      <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800">No se encontró una clínica asociada</h2>
        <p className="text-gray-500 mt-2">Primero tenés que registrar tu clínica.</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Pacientes | DentalSpot</title>
      </Helmet>

      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Pacientes</h1>
            <p className="text-muted-foreground mt-1">
              Gestión administrativa · <strong>{clinic.name}</strong> ·{' '}
              <span className="text-sm">{patients.length} paciente{patients.length !== 1 ? 's' : ''}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData} disabled={refreshing} title="Refrescar">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={() => {
                if (dentists.length === 0) {
                  toast({
                    variant: 'destructive',
                    title: 'Sin dentistas activos',
                    description: 'Invita primero un dentista a la clínica para poder asignarle pacientes.',
                  });
                  return;
                }
                setCreateOpen(true);
              }}
              className="bg-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo paciente
            </Button>
          </div>
        </div>

        {/* Nota legal admin-level */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <Shield className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            Vista admin-level. Podés gestionar contacto y citas, pero las fichas clínicas detalladas son accesibles solo por el dentista tratante (Ley 20.584 art. 12).
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="w-full md:w-72">
                <Select value={selectedDentist} onValueChange={setSelectedDentist}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por dentista" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los dentistas</SelectItem>
                    {dentists.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.full_name || d.email}
                      </SelectItem>
                    ))}
                    <SelectItem value="__none__">Sin dentista asignado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead className="hidden md:table-cell">Contacto</TableHead>
                    <TableHead className="hidden lg:table-cell">Dentista asignado</TableHead>
                    <TableHead className="hidden lg:table-cell">Última cita</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        {patients.length === 0
                          ? 'Aún no hay pacientes en la clínica.'
                          : 'No se encontraron pacientes con los filtros aplicados.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPatients.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
                              <Users className="h-4 w-4 text-slate-400" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold">{p.full_name || 'Sin Nombre'}</div>
                              <div className="text-xs text-muted-foreground md:hidden">{p.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-sm space-y-0.5">
                            {p.email && (
                              <div className="flex items-center gap-1 text-gray-700">
                                <Mail className="h-3 w-3 text-gray-400" /> {p.email}
                              </div>
                            )}
                            {p.phone && (
                              <div className="flex items-center gap-1 text-gray-500 text-xs">
                                <Phone className="h-3 w-3 text-gray-400" /> {p.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-gray-600">
                          {p.therapist?.full_name || <span className="italic text-gray-400">Sin asignar</span>}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-gray-600">
                          {p.last_appointment_date
                            ? format(new Date(p.last_appointment_date), "d MMM yyyy", { locale: es })
                            : <span className="italic text-gray-400">—</span>}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              p.status === 'active'
                                ? 'bg-green-100 text-green-700 border-0'
                                : 'bg-gray-100 text-gray-700 border-0'
                            }
                          >
                            {p.status === 'active' ? 'Activo' : (p.status || 'Inactivo')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toast({
                              title: 'Agendar cita — próximamente',
                              description: 'La integración con el formulario de citas llega en la próxima iteración.',
                            })}
                          >
                            <CalendarPlus className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Agendar</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <ClinicPatientCreateModal
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        organizationId={clinic?.organization_id}
        dentists={dentists}
        onCreated={fetchData}
      />
    </>
  );
};

export default ClinicPatientsPage;
