import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Users, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import useCurrentOrganization from '@/hooks/useCurrentOrganization';
import { useNavigate } from 'react-router-dom';

const AssistantDashboard = () => {
  const { currentOrganizationId, currentOrganization, organizations = [], loading: orgLoading } = useCurrentOrganization();
  const navigate = useNavigate();

  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (!currentOrganizationId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      const [appointmentsRes, patientsRes, completedRes] = await Promise.all([
        // Citas del día de toda la org
        supabase
          .from('appointments')
          .select(`
            id, date, start_time, end_time, status,
            patient:patients!appointments_patient_id_fkey(
              id, profile:profiles!patients_profile_id_fkey(full_name)
            ),
            dentist:profiles!appointments_therapist_id_fkey(full_name)
          `)
          .eq('organization_id', currentOrganizationId)
          .eq('date', today)
          .order('start_time', { ascending: true }),

        // Pacientes recientes (via patients_admin_view)
        supabase
          .from('patients_admin_view')
          .select('id, full_name, phone, email, created_at')
          .eq('organization_id', currentOrganizationId)
          .order('created_at', { ascending: false })
          .limit(5),

        // Citas completadas recientes sin pago (últimos 30 días)
        supabase
          .from('appointments')
          .select(`
            id, date,
            patient:patients!appointments_patient_id_fkey(
              id, profile:profiles!patients_profile_id_fkey(full_name)
            )
          `)
          .eq('organization_id', currentOrganizationId)
          .eq('status', 'completed')
          .gte('date', format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'))
          .order('date', { ascending: false }),
      ]);

      setTodayAppointments(appointmentsRes.data || []);
      setRecentPatients(patientsRes.data || []);

      // Cruzar con pagos para detectar pendientes
      if (completedRes.data?.length > 0) {
        const completedIds = completedRes.data.map(a => a.id);
        const { data: paidAppts } = await supabase
          .from('patient_payments')
          .select('appointment_id')
          .in('appointment_id', completedIds);

        const paidSet = new Set((paidAppts || []).map(p => p.appointment_id));
        setPendingPayments(completedRes.data.filter(a => !paidSet.has(a.id)).slice(0, 5));
      } else {
        setPendingPayments([]);
      }

      setLoading(false);
    };

    fetchData();
  }, [currentOrganizationId, today]);

  // Guard: sin organización seleccionada
  if (orgLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!currentOrganizationId) {
    // Distinguir dos casos:
    //  - Tiene orgs pero no eligió una → guiar al selector (caso normal multi-org)
    //  - No tiene NINGUNA org → asistente sin vínculo activo (nunca aceptó
    //    invitación, o fue revocado). El selector está vacío, así que el
    //    mensaje "usa el selector" sería un dead-end confuso.
    const hasNoOrgs = (organizations?.length || 0) === 0;
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        {hasNoOrgs ? (
          <>
            <h2 className="text-xl font-semibold mb-2">Todavía no estás vinculado a una clínica</h2>
            <p className="text-muted-foreground max-w-md">
              Para trabajar como asistente necesitas una invitación de la clínica.
              Si ya la recibiste por email, abre el enlace para aceptarla. Si crees
              que es un error o tu acceso fue dado de baja, contacta al administrador
              de la clínica.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-2">Selecciona una organización</h2>
            <p className="text-muted-foreground max-w-md">
              Usa el selector en el menú superior para elegir la clínica donde trabajas hoy.
            </p>
          </>
        )}
      </div>
    );
  }

  const STATUS_LABELS = {
    scheduled: 'Agendada',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada',
    'no-show': 'No asistió',
  };

  const STATUS_COLORS = {
    scheduled: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-700',
    'no-show': 'bg-amber-100 text-amber-700',
  };

  return (
    <>
      <Helmet>
        <title>Panel de Recepción | {currentOrganization?.name || 'DentalSpot'}</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Panel de Recepción</h1>
          <p className="text-muted-foreground">
            {currentOrganization?.name} — {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? '...' : todayAppointments.length}</p>
                <p className="text-sm text-muted-foreground">Citas hoy</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? '...' : pendingPayments.length}</p>
                <p className="text-sm text-muted-foreground">Cobros pendientes</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? '...' : recentPatients.length}</p>
                <p className="text-sm text-muted-foreground">Pacientes recientes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Citas del día */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Agenda de hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : todayAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No hay citas para hoy</p>
              ) : (
                <div className="space-y-2">
                  {todayAppointments.map(apt => (
                    <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="text-sm font-mono text-muted-foreground w-12 shrink-0">
                          {apt.start_time?.slice(0, 5)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {apt.patient?.profile?.full_name || 'Sin paciente'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            Dr. {apt.dentist?.full_name || '—'}
                          </p>
                        </div>
                      </div>
                      <Badge className={`text-[10px] ${STATUS_COLORS[apt.status] || 'bg-gray-100'}`}>
                        {STATUS_LABELS[apt.status] || apt.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cobros pendientes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Cobros pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              ) : pendingPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sin cobros pendientes</p>
              ) : (
                <div className="space-y-2">
                  {pendingPayments.map(apt => (
                    <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <div>
                        <p className="text-sm font-medium">
                          {apt.patient?.profile?.full_name || 'Paciente'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Cita del {format(new Date(apt.date), 'd MMM', { locale: es })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-amber-700 border-amber-300">
                        Pendiente
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pacientes recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pacientes recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-20" />
            ) : recentPatients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin pacientes registrados</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentPatients.map(p => (
                  <div key={p.id} className="p-3 rounded-lg border bg-slate-50">
                    <p className="text-sm font-medium">{p.full_name || 'Sin nombre'}</p>
                    <p className="text-xs text-muted-foreground">{p.phone || p.email || 'Sin contacto'}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AssistantDashboard;
