
/**
 * CalendarPage.jsx
 * Modified to include Visual Indicators for Reminders and pass selectedClinic.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import useCurrentOrganization from '@/hooks/useCurrentOrganization';
import useTherapistClinics from '@/hooks/useTherapistClinics';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, ChevronLeft, ChevronRight, RefreshCw, Search, X, Loader2, Plus } from 'lucide-react';
import { format, startOfWeek, addDays, subWeeks, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';

import WeeklyAgendaView from '@/components/calendar/WeeklyAgendaView';
import AgendaSidebar from '@/components/calendar/AgendaSidebar';
import AppointmentModal from '@/components/calendar/AppointmentModal';
import BlockTimeModal from '@/components/calendar/BlockTimeModal';
import PostSessionModal from '@/features/post-session/components/PostSessionModal';
import MotivationalPhrase from '@/components/MotivationalPhrase';

import {
  getTherapistClinics,
  getTherapistAvailability,
  getTherapistAppointments,
  getTherapistBlockedTimes,
  updateAppointment
} from '@/features/therapist/services/therapist.api';

import { getScheduledReminders } from '@/features/reminders/api/remindersApi'; 

import useDebounce from '@/hooks/useDebounce';
import logger from '@/lib/utils/logger';
import { searchPatientsForAgenda } from '@/lib/patientApi';
import { usePendingOnlineBookings } from '@/hooks/usePendingOnlineBookings';
import { CalendarClock, Check, ChevronDown, ChevronUp } from 'lucide-react';

const CalendarPage = () => {
  const { user } = useAuth();
  const { currentOrganizationId } = useCurrentOrganization();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [appointments, setAppointments] = useState([]);
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [availabilityData, setAvailabilityData] = useState([]);
  // Clínicas via hook compartido (combina owned+linked + scope por org).
  const { clinics } = useTherapistClinics({
    // calendar_* nuevas columnas (spec calendar config por sucursal)
    select: 'id, name, address, modalidad, organization_id, calendar_start_hour, calendar_end_hour, calendar_slot_minutes',
    organizationId: currentOrganizationId,
  });
  const [selectedClinic, setSelectedClinic] = useState('all');
  // null = sin box seleccionado (clinic sin boxes o no se cargó aún).
  // Cualquier otro valor = id del box, filtra el grid a sus citas.
  const [selectedBoxId, setSelectedBoxId] = useState(null);
  const [boxesForClinic, setBoxesForClinic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reminders, setReminders] = useState([]);

  // Auto-default: cada sucursal tiene su agenda independiente (decisión
  // de producto — no mezclar agendas porque cada una tiene sus propios
  // boxes y horarios). Al cargar, seleccionar la primera disponible.
  // Si el user tiene varias, puede cambiarlas con el dropdown.
  useEffect(() => {
    if (clinics.length > 0 && (selectedClinic === 'all' || !clinics.find(c => c.id === selectedClinic))) {
      setSelectedClinic(clinics[0].id);
    }
  }, [clinics, selectedClinic]);

  // Cargar boxes de la clínica seleccionada. Auto-select el primero como
  // default (cada box es una agenda independiente — la user no quiere
  // mezclar agendas de boxes distintos en una sola vista).
  useEffect(() => {
    const loadBoxes = async () => {
      if (selectedClinic === 'all' || !selectedClinic) {
        setBoxesForClinic([]);
        setSelectedBoxId(null);
        return;
      }
      const { data, error } = await supabase
        .from('clinic_boxes')
        .select('id, name, box_type')
        .eq('clinic_id', selectedClinic)
        .eq('is_active', true)
        .order('name');
      if (error) {
        logger.warn('[CalendarPage] load boxes:', error.message);
        setBoxesForClinic([]);
        setSelectedBoxId(null);
      } else {
        const list = data || [];
        setBoxesForClinic(list);
        // Auto-default al primer box. Si la clinic no tiene boxes,
        // null → no aplicar filtro (backward compat con citas legacy).
        setSelectedBoxId(list.length > 0 ? list[0].id : null);
      }
    };
    loadBoxes();
  }, [selectedClinic]);

  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedBlockedTime, setSelectedBlockedTime] = useState(null);
  const [completedAppointment, setCompletedAppointment] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Reservas online pendientes de confirmar (banner + contador).
  const { count: pendingOnlineCount, bookings: pendingOnlineBookings, refresh: refreshPendingOnline } = usePendingOnlineBookings();
  const [showPendingList, setShowPendingList] = useState(false);
  const [processingBookingId, setProcessingBookingId] = useState(null);

  // Aceptar (confirmar) o cancelar una reserva online desde el banner.
  const handleResolveOnlineBooking = async (appointmentId, newStatus) => {
    setProcessingBookingId(appointmentId);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId)
        .select('id');
      if (error) throw error;
      // UI Honesty (Constitution V): validar que el update tocó una fila
      if (!data || data.length === 0) throw new Error('No se pudo actualizar la cita.');
      toast({ title: newStatus === 'confirmed' ? '✅ Cita confirmada' : 'Cita cancelada' });
      await refreshPendingOnline();
      fetchAppointments();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setProcessingBookingId(null);
    }
  };

  // Computed: lee config del calendario desde la clinic seleccionada
  // (calendar_start_hour, calendar_end_hour, calendar_slot_minutes).
  // Si "Todas las clínicas" → toma el menor start_hour y mayor end_hour
  // entre las clinics del user para mostrar el rango más amplio posible.
  // Slot default 30 min (no se promedia entre clinics).
  const { startHour, endHour, slotMinutes } = useMemo(() => {
    if (selectedClinic !== 'all') {
      const clinic = clinics.find(c => c.id === selectedClinic);
      if (clinic) {
        return {
          startHour: clinic.calendar_start_hour ?? 8,
          endHour: clinic.calendar_end_hour ?? 20,
          slotMinutes: clinic.calendar_slot_minutes ?? 30,
        };
      }
    }
    // "Todas las clínicas": rango unión
    if (clinics.length > 0) {
      const starts = clinics.map(c => c.calendar_start_hour ?? 8);
      const ends = clinics.map(c => c.calendar_end_hour ?? 20);
      return {
        startHour: Math.min(...starts),
        endHour: Math.max(...ends),
        slotMinutes: 30, // sin promediar — usamos 30 por defecto en multi-clinic
      };
    }
    return { startHour: 8, endHour: 20, slotMinutes: 30 };
  }, [clinics, selectedClinic]);

  // Filtro por box: cada box tiene su agenda independiente (la user
  // explícitamente no quiere mezclar agendas en una sola vista).
  // Si selectedBoxId es null (clinic sin boxes), no filtrar — backward
  // compat con citas legacy sin box_id asignado.
  // Citas visibles en la grilla: ocultamos las reservas online SIN confirmar
  // (booking_source online + status scheduled). Se gestionan solo desde el
  // banner verde (Aceptar/Cancelar). Al confirmarlas (status confirmed)
  // aparecen en el grid normalmente.
  const visibleAppointments = useMemo(
    () => appointments.filter(
      (apt) => !(apt.booking_source === 'online_self_booking' && apt.status === 'scheduled')
    ),
    [appointments]
  );

  const filteredAppointments = useMemo(() => {
    if (!selectedBoxId) return visibleAppointments;
    // Incluir citas del box seleccionado + citas legacy sin box (box_id NULL).
    // Sin esto, las citas creadas antes de la asignación por box quedaban
    // invisibles en la grilla pero seguían bloqueando horarios vía el trigger
    // check_patient_double_booking → el user "no veía a nadie" pero no podía
    // agendar. Mismo criterio que filteredBlockedTimes.
    return visibleAppointments.filter((apt) => !apt.box_id || apt.box_id === selectedBoxId);
  }, [visibleAppointments, selectedBoxId]);

  // Filtrar blocked_times por box (misma lógica que appointments).
  // box_id NULL en blocked = legacy global → se muestra en todos los boxes.
  const filteredBlockedTimes = useMemo(() => {
    if (!selectedBoxId) return blockedTimes;
    return blockedTimes.filter((bt) => !bt.box_id || bt.box_id === selectedBoxId);
  }, [blockedTimes, selectedBoxId]);

  // Search Effect
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }
      setIsSearching(true);
      setShowSearchResults(true);
      try {
        if (user?.id) {
          const results = await searchPatientsForAgenda(user.id, debouncedSearch);
          setSearchResults(results);
        }
      } catch (error) {
        logger.error('Error searching patients:', error);
      } finally {
        setIsSearching(false);
      }
    };
    performSearch();
  }, [debouncedSearch, user?.id]);

  const handlePatientSelect = (patientId) => {
    navigate(`/dashboard/patients/${patientId}`);
    setSearchTerm('');
    setShowSearchResults(false);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // (clínicas ahora vienen via useTherapistClinics — ver hook en imports)

  const fetchReminders = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await getScheduledReminders(user.id);
      setReminders(data || []);
    } catch (error) {
      logger.error("Error fetching reminders", error);
    }
  }, [user]);

  const fetchAppointments = useCallback(async () => {
    if (!user) return;
    try {
      const weekStart = format(currentWeek, 'yyyy-MM-dd');
      const weekEnd = format(addDays(currentWeek, 6), 'yyyy-MM-dd');
      const data = await getTherapistAppointments(
        user.id,
        weekStart,
        weekEnd,
        selectedClinic !== 'all' ? selectedClinic : null,
        currentOrganizationId
      );
      
      // Merge appointments with reminders
      const enhancedAppointments = (data || []).map(apt => {
        const aptReminders = reminders.filter(r => r.appointment_id === apt.id);
        return {
          ...apt,
          reminders: aptReminders 
        };
      });

      setAppointments(enhancedAppointments);
    } catch (error) {
      logger.error('Error al cargar citas:', error);
    }
  }, [user, currentWeek, selectedClinic, reminders, currentOrganizationId]);

  const fetchBlockedTimes = useCallback(async () => {
    if (!user) return;
    try {
      const weekStart = format(currentWeek, 'yyyy-MM-dd');
      const weekEnd = format(addDays(currentWeek, 6), 'yyyy-MM-dd');
      const data = await getTherapistBlockedTimes(
        user.id,
        weekStart,
        weekEnd,
        selectedClinic !== 'all' ? selectedClinic : null
      );
      setBlockedTimes(data || []);
    } catch (error) {
      logger.error('Error al cargar bloqueos:', error);
    }
  }, [user, currentWeek, selectedClinic]);

  const fetchAvailability = useCallback(async () => {
    if (!user) return;
    try {
      const weekStart = format(currentWeek, 'yyyy-MM-dd');
      const data = await getTherapistAvailability(
        user.id,
        selectedClinic !== 'all' ? selectedClinic : null,
        weekStart,
        7
      );
      setAvailabilityData(data || []);
    } catch (error) {
      logger.error('Error al cargar disponibilidad:', error);
    }
  }, [user, currentWeek, selectedClinic]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await fetchReminders(); 
    await Promise.all([
      fetchAppointments(), 
      fetchBlockedTimes(),
      fetchAvailability()
    ]);
    setLoading(false);
  }, [fetchAppointments, fetchBlockedTimes, fetchAvailability, fetchReminders]);

  // (clínicas se cargan automáticamente via useTherapistClinics)

  useEffect(() => {
      if (!user) return;
      const loadData = async () => {
          setLoading(true);
          await fetchReminders();
          await fetchAppointments();
          await fetchBlockedTimes();
          await fetchAvailability();
          setLoading(false);
      };
      loadData();
  }, [user, currentWeek, selectedClinic]);

  // Re-trigger appointments fetch when reminders or week changes
  useEffect(() => {
    if(reminders.length >= 0) fetchAppointments();
    fetchBlockedTimes();
    fetchAvailability();
  }, [currentWeek, selectedClinic, reminders, fetchAppointments, fetchBlockedTimes, fetchAvailability]);

  // Handlers
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReminders(); 
    setRefreshing(false);
    toast({ title: '✅ Agenda actualizada' });
  };

  const handlePreviousWeek = () => setCurrentWeek(prev => subWeeks(prev, 1));
  const handleNextWeek = () => setCurrentWeek(prev => addWeeks(prev, 1));
  const handleToday = () => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const handleClinicChange = (clinicId) => setSelectedClinic(clinicId);
  
  const handleOpenBlockModal = () => {
    setSelectedBlockedTime(null);
    setSelectedSlot(null);
    setBlockModalOpen(true);
  };

  const handleSlotClick = (slotInfo) => {
    const slotWithClinic = {
      ...slotInfo,
      clinicId: selectedClinic !== 'all' ? selectedClinic : (clinics.length > 0 ? clinics[0].id : null)
    };
    setSelectedSlot(slotWithClinic);
    setSelectedBlockedTime(null);
    setAppointmentModalOpen(true);
  };

  // Atajo desde Acciones Rápidas: abre AppointmentModal sin slot pre-elegido,
  // user llena fecha/hora desde el form.
  const handleNewAppointment = () => {
    setSelectedSlot({
      clinicId: selectedClinic !== 'all' ? selectedClinic : (clinics.length > 0 ? clinics[0].id : null)
    });
    setSelectedBlockedTime(null);
    setAppointmentModalOpen(true);
  };

  const handleAppointmentClick = (appointment) => {
    setSelectedSlot({
      isEditing: true,
      id: appointment.id,
      date: appointment.date,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      clinicId: appointment.clinic_id,
      // patient_id es la FK directa (siempre presente). El objeto `patient`
      // es el join (puede venir null si RLS u otro filtro lo bloquea).
      patientId: appointment.patient_id,
      patient: appointment.patients || appointment.patient,
      serviceId: appointment.service_id,
      notes: appointment.notes,
      status: appointment.status
    });
    setAppointmentModalOpen(true);
  };

  const handleBlockedTimeClick = (blockedTime) => {
    setSelectedBlockedTime(blockedTime);
    setSelectedSlot(null);
    setBlockModalOpen(true);
  };

  const handleSessionCompleted = (appointment) => {
    setCompletedAppointment(appointment);
  };

  const handleAppointmentActionComplete = () => {
    fetchReminders().then(() => fetchAppointments());
    setAppointmentModalOpen(false);
    setSelectedSlot(null);
  };

  const handleBlockActionComplete = () => {
    fetchBlockedTimes();
    setBlockModalOpen(false);
    setSelectedBlockedTime(null);
    setSelectedSlot(null);
  };

  const handleAppointmentMove = async (appointmentId, newDate, newStartTime, newEndTime) => {
    try {
      const { error } = await updateAppointment(appointmentId, {
        date: newDate,
        start_time: newStartTime,
        end_time: newEndTime
      });
      if (error) throw error;
      toast({ title: '✅ Cita reprogramada' });
      fetchAppointments();
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleBlockDragCreate = (slotInfo) => {
    setSelectedBlockedTime(null);
    setSelectedSlot(slotInfo);
    setBlockModalOpen(true);
  };

  const handleBlockMove = async (blockId, newDate, newStartTime, newEndTime) => {
    try {
      const { error } = await supabase
        .from('blocked_times')
        .update({
          start_time: `${newDate}T${newStartTime}:00`,
          end_time: `${newDate}T${newEndTime}:00`,
        })
        .eq('id', blockId);
      if (error) throw error;
      toast({ title: '✅ Bloqueo movido' });
      fetchBlockedTimes();
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Cambiar estado de una cita desde la AgendaSidebar (Citas de Hoy).
  // Update optimista en `appointments` → re-deriva stats del Resumen.
  // Toast con botón "Deshacer" (8s) que revierte el cambio.
  const handleAppointmentStatusChange = useCallback(async (appointmentId, newStatus) => {
    const snapshot = appointments;
    const target = snapshot.find((a) => a.id === appointmentId);
    const previousStatus = target?.status;

    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
    );

    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', appointmentId);

    if (error) {
      setAppointments(snapshot);
      toast({
        variant: 'destructive',
        title: 'No se pudo actualizar',
        description: error.message || 'Intenta de nuevo.',
      });
      return;
    }

    const handleUndo = async () => {
      if (!previousStatus) return;
      setAppointments(snapshot);
      const { error: undoError } = await supabase
        .from('appointments')
        .update({ status: previousStatus })
        .eq('id', appointmentId);
      if (undoError) {
        toast({
          variant: 'destructive',
          title: 'No se pudo deshacer',
          description: undoError.message || 'Intenta de nuevo.',
        });
        return;
      }
      toast({ title: 'Cambio revertido' });
    };

    toast({
      title: 'Estado actualizado',
      duration: 8000,
      action: previousStatus ? (
        <ToastAction altText="Deshacer cambio de estado" onClick={handleUndo}>
          Deshacer
        </ToastAction>
      ) : undefined,
    });
  }, [appointments, toast]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <MotivationalPhrase />
        </motion.div>

        {/* Banner de reservas online pendientes de confirmar */}
        {pendingOnlineCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-green-300 bg-green-50 px-4 py-3"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-green-100 p-2 shrink-0">
                <CalendarClock className="h-5 w-5 text-green-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-green-900">
                  {pendingOnlineCount === 1
                    ? '1 paciente agendó online y está sin confirmar'
                    : `${pendingOnlineCount} pacientes agendaron online y están sin confirmar`}
                  {' '}
                  <button
                    type="button"
                    onClick={() => setShowPendingList((v) => !v)}
                    className="inline-flex items-center gap-1 text-green-700 underline underline-offset-2 hover:text-green-900 font-medium"
                  >
                    {showPendingList ? 'Ocultar' : 'Ver citas'}
                    {showPendingList ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </p>

                {/* Lista desplegable con acciones Aceptar / Cancelar */}
                {showPendingList && (
                  <div className="mt-3 space-y-2">
                    {pendingOnlineBookings.map((b) => {
                      const name = b.patient?.full_name || 'Paciente';
                      const d = b.date ? b.date.split('-').reverse().join('/') : '';
                      const h = (b.start_time || '').slice(0, 5);
                      const motivoLine = (b.notes || '').split('\n').find((l) => l.startsWith('Motivo del paciente:'));
                      const motivo = motivoLine ? motivoLine.replace('Motivo del paciente:', '').trim() : '';
                      const processing = processingBookingId === b.id;
                      return (
                        <div
                          key={b.id}
                          className="flex items-center justify-between gap-3 rounded-lg bg-white border border-green-200 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                            <p className="text-xs text-gray-500">
                              {d} · {h} hrs{motivo ? ` · ${motivo}` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                              disabled={processing}
                              onClick={() => handleResolveOnlineBooking(b.id, 'cancelled')}
                            >
                              {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 gap-1 bg-green-600 hover:bg-green-700 text-white"
                              disabled={processing}
                              onClick={() => handleResolveOnlineBooking(b.id, 'confirmed')}
                            >
                              {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                              Aceptar
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl shadow-sm p-4 mb-6">
          {/* Mobile: stack vertical (titulo / nav semana / buscador).
              Desktop (lg+): row horizontal con todo en una línea. */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Mi Agenda</h1>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="lg:hidden"
                aria-label="Actualizar agenda"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handlePreviousWeek} aria-label="Semana anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday} className="min-w-[60px] h-9 px-3">Hoy</Button>
              <div className="text-center px-2 flex-1 lg:flex-initial">
                <p className="text-xs sm:text-sm font-semibold text-gray-700 capitalize">{format(currentWeek, 'MMMM yyyy', { locale: es })}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">Semana del {format(currentWeek, 'd')} al {format(addDays(currentWeek, 6), 'd')}</p>
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handleNextWeek} aria-label="Semana siguiente">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 hidden lg:inline-flex" onClick={handleRefresh} disabled={refreshing} aria-label="Actualizar agenda">
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <Button
              size="sm"
              onClick={handleNewAppointment}
              className="w-full lg:w-auto h-9 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              Agendar Cita
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-1">
            <AgendaSidebar
              appointments={visibleAppointments}
              clinics={clinics}
              selectedClinicId={selectedClinic}
              onClinicChange={handleClinicChange}
              boxes={boxesForClinic}
              selectedBoxId={selectedBoxId}
              onBoxChange={setSelectedBoxId}
              onRefresh={handleRefresh}
              onBlockTime={handleOpenBlockModal}
              onNewAppointment={handleNewAppointment}
              onStatusChange={handleAppointmentStatusChange}
              currentWeek={currentWeek}
              onWeekChange={setCurrentWeek}
              organizationId={currentOrganizationId}
              userId={user?.id}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-4">
            <WeeklyAgendaView
              currentWeek={currentWeek}
              appointments={filteredAppointments}
              blockedTimes={filteredBlockedTimes}
              availabilityData={availabilityData}
              clinics={clinics}
              selectedClinic={selectedClinic}
              startHour={startHour}
              endHour={endHour}
              slotMinutes={slotMinutes}
              onSlotClick={handleSlotClick}
              onAppointmentClick={handleAppointmentClick}
              onBlockedTimeClick={handleBlockedTimeClick}
              onAppointmentMove={handleAppointmentMove}
              onBlockDragCreate={handleBlockDragCreate}
              onBlockMove={handleBlockMove}
              loading={loading}
            />
          </motion.div>
        </div>
      </div>

      <AppointmentModal
        isOpen={appointmentModalOpen}
        onOpenChange={setAppointmentModalOpen}
        slotInfo={selectedSlot}
        selectedClinic={selectedClinic !== 'all' ? selectedClinic : null}
        selectedBoxId={selectedBoxId}
        clinics={clinics}
        onAppointmentCreated={handleAppointmentActionComplete}
        onAppointmentUpdated={handleAppointmentActionComplete}
        onSessionCompleted={handleSessionCompleted}
      />

      <PostSessionModal
        isOpen={!!completedAppointment}
        onClose={() => {
          setCompletedAppointment(null);
          fetchAppointments();
        }}
        appointment={completedAppointment}
        therapistId={user?.id}
      />

      <BlockTimeModal
        isOpen={blockModalOpen}
        onOpenChange={setBlockModalOpen}
        clinics={clinics}
        selectedClinic={selectedClinic}
        selectedBoxId={selectedBoxId}
        blockedTime={selectedBlockedTime}
        slotInfo={selectedSlot}
        onSuccess={handleBlockActionComplete}
      />
    </div>
  );
};

export default CalendarPage;
