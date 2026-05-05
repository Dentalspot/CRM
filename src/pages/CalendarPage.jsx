
/**
 * CalendarPage.jsx
 * Modified to include Visual Indicators for Reminders and pass selectedClinic.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import useCurrentOrganization from '@/hooks/useCurrentOrganization';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, ChevronLeft, ChevronRight, RefreshCw, Search, X, Loader2 } from 'lucide-react';
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
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reminders, setReminders] = useState([]); 

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

  // Computed
  const { startHour, endHour } = useMemo(() => {
    let min = 8;
    let max = 20;
    if (selectedClinic !== 'all') {
      const clinic = clinics.find(c => c.id === selectedClinic);
      if (clinic?.business_hours) {
        // ... (existing logic)
      }
    }
    return { startHour: min, endHour: max };
  }, [clinics, selectedClinic]);

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

  // Data Fetching
  // Scopear las clínicas a la org seleccionada en el header (Cristobal multi-org).
  // Sin esto, en Mi Agenda aparecen clínicas de Igeldo cuando estás en Álamos.
  const fetchClinics = useCallback(async () => {
    if (!user) return;
    try {
      const [ownedRes, linkedRes] = await Promise.all([
        supabase
          .from('clinics')
          .select('id, name, address, modalidad, organization_id')
          .eq('therapist_id', user.id),
        supabase
          .from('clinic_therapists')
          .select('clinic:clinics(id, name, address, modalidad, organization_id)')
          .eq('therapist_id', user.id)
          .eq('is_active', true),
      ]);

      const owned = ownedRes.data || [];
      const linked = (linkedRes.data || []).map(r => r.clinic).filter(Boolean);
      const all = [...owned, ...linked];
      const unique = Array.from(new Map(all.map(c => [c.id, c])).values());
      const scoped = currentOrganizationId
        ? unique.filter(c => c.organization_id === currentOrganizationId)
        : unique;
      setClinics(scoped);
    } catch (err) {
      logger.warn('fetchClinics error:', err?.message);
      setClinics([]);
    }
  }, [user, currentOrganizationId]);

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

  useEffect(() => {
      fetchClinics();
  }, [fetchClinics]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <MotivationalPhrase />
        </motion.div>

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

            <div className="relative w-full lg:w-[250px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-8 bg-white"
                onFocus={() => { if (searchTerm.length >= 2) setShowSearchResults(true); }}
              />
              {searchTerm && (
                <button onClick={handleClearSearch} className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              )}
              {showSearchResults && (
                <Card className="absolute top-full left-0 right-0 mt-1 shadow-lg max-h-60 overflow-auto z-50 border-gray-200">
                  <CardContent className="p-1">
                    {isSearching ? (
                      <div className="flex items-center justify-center p-4 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" /><span className="text-sm">Buscando...</span></div>
                    ) : searchResults.length > 0 ? (
                      <ul className="space-y-0.5">
                        {searchResults.map((patient) => (
                          <li key={patient.id}>
                            <button onClick={() => handlePatientSelect(patient.id)} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded-md transition-colors flex flex-col gap-0.5">
                              <span className="font-medium text-slate-700">{patient.full_name}</span>
                              <span className="text-xs text-muted-foreground truncate">{patient.email}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-3 text-center text-sm text-muted-foreground">No se encontraron pacientes</div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-1">
            <AgendaSidebar
              appointments={appointments}
              clinics={clinics}
              selectedClinicId={selectedClinic}
              onClinicChange={handleClinicChange}
              onRefresh={handleRefresh}
              onBlockTime={handleOpenBlockModal}
              onNewAppointment={handleNewAppointment}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-3">
            <WeeklyAgendaView
              currentWeek={currentWeek}
              appointments={appointments}
              blockedTimes={blockedTimes}
              availabilityData={availabilityData}
              clinics={clinics}
              selectedClinic={selectedClinic}
              startHour={startHour}
              endHour={endHour}
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
        blockedTime={selectedBlockedTime}
        slotInfo={selectedSlot}
        onSuccess={handleBlockActionComplete}
      />
    </div>
  );
};

export default CalendarPage;
