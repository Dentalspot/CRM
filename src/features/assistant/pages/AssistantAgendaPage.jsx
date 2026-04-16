import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Plus, ChevronLeft, ChevronRight, DollarSign, X, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';
import useCurrentOrganization from '@/hooks/useCurrentOrganization';
import AssistantNewAppointmentDialog from '../components/AssistantNewAppointmentDialog';
import RegisterPaymentDialog from '../components/RegisterPaymentDialog';

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

// Estados donde se permite registrar pago
const PAYABLE_STATUSES = ['confirmed', 'completed'];

const AssistantAgendaPage = () => {
  const { currentOrganizationId, currentOrganization, loading: orgLoading } = useCurrentOrganization();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dentistFilter, setDentistFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dentists, setDentists] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [paidAppointments, setPaidAppointments] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [newAppointmentOpen, setNewAppointmentOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Cargar dentistas de la org
  useEffect(() => {
    if (!currentOrganizationId) return;
    supabase.from('organization_members')
      .select('user_id, profiles(full_name)')
      .eq('organization_id', currentOrganizationId)
      .eq('role', 'dentist')
      .eq('is_active', true)
      .then(({ data }) => {
        setDentists((data || []).map(d => ({ id: d.user_id, name: d.profiles?.full_name || 'Sin nombre' })));
      });
  }, [currentOrganizationId]);

  // Cargar citas del día
  const fetchAppointments = useCallback(async () => {
    if (!currentOrganizationId) return;
    setLoading(true);

    let query = supabase.from('appointments')
      .select(`
        id, date, start_time, end_time, status, notes, therapist_id,
        patient:patients!appointments_patient_id_fkey(
          id, profile:profiles!patients_profile_id_fkey(full_name, phone)
        ),
        dentist:profiles!appointments_therapist_id_fkey(full_name)
      `)
      .eq('organization_id', currentOrganizationId)
      .eq('date', selectedDate)
      .order('start_time');

    if (dentistFilter !== 'all') {
      query = query.eq('therapist_id', dentistFilter);
    }

    const { data } = await query;
    let filtered = data || [];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    setAppointments(filtered);

    // Verificar cuáles ya tienen pago
    if (filtered.length > 0) {
      const ids = filtered.map(a => a.id);
      const { data: payments } = await supabase
        .from('patient_payments')
        .select('appointment_id')
        .in('appointment_id', ids);
      setPaidAppointments(new Set((payments || []).map(p => p.appointment_id)));
    } else {
      setPaidAppointments(new Set());
    }

    setLoading(false);
  }, [currentOrganizationId, selectedDate, dentistFilter, statusFilter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Acciones sobre citas
  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', appointmentId);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: `Cita ${STATUS_LABELS[newStatus]?.toLowerCase() || 'actualizada'}` });
      fetchAppointments();
    }
  };

  const handleOpenPayment = (appointment) => {
    setSelectedAppointment(appointment);
    setPaymentDialogOpen(true);
  };

  // Guard: sin org
  if (orgLoading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;
  }

  if (!currentOrganizationId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Selecciona una organización</h2>
        <p className="text-muted-foreground">Usa el selector en el menú superior para ver la agenda.</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Agenda | {currentOrganization?.name || 'DentalSpot'}</title>
      </Helmet>

      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold">Agenda</h1>
            <p className="text-muted-foreground text-sm">{currentOrganization?.name}</p>
          </div>
          <Button onClick={() => setNewAppointmentOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Agendar cita
          </Button>
        </div>

        {/* Filtros + navegación de fecha */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setSelectedDate(format(subDays(new Date(selectedDate + 'T12:00:00'), 1), 'yyyy-MM-dd'))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-auto"
                />
                <Button variant="outline" size="icon" onClick={() => setSelectedDate(format(addDays(new Date(selectedDate + 'T12:00:00'), 1), 'yyyy-MM-dd'))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}>
                  Hoy
                </Button>
              </div>

              <div className="flex gap-2 flex-1 justify-end">
                <Select value={dentistFilter} onValueChange={setDentistFilter}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Dentista" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los dentistas</SelectItem>
                    {dentists.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="scheduled">Agendadas</SelectItem>
                    <SelectItem value="confirmed">Confirmadas</SelectItem>
                    <SelectItem value="completed">Completadas</SelectItem>
                    <SelectItem value="cancelled">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de citas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(new Date(selectedDate + 'T12:00:00'), "EEEE d 'de' MMMM, yyyy", { locale: es })}
              <Badge variant="secondary" className="ml-2">{appointments.length} citas</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>
            ) : appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No hay citas para este día</p>
            ) : (
              <div className="space-y-2">
                {appointments.map(apt => {
                  const canPay = PAYABLE_STATUSES.includes(apt.status) && !paidAppointments.has(apt.id);
                  const isPaid = paidAppointments.has(apt.id);

                  return (
                    <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="text-sm font-mono text-muted-foreground w-12 shrink-0">
                          {apt.start_time?.slice(0, 5)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {apt.patient?.profile?.full_name || 'Sin paciente'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            Dr. {apt.dentist?.full_name || '—'}
                            {apt.patient?.profile?.phone ? ` · ${apt.patient.profile.phone}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isPaid && (
                          <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Pagado</Badge>
                        )}
                        <Badge className={`text-[10px] ${STATUS_COLORS[apt.status] || 'bg-gray-100'}`}>
                          {STATUS_LABELS[apt.status] || apt.status}
                        </Badge>

                        {/* Acciones según estado */}
                        {apt.status === 'scheduled' && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Confirmar"
                            onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}>
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                        )}
                        {(apt.status === 'scheduled' || apt.status === 'confirmed') && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Cancelar"
                            onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}>
                            <X className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        )}
                        {canPay && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Registrar pago"
                            onClick={() => handleOpenPayment(apt)}>
                            <DollarSign className="h-3.5 w-3.5 text-amber-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AssistantNewAppointmentDialog
        isOpen={newAppointmentOpen}
        onOpenChange={setNewAppointmentOpen}
        selectedDate={selectedDate}
        onCreated={fetchAppointments}
      />

      {selectedAppointment && (
        <RegisterPaymentDialog
          isOpen={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          appointment={selectedAppointment}
          organizationId={currentOrganizationId}
          onRegistered={fetchAppointments}
        />
      )}
    </>
  );
};

export default AssistantAgendaPage;
