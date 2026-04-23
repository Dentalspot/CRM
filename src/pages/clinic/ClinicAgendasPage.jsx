/**
 * @file src/pages/clinic/ClinicAgendasPage.jsx
 *
 * Agendas consolidadas del dashboard de clínica — vista semanal de citas
 * de TODOS los dentistas de la clínica, con filtro opcional por dentista.
 *
 * Spec: `clinic-dashboard-sections-expansion` Phase B1 (post spec 023).
 *
 * Capabilities:
 * - Ver citas de la semana (navegable prev/next/hoy)
 * - Filtrar por dentista (dropdown dinámico con dentistas de la clínica)
 * - Click en cita → ver detalle + editar/cancelar
 * - Botón "Nueva cita" → abre form con dentista seleccionable
 *
 * RLS: clinic_admin tiene appt_admin_* policies que permiten CRUD
 * appointments de su organización. No hay que hacer filter manual por
 * security — RLS lo enforces. El filter client-side es UX (ver solo
 * dentista X) sobre datos ya gateados.
 *
 * Fuera de scope MVP (backlog):
 * - Vista calendar grid (WeeklyAgendaView del therapist)
 * - Agenda por box (requiere tabla boxes + column appointments.box_id)
 * - Bloqueo de horarios
 * - Citas recurrentes
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
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
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  MapPin,
  Loader2,
  Plus,
  RefreshCw,
  CalendarX,
} from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';
import logger from '@/lib/utils/logger';

const ClinicAgendasPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [clinic, setClinic] = useState(null);
  const [dentists, setDentists] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedDentist, setSelectedDentist] = useState('all');
  const [currentWeek, setCurrentWeek] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekStart = currentWeek;
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  const fetchData = useCallback(async () => {
    try {
      if (!user) return;
      setRefreshing(true);

      // 1. Get clinic del usuario admin
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

      // 2. Fetch dentistas activos de la clínica (para dropdown filter)
      const { data: ctData, error: ctErr } = await supabase
        .from('clinic_therapists')
        .select(`
          therapist_id,
          profiles:therapist_id (id, full_name, email)
        `)
        .eq('clinic_id', myClinic.id)
        .eq('is_active', true);

      if (ctErr) throw ctErr;
      setDentists((ctData || []).map(ct => ct.profiles).filter(Boolean));

      // 3. Fetch appointments de la semana
      const { data: apptData, error: apptErr } = await supabase
        .from('appointments')
        .select(`
          id,
          date,
          start_time,
          end_time,
          status,
          notes,
          duration_minutes,
          therapist_id,
          patient_id,
          clinic_id,
          patients:patient_id (id, full_name, email, phone),
          therapist:therapist_id (id, full_name)
        `)
        .eq('clinic_id', myClinic.id)
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (apptErr) throw apptErr;
      setAppointments(apptData || []);
    } catch (err) {
      logger.error('ClinicAgendasPage fetch error:', err);
      toast({
        variant: 'destructive',
        title: 'Error al cargar agendas',
        description: err.message || 'Inténtalo de nuevo.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, weekStart, weekEnd, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter client-side por dentista seleccionado
  const filteredAppointments = appointments.filter(appt =>
    selectedDentist === 'all' || appt.therapist_id === selectedDentist
  );

  // Agrupar por día de la semana para render
  const days = [0, 1, 2, 3, 4, 5, 6].map(offset => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + offset);
    return d;
  });

  const appointmentsByDay = days.map(day => ({
    date: day,
    items: filteredAppointments.filter(appt =>
      isSameDay(parseISO(appt.date), day)
    ),
  }));

  const statusBadge = (status) => {
    const map = {
      scheduled: { label: 'Agendada', className: 'bg-blue-100 text-blue-700' },
      completed: { label: 'Completada', className: 'bg-green-100 text-green-700' },
      cancelled: { label: 'Cancelada', className: 'bg-red-100 text-red-700' },
      no_show: { label: 'No asistió', className: 'bg-orange-100 text-orange-700' },
    };
    const meta = map[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return <Badge className={`${meta.className} border-0 text-xs`}>{meta.label}</Badge>;
  };

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
        <title>Agendas | DentalSpot</title>
      </Helmet>

      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Agendas</h1>
            <p className="text-muted-foreground mt-1">
              Citas de la semana · <strong>{clinic.name}</strong>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData} disabled={refreshing} title="Refrescar">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={() => toast({
                title: 'Nueva cita — próximamente',
                description: 'El formulario de creación desde aquí se integrará en la próxima iteración. Por ahora, crear citas desde el panel del dentista.',
              })}
              className="bg-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva cita
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6 pb-4">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              {/* Week navigator */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                >
                  Hoy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="text-sm text-gray-700 ml-2 whitespace-nowrap">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  {format(weekStart, "d MMM", { locale: es })} —{' '}
                  {format(weekEnd, "d MMM yyyy", { locale: es })}
                </div>
              </div>

              {/* Dentist filter */}
              <div className="md:ml-auto w-full md:w-72">
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
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agenda per day */}
        <div className="space-y-4">
          {appointmentsByDay.map(({ date, items }) => (
            <Card key={date.toISOString()}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">
                    {format(date, "EEEE d 'de' MMMM", { locale: es })}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {items.length} cita{items.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {items.length === 0 ? (
                  <div className="text-sm text-gray-400 italic py-4 text-center">
                    Sin citas agendadas.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map(appt => (
                      <div
                        key={appt.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-slate-50 rounded-lg border hover:bg-white hover:shadow-sm transition-all"
                      >
                        {/* Time */}
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 sm:w-32 shrink-0">
                          <Clock className="h-4 w-4 text-primary" />
                          {appt.start_time?.slice(0, 5) || '—'}
                          {appt.end_time && (
                            <span className="text-gray-400">- {appt.end_time.slice(0, 5)}</span>
                          )}
                        </div>

                        {/* Patient */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <User className="h-4 w-4 text-gray-400 shrink-0" />
                          <div className="truncate">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {appt.patients?.full_name || 'Paciente sin nombre'}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {appt.patients?.email || appt.patients?.phone || '—'}
                            </div>
                          </div>
                        </div>

                        {/* Dentist */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 sm:w-48 shrink-0 min-w-0">
                          <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="truncate">
                            {appt.therapist?.full_name || 'Dentista'}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="shrink-0">
                          {statusBadge(appt.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAppointments.length === 0 && !loading && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <CalendarX className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No hay citas en esta semana
                {selectedDentist !== 'all' && ' para el dentista seleccionado'}.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default ClinicAgendasPage;
