/**
 * @file src/components/calendar/OrgCalendarView.jsx
 *
 * Vista de calendario rich scopeada por organización. Reutilizable por
 * asistente (spec 024) y clinic_admin (spec 025 futuro).
 *
 * Props:
 * - `scope`: 'assistant' | 'clinic_admin' — controla detalles menores de UI
 * - `organizationId`: uuid de la org actual
 *
 * Responsabilidades:
 * - Fetch de dentistas, citas, bloqueos, disponibilidad
 * - Selector de dentista + filtros + navegación semanal
 * - Render de WeeklyAgendaView (reusa componente del dentista sin modificar)
 * - Handlers para click/drag/resize de citas y bloqueos
 * - Audit log vía useClinicalAccessLogger cuando toca data de paciente ajeno
 *
 * Ver spec: specs/024-assistant-rich-calendar/
 * Ver plan: specs/024-assistant-rich-calendar/plan.md
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { startOfWeek, addDays, subWeeks, addWeeks, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertCircle, Loader2, Ban } from 'lucide-react';

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
import { useToast } from '@/components/ui/use-toast';

import WeeklyAgendaView from '@/components/calendar/WeeklyAgendaView';
import AssistantAppointmentModal from '@/components/calendar/assistant/AssistantAppointmentModal';

import {
  getOrgDentists,
  getOrgClinics,
  getOrgAppointments,
  getOrgBlockedTimes,
  getOrgAvailability,
  createOrgBlockedTime,
  deleteOrgBlockedTime,
  updateOrgAppointment,
} from '@/lib/api/org.api';
import { logClinicalAccess } from '@/lib/audit/clinicalAuditLogger';
import { useAuth } from '@/contexts/AuthContext';

import logger from '@/lib/utils/logger';

const OrgCalendarView = ({ scope = 'assistant', organizationId }) => {
  const { toast } = useToast();
  const { user } = useAuth();

  // State: selección y navegación
  const [dentists, setDentists] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [selectedDentistId, setSelectedDentistId] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [statusFilter, setStatusFilter] = useState('all');
  const [mode, setMode] = useState('create'); // 'create' | 'block'

  // State: data de agenda
  const [appointments, setAppointments] = useState([]);
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [availabilityData, setAvailabilityData] = useState([]);

  // State: loading
  const [loadingDentists, setLoadingDentists] = useState(true);
  const [loadingAgenda, setLoadingAgenda] = useState(false);

  // State: modales
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [prefilledSlot, setPrefilledSlot] = useState(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);

  // Fetch dentistas al montar o cuando cambia la org
  useEffect(() => {
    if (!organizationId) return;
    let mounted = true;
    setLoadingDentists(true);
    Promise.all([getOrgDentists(organizationId), getOrgClinics(organizationId)])
      .then(([dentistList, clinicList]) => {
        if (!mounted) return;
        setDentists(dentistList);
        setClinics(clinicList);
        // Auto-select primer dentista alfabético si no hay ninguno seleccionado
        if (dentistList.length > 0 && !selectedDentistId) {
          setSelectedDentistId(dentistList[0].id);
        }
      })
      .catch((err) => {
        logger.error('Error fetching dentists/clinics:', err);
        toast({
          variant: 'destructive',
          title: 'Error al cargar equipo',
          description: err.message || 'No se pudieron cargar los dentistas de la clínica.',
        });
      })
      .finally(() => {
        if (mounted) setLoadingDentists(false);
      });
    return () => { mounted = false; };
  }, [organizationId, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch agenda data cuando cambia dentista seleccionado o semana
  const fetchAgendaData = useCallback(async () => {
    if (!organizationId || !selectedDentistId) return;
    setLoadingAgenda(true);
    const weekStart = format(currentWeek, 'yyyy-MM-dd');
    const weekEnd = format(addDays(currentWeek, 6), 'yyyy-MM-dd');

    try {
      const [apts, blocks, availability] = await Promise.all([
        getOrgAppointments(organizationId, selectedDentistId, weekStart, weekEnd),
        getOrgBlockedTimes(organizationId, selectedDentistId, weekStart, weekEnd),
        getOrgAvailability(organizationId, selectedDentistId, weekStart, 7),
      ]);
      setAppointments(apts);
      setBlockedTimes(blocks);
      setAvailabilityData(availability);
    } catch (err) {
      logger.error('Error fetching agenda data:', err);
      toast({
        variant: 'destructive',
        title: 'Error al cargar agenda',
        description: err.message || 'No se pudo cargar la agenda del dentista.',
      });
    } finally {
      setLoadingAgenda(false);
    }
  }, [organizationId, selectedDentistId, currentWeek, toast]);

  useEffect(() => {
    fetchAgendaData();
  }, [fetchAgendaData]);

  // Filtrar citas por estado
  const filteredAppointments = useMemo(() => {
    if (statusFilter === 'all') return appointments;
    return appointments.filter((a) => a.status === statusFilter);
  }, [appointments, statusFilter]);

  // Datos del dentista seleccionado (para header + "clinic virtual" para color coding)
  const selectedDentist = useMemo(
    () => dentists.find((d) => d.id === selectedDentistId) || null,
    [dentists, selectedDentistId]
  );

  // Hack: pasar el dentista como "clinic" para color coding en WeeklyAgendaView
  // (el componente existente colorea por clinic_id; pasamos un array sintético)
  const virtualClinics = useMemo(() => {
    if (!selectedDentist) return [];
    return [{
      id: selectedDentist.id,
      name: selectedDentist.full_name,
      business_hours: null,
    }];
  }, [selectedDentist]);

  // Handlers de navegación
  const handlePreviousWeek = () => setCurrentWeek((prev) => subWeeks(prev, 1));
  const handleNextWeek = () => setCurrentWeek((prev) => addWeeks(prev, 1));
  const handleToday = () => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Helper: chequea overlap client-side (FR-010, research §R-07)
  const hasOverlap = useCallback((date, startTime, endTime, ignoreApptId = null) => {
    // Conflictos con citas activas del mismo dentista
    const aptConflict = appointments.some((a) => {
      if (a.id === ignoreApptId) return false;
      if (a.status === 'cancelled') return false;
      if (a.date !== date) return false;
      const aStart = a.start_time?.slice(0, 5);
      const aEnd = a.end_time?.slice(0, 5);
      return !(endTime <= aStart || startTime >= aEnd);
    });
    if (aptConflict) return 'appointment';

    // Conflictos con bloqueos del mismo dentista
    const blockConflict = blockedTimes.some((b) => {
      if (b.date !== date) return false;
      const bStart = b.start_time?.slice(0, 5);
      const bEnd = b.end_time?.slice(0, 5);
      return !(endTime <= bStart || startTime >= bEnd);
    });
    if (blockConflict) return 'block';
    return null;
  }, [appointments, blockedTimes]);

  // T019 + T025: slot click — crea cita (mode=create) o bloqueo (mode=block)
  const handleSlotClick = useCallback(async (slotInfo) => {
    if (!selectedDentistId) {
      toast({ variant: 'destructive', title: 'Seleccioná un dentista primero' });
      return;
    }
    const { date, startTime, endTime } = slotInfo;

    // Validar overlap
    const conflict = hasOverlap(date, startTime, endTime);
    if (conflict) {
      toast({
        variant: 'destructive',
        title: 'Conflicto de horario',
        description: conflict === 'appointment'
          ? 'Ya existe una cita en ese horario para este dentista.'
          : 'El horario está bloqueado para este dentista.',
      });
      return;
    }

    if (mode === 'create') {
      // Abrir modal de nueva cita
      setPrefilledSlot({
        date,
        startTime,
        endTime,
        therapistId: selectedDentistId,
      });
      setEditingAppointmentId(null);
      setAppointmentModalOpen(true);
    } else if (mode === 'block') {
      // Crear bloqueo directo (sin modal — podemos evolucionar a modal con razón después)
      const reason = window.prompt('Razón del bloqueo (opcional, máx 200 caracteres):', '');
      if (reason === null) return; // cancelado

      try {
        const clinic = clinics[0];
        const created = await createOrgBlockedTime({
          therapist_id: selectedDentistId,
          clinic_id: clinic?.id || null,
          date,
          start_time: `${startTime}:00`,
          end_time: `${endTime}:00`,
          reason: reason?.trim() || null,
        });
        setBlockedTimes((prev) => [...prev, created]);
        toast({ title: '✅ Hora bloqueada' });
      } catch (err) {
        logger.error('Error creating blocked time:', err);
        toast({
          variant: 'destructive',
          title: 'Error al bloquear',
          description: err.message || 'No se pudo crear el bloqueo.',
        });
      }
    }
  }, [mode, selectedDentistId, clinics, hasOverlap, toast]);

  // T030: click en cita → abrir modal edit
  const handleAppointmentClick = useCallback((apt) => {
    if (!apt?.id) return;
    setEditingAppointmentId(apt.id);
    setPrefilledSlot(null);
    setAppointmentModalOpen(true);
  }, []);

  // T026: click en bloqueo → ofrecer desbloquear
  const handleBlockedTimeClick = useCallback(async (block) => {
    if (!block?.id) return;
    const reasonText = block.reason ? ` "${block.reason}"` : '';
    const confirmed = window.confirm(`¿Eliminar este bloqueo${reasonText}?\n\n${block.date} ${block.start_time?.slice(0,5)}-${block.end_time?.slice(0,5)}`);
    if (!confirmed) return;

    try {
      await deleteOrgBlockedTime(block.id);
      setBlockedTimes((prev) => prev.filter((b) => b.id !== block.id));
      toast({ title: '✅ Hora desbloqueada' });
    } catch (err) {
      logger.error('Error deleting blocked time:', err);
      toast({
        variant: 'destructive',
        title: 'Error al desbloquear',
        description: err.message,
      });
    }
  }, [toast]);

  // T025: drag-to-create de bloqueo (invocado por WeeklyAgendaView en su flujo de drag)
  const handleBlockDragCreate = useCallback(async (blockInfo) => {
    if (!selectedDentistId || mode !== 'block') return;
    const { date, startTime, endTime } = blockInfo;

    const conflict = hasOverlap(date, startTime, endTime);
    if (conflict) {
      toast({
        variant: 'destructive',
        title: 'Conflicto',
        description: 'Ya hay una cita o bloqueo en ese rango.',
      });
      return;
    }

    try {
      const clinic = clinics[0];
      const created = await createOrgBlockedTime({
        therapist_id: selectedDentistId,
        clinic_id: clinic?.id || null,
        date,
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
        reason: null,
      });
      setBlockedTimes((prev) => [...prev, created]);
      toast({ title: '✅ Hora bloqueada' });
    } catch (err) {
      logger.error('Error creating blocked time:', err);
      toast({
        variant: 'destructive',
        title: 'Error al bloquear',
        description: err.message,
      });
    }
  }, [mode, selectedDentistId, clinics, hasOverlap, toast]);

  // T033-T034: resize / mover cita
  const handleAppointmentMove = useCallback(async (moveInfo) => {
    if (!moveInfo?.appointmentId) return;
    const { appointmentId, newStart, newEnd, newDate } = moveInfo;

    // Validación: duración mínima 15 min
    const startStr = newStart?.slice(0, 5) || newStart;
    const endStr = newEnd?.slice(0, 5) || newEnd;
    const apt = appointments.find((a) => a.id === appointmentId);
    if (!apt) return;

    const effectiveDate = newDate || apt.date;

    // Overlap check (ignorando la cita misma)
    const conflict = hasOverlap(effectiveDate, startStr, endStr, appointmentId);
    if (conflict) {
      toast({
        variant: 'destructive',
        title: 'Conflicto',
        description: 'El cambio colisiona con otra cita o bloqueo.',
      });
      // Recargamos para revertir visualmente
      fetchAgendaData();
      return;
    }

    // Duración mínima 15 min
    const startMinutes = Number(startStr.split(':')[0]) * 60 + Number(startStr.split(':')[1]);
    const endMinutes = Number(endStr.split(':')[0]) * 60 + Number(endStr.split(':')[1]);
    if (endMinutes - startMinutes < 15) {
      toast({
        variant: 'destructive',
        title: 'Duración mínima 15 minutos',
      });
      fetchAgendaData();
      return;
    }

    try {
      const updated = await updateOrgAppointment(appointmentId, {
        date: effectiveDate,
        start_time: `${startStr}:00`,
        end_time: `${endStr}:00`,
      });
      setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? { ...a, ...updated } : a)));

      // Audit log
      if (user?.id && apt.patient_id) {
        logClinicalAccess({
          organization_id: organizationId,
          user_id: user.id,
          patient_id: apt.patient_id,
          action: 'update',
          resource_type: 'appointment',
          resource_id: appointmentId,
          grant_id: null,
          reason: null,
          ip_address: null,
        }).catch((err) => logger.warn('audit log update failed:', err));
      }

      toast({ title: '✅ Cita actualizada' });
    } catch (err) {
      logger.error('Error moving appointment:', err);
      toast({
        variant: 'destructive',
        title: 'Error al actualizar cita',
        description: err.message,
      });
      fetchAgendaData();
    }
  }, [appointments, hasOverlap, user, organizationId, fetchAgendaData, toast]);

  // Callbacks para modales
  const handleAppointmentCreated = useCallback((created) => {
    setAppointments((prev) => [...prev, created]);
  }, []);

  const handleAppointmentUpdated = useCallback((updated) => {
    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }, []);

  // Render: loading inicial
  if (loadingDentists) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Render: sin dentistas en la org
  if (dentists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sin dentistas asociados</h2>
        <p className="text-muted-foreground max-w-md">
          Esta clínica aún no tiene dentistas asociados. Contactá al administrador
          para que invite al primer dentista desde Gestión de Personal.
        </p>
      </div>
    );
  }

  const clinic = clinics[0] || null;

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Agenda</h1>
          <p className="text-muted-foreground text-sm">
            {clinic?.name || 'Clínica'} — {scope === 'assistant' ? 'Vista recepción' : 'Vista administrativa'}
          </p>
        </div>

        {/* Toggle modo */}
        <div className="flex items-center gap-2">
          <Button
            variant={mode === 'create' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('create')}
            className={mode === 'create' ? 'bg-primary' : ''}
          >
            <CalendarIcon className="h-4 w-4 mr-1.5" />
            Crear cita
          </Button>
          <Button
            variant={mode === 'block' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('block')}
            className={mode === 'block' ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' : 'border-red-200 text-red-700 hover:bg-red-50'}
          >
            <Ban className="h-4 w-4 mr-1.5" />
            Bloquear hora
          </Button>
        </div>
      </div>

      {/* Filters + navegación */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Navegación semanal */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="font-mono text-sm px-3 min-w-[180px] text-center">
                {format(currentWeek, "d MMM", { locale: es })} — {format(addDays(currentWeek, 6), "d MMM yyyy", { locale: es })}
              </div>
              <Button variant="outline" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleToday}>
                Hoy
              </Button>
            </div>

            {/* Selector de dentista + filtro de estado */}
            <div className="flex gap-2 flex-1 justify-end flex-wrap">
              <Select value={selectedDentistId || ''} onValueChange={setSelectedDentistId}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Dentista" />
                </SelectTrigger>
                <SelectContent>
                  {dentists.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      Dr. {d.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="scheduled">Agendadas</SelectItem>
                  <SelectItem value="confirmed">Confirmadas</SelectItem>
                  <SelectItem value="completed">Completadas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                  <SelectItem value="no-show">No asistió</SelectItem>
                </SelectContent>
              </Select>

              <Badge variant="secondary" className="self-center">
                {filteredAppointments.length} cita{filteredAppointments.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid semanal */}
      <Card>
        <CardContent className="p-0 overflow-hidden">
          {loadingAgenda ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <WeeklyAgendaView
              currentWeek={currentWeek}
              appointments={filteredAppointments}
              blockedTimes={blockedTimes}
              availabilityData={availabilityData}
              clinics={virtualClinics}
              selectedClinic={selectedDentistId || 'all'}
              startHour={8}
              endHour={20}
              onSlotClick={handleSlotClick}
              onAppointmentClick={handleAppointmentClick}
              onBlockedTimeClick={handleBlockedTimeClick}
              onBlockDragCreate={handleBlockDragCreate}
              onAppointmentMove={handleAppointmentMove}
              loading={loadingAgenda}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal crear/editar cita */}
      <AssistantAppointmentModal
        isOpen={appointmentModalOpen}
        onClose={() => {
          setAppointmentModalOpen(false);
          setPrefilledSlot(null);
          setEditingAppointmentId(null);
        }}
        prefilledSlot={prefilledSlot}
        appointmentId={editingAppointmentId}
        organizationId={organizationId}
        clinicId={clinics[0]?.id || null}
        onCreated={handleAppointmentCreated}
        onUpdated={handleAppointmentUpdated}
      />
    </div>
  );
};

export default OrgCalendarView;
