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
import { useSearchParams } from 'react-router-dom';
import { startOfWeek, addDays, subWeeks, addWeeks, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertCircle, Loader2, Ban, MapPin } from 'lucide-react';

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

import WeeklyAgendaView from '@/components/calendar/WeeklyAgendaView';
import AssistantAppointmentModal from '@/components/calendar/assistant/AssistantAppointmentModal';
// Spec 030: PostSession se dispara cuando una cita pasa a 'completed' desde el
// modal del asistente/admin también, no solo desde el del dentista puro.
import PostSessionModal from '@/features/post-session/components/PostSessionModal';
// Spec 030 followup: modal completo de bloqueo (con date pickers + recurring).
// Se abre desde el botón "Bloquear Horarios" del sidebar.
import BlockTimeModal from '@/components/calendar/BlockTimeModal';
import { useAuth } from '@/contexts/AuthContext';

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
import { supabase } from '@/lib/supabaseClient';
import AgendaSidebar from '@/components/calendar/AgendaSidebar';

import logger from '@/lib/utils/logger';

const OrgCalendarView = ({ scope = 'assistant', organizationId }) => {
  const { toast } = useToast();
  const { user } = useAuth();

  // State: selección y navegación
  const [dentists, setDentists] = useState([]);
  const [clinics, setClinics] = useState([]);
  // Spec 028 US3 FR-009/010: filtro de dentista persistido en URL.
  // null = "Todos los dentistas" (default). uuid = filtro single-dentista.
  // Validamos formato UUID antes de aceptarlo — un valor random tipo
  // "yyyy" rompería el query de Postgres con "invalid input syntax".
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const [searchParams, setSearchParams] = useSearchParams();
  const rawDentistParam = searchParams.get('dentist');
  const selectedDentistId = rawDentistParam && UUID_REGEX.test(rawDentistParam)
    ? rawDentistParam
    : null;
  const setSelectedDentistId = useCallback(
    (id) => {
      if (!id || id === 'all') {
        searchParams.delete('dentist');
      } else {
        searchParams.set('dentist', id);
      }
      setSearchParams(searchParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [statusFilter, setStatusFilter] = useState('all');

  // State: data de agenda
  const [appointments, setAppointments] = useState([]);
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [availabilityData, setAvailabilityData] = useState([]);

  // Box selector — equivalente al patrón de CalendarPage del dentista.
  // selectedBoxId = null → ver todas las citas de la org sin filtrar por box.
  // selectedBoxId = uuid → filtrar a citas de ese box (las sin box quedan visibles).
  const [boxesForClinic, setBoxesForClinic] = useState([]);
  const [selectedBoxId, setSelectedBoxId] = useState(null);
  // Clínica seleccionada — en Fase 1 hay 1 clínica por org (la asistente ve esa),
  // pero el state existe para soportar multi-sucursal futura.
  const [selectedClinicId, setSelectedClinicId] = useState(null);

  // State: loading
  const [loadingDentists, setLoadingDentists] = useState(true);
  const [loadingAgenda, setLoadingAgenda] = useState(false);

  // State: modales
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  // Spec 030: cita recién marcada como completed → dispara PostSession.
  const [completedAppointment, setCompletedAppointment] = useState(null);
  const [prefilledSlot, setPrefilledSlot] = useState(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);

  // State: block time dialog (crear)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  // Spec 030 followup: modal completo de bloqueo (con date pickers + recurring)
  // que se abre desde el botón "Bloquear Horarios" del sidebar O desde el
  // shortcut "mejor bloquear esta hora" del modal de Nueva cita.
  const [blockTimeModalOpen, setBlockTimeModalOpen] = useState(false);
  const [blockTimePrefilledSlot, setBlockTimePrefilledSlot] = useState(null);
  const [blockTimeTherapistId, setBlockTimeTherapistId] = useState(null);
  const [pendingBlock, setPendingBlock] = useState(null); // { date, startTime, endTime }
  // Spec 030 followup: box donde aplica el bloqueo. 'all' = todos los boxes
  // (NULL en DB). Default = box actual del calendario (o 'all' si vista global).
  const [pendingBlockBoxId, setPendingBlockBoxId] = useState('all');
  const [blockReason, setBlockReason] = useState('');
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);

  // State: unblock confirmation
  const [blockToDelete, setBlockToDelete] = useState(null);
  const [isDeletingBlock, setIsDeletingBlock] = useState(false);

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
        // Spec 028 US3: NO auto-select. Default es "Todos los dentistas" (null).
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

  // Spec 028 US3 FR-011: si el URL trae un dentist_id inválido (formato malo
  // o uuid que no pertenece a la org actual), limpiar silenciosamente — sin
  // mostrar error al usuario.
  useEffect(() => {
    // Caso 1: formato UUID inválido (rawDentistParam existe pero no matchea regex).
    if (rawDentistParam && !UUID_REGEX.test(rawDentistParam)) {
      setSelectedDentistId(null);
      return;
    }
    // Caso 2: UUID válido pero no es de esta org.
    if (!selectedDentistId || dentists.length === 0) return;
    const exists = dentists.some((d) => d.id === selectedDentistId);
    if (!exists) setSelectedDentistId(null);
  }, [rawDentistParam, selectedDentistId, dentists, setSelectedDentistId]);

  // Auto-select primer clinic cuando se cargan (Fase 1: 1 clínica por org).
  useEffect(() => {
    if (clinics.length > 0 && !selectedClinicId) {
      setSelectedClinicId(clinics[0].id);
    }
  }, [clinics, selectedClinicId]);

  // Fetch boxes de la clínica seleccionada + auto-select primer box.
  // Mismo patrón que CalendarPage del dentista (line 85-100).
  useEffect(() => {
    const loadBoxes = async () => {
      if (!selectedClinicId) {
        setBoxesForClinic([]);
        setSelectedBoxId(null);
        return;
      }
      const { data, error } = await supabase
        .from('clinic_boxes')
        .select('id, name, box_type')
        .eq('clinic_id', selectedClinicId)
        .eq('is_active', true)
        .order('name');
      if (error) {
        logger.warn('[OrgCalendarView] load boxes:', error.message);
        setBoxesForClinic([]);
        return;
      }
      setBoxesForClinic(data || []);
      // Auto-select primer box solo si no hay uno seleccionado
      if (data && data.length > 0 && !selectedBoxId) {
        setSelectedBoxId(data[0].id);
      }
    };
    loadBoxes();
  }, [selectedClinicId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch agenda data cuando cambia dentista seleccionado o semana.
  // Spec 028 US3: dos modos según selectedDentistId.
  const fetchAgendaData = useCallback(async () => {
    if (!organizationId) return;
    setLoadingAgenda(true);
    const weekStart = format(currentWeek, 'yyyy-MM-dd');
    const weekEnd = format(addDays(currentWeek, 6), 'yyyy-MM-dd');

    try {
      if (selectedDentistId) {
        // Modo single-dentista: citas + bloqueos + availability shading
        const clinicIdForAvailability = clinics[0]?.id || null;
        const [apts, blocks, availability] = await Promise.all([
          getOrgAppointments(organizationId, selectedDentistId, weekStart, weekEnd),
          getOrgBlockedTimes(organizationId, selectedDentistId, weekStart, weekEnd),
          getOrgAvailability(organizationId, selectedDentistId, weekStart, 7, clinicIdForAvailability),
        ]);
        setAppointments(apts);
        setBlockedTimes(blocks);
        setAvailabilityData(availability);
      } else {
        // Modo "Todos los dentistas": citas + bloqueos de todos los dentistas.
        // (availability shading no se mezcla — cada dentista tiene su horario
        // distinto). Los bloqueos sí porque la asistente necesita ver que ese
        // dentista no está disponible aunque otros sí.
        const allDentistIds = dentists.map((d) => d.id);
        const [apts, blocks] = await Promise.all([
          getOrgAppointments(organizationId, null, weekStart, weekEnd),
          getOrgBlockedTimes(organizationId, allDentistIds, weekStart, weekEnd),
        ]);
        setAppointments(apts);
        setBlockedTimes(blocks);
        setAvailabilityData([]);
      }
    } catch (err) {
      logger.error('Error fetching agenda data:', err);
      toast({
        variant: 'destructive',
        title: 'Error al cargar agenda',
        description: err.message || 'No se pudo cargar la agenda.',
      });
    } finally {
      setLoadingAgenda(false);
    }
  }, [organizationId, selectedDentistId, currentWeek, clinics, dentists, toast]);

  useEffect(() => {
    fetchAgendaData();
  }, [fetchAgendaData]);

  // Filtrar citas por estado + box.
  // Box: filtro ESTRICTO — solo citas con box_id == selectedBoxId.
  // Las sin box_id (legacy) NO aparecen en ningún box → la asistente debe
  // editarlas y asignarles box. Ver `appointmentsWithoutBox` para el badge
  // que las cuenta.
  const filteredAppointments = useMemo(() => {
    let list = appointments;
    if (statusFilter !== 'all') {
      list = list.filter((a) => a.status === statusFilter);
    }
    if (selectedBoxId) {
      list = list.filter((a) => a.box_id === selectedBoxId);
    }
    return list;
  }, [appointments, statusFilter, selectedBoxId]);

  // Bloqueos filtrados por box. Un bloqueo SIN box_id = "el dentista no atiende
  // este horario en ningun box" → debe verse en TODOS los boxes (no solo en
  // alguno). Por eso el filtro acepta box_id matching O NULL.
  const filteredBlockedTimes = useMemo(() => {
    if (!selectedBoxId) return blockedTimes;
    return blockedTimes.filter(
      (bt) => bt.box_id === selectedBoxId || bt.box_id == null
    );
  }, [blockedTimes, selectedBoxId]);

  // Contador de citas sin box asignado (legacy data) — informativo para que
  // la asistente sepa que tiene data que limpiar.
  const appointmentsWithoutBoxCount = useMemo(() => {
    return appointments.filter((a) => !a.box_id).length;
  }, [appointments]);

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
  // Schema real:
  //   - appointments: date (date) + start_time (time) + end_time (time) separados
  //   - blocked_times: start_time (timestamptz) + end_time (timestamptz) combinados
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

    // Conflictos con bloqueos del mismo dentista (blocked_times usa timestamptz)
    const slotStart = new Date(`${date}T${startTime}:00`);
    const slotEnd = new Date(`${date}T${endTime}:00`);
    const blockConflict = blockedTimes.some((b) => {
      const bStart = new Date(b.start_time);
      const bEnd = new Date(b.end_time);
      return !(slotEnd <= bStart || slotStart >= bEnd);
    });
    if (blockConflict) return 'block';
    return null;
  }, [appointments, blockedTimes]);

  // T019: slot click simple → abrir modal de nueva cita
  // (drag se maneja en handleBlockDragCreate, patrón heredado de WeeklyAgendaView del dentista)
  //
  // Spec 028 US3: ahora se permite click en slot sin dentista seleccionado
  // ("Todos los dentistas" mode). El modal pide el dentista vía Select (FR-001).
  const handleSlotClick = useCallback((slotInfo) => {
    const { date, startTime, endTime } = slotInfo;

    // Validar overlap solo si hay dentista filtrado (en modo "Todos" no podemos
    // saber el overlap relevante hasta que el user elija dentista en el modal).
    if (selectedDentistId) {
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
    }

    // Abrir modal de nueva cita. therapistId puede ser null (todos-mode);
    // el modal usa default smart (US2): self si user es dentista, sino vacío.
    // boxId hereda del filtro del sidebar (la cita se crea para el box visible).
    setPrefilledSlot({
      date,
      startTime,
      endTime,
      therapistId: selectedDentistId,
      boxId: selectedBoxId,
    });
    setEditingAppointmentId(null);
    setAppointmentModalOpen(true);
  }, [selectedDentistId, hasOverlap, toast]);

  // T030: click en cita → abrir modal edit
  const handleAppointmentClick = useCallback((apt) => {
    if (!apt?.id) return;
    setEditingAppointmentId(apt.id);
    setPrefilledSlot(null);
    setAppointmentModalOpen(true);
  }, []);

  // T026: click en bloqueo → abrir AlertDialog de confirmación
  const handleBlockedTimeClick = useCallback((block) => {
    if (!block?.id) return;
    setBlockToDelete(block);
  }, []);

  // Confirm del unblock dialog
  const handleConfirmUnblock = useCallback(async () => {
    if (!blockToDelete?.id) return;
    setIsDeletingBlock(true);
    try {
      await deleteOrgBlockedTime(blockToDelete.id);
      setBlockedTimes((prev) => prev.filter((b) => b.id !== blockToDelete.id));
      toast({ title: '✅ Hora desbloqueada' });
      setBlockToDelete(null);
    } catch (err) {
      logger.error('Error deleting blocked time:', err);
      toast({
        variant: 'destructive',
        title: 'Error al desbloquear',
        description: err.message,
      });
    } finally {
      setIsDeletingBlock(false);
    }
  }, [blockToDelete, toast]);

  // T025: drag-to-create de bloqueo
  // Patrón heredado de WeeklyAgendaView: drag siempre crea bloqueo
  // (click simple abre modal de cita, ver handleSlotClick).
  // Al detectar drag válido → abrir Dialog shadcn con input de razón.
  //
  // Spec 028 US3: bloquear hora requiere dentista filtrado (los bloqueos son
  // per-dentista). En modo "Todos los dentistas", mostrar mensaje informativo.
  const handleBlockDragCreate = useCallback((blockInfo) => {
    if (!selectedDentistId) {
      toast({
        variant: 'destructive',
        title: 'Filtra por dentista primero',
        description: 'Para bloquear una hora elige qué dentista en el filtro.',
      });
      return;
    }
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

    // Abrir Dialog para confirmar + capturar razón
    setPendingBlock({ date, startTime, endTime });
    setBlockReason('');
    // Default = box actual del calendario (heredado). Si vista global → 'all'.
    setPendingBlockBoxId(selectedBoxId || 'all');
    setBlockDialogOpen(true);
  }, [selectedDentistId, hasOverlap, toast, selectedBoxId]);

  // Confirm del block dialog — crea el blocked_time
  const handleConfirmBlock = useCallback(async () => {
    if (!pendingBlock || !selectedDentistId) return;
    setIsSubmittingBlock(true);
    try {
      const clinic = clinics[0];
      const created = await createOrgBlockedTime({
        therapist_id: selectedDentistId,
        clinic_id: clinic?.id || null,
        box_id: pendingBlockBoxId === 'all' ? null : pendingBlockBoxId,
        date: pendingBlock.date,
        start_time: `${pendingBlock.startTime}:00`,
        end_time: `${pendingBlock.endTime}:00`,
        reason: blockReason?.trim() || null,
      });
      setBlockedTimes((prev) => [...prev, created]);
      toast({ title: '✅ Hora bloqueada' });
      setBlockDialogOpen(false);
      setPendingBlock(null);
      setBlockReason('');
    } catch (err) {
      logger.error('Error creating blocked time:', err);
      toast({
        variant: 'destructive',
        title: 'Error al bloquear',
        description: err.message,
      });
    } finally {
      setIsSubmittingBlock(false);
    }
  }, [pendingBlock, selectedDentistId, clinics, blockReason, pendingBlockBoxId, toast]);

  // Drag-to-move de cita. WeeklyAgendaView dispara como args posicionales:
  //   onAppointmentMove(apptId, dateStr, timeStr, endTimeStr)
  // Ver WeeklyAgendaView.jsx línea 345. NO resize — solo movimiento completo de la cita.
  const handleAppointmentMove = useCallback(async (apptId, dateStr, timeStr, endTimeStr) => {
    if (!apptId) return;
    const apt = appointments.find((a) => a.id === apptId);
    if (!apt) return;

    // Overlap check (ignorando la cita misma)
    const conflict = hasOverlap(dateStr, timeStr, endTimeStr, apptId);
    if (conflict) {
      toast({
        variant: 'destructive',
        title: 'Conflicto',
        description: 'El cambio colisiona con otra cita o bloqueo.',
      });
      fetchAgendaData(); // revertir visual
      return;
    }

    try {
      const updated = await updateOrgAppointment(apptId, {
        date: dateStr,
        start_time: `${timeStr}:00`,
        end_time: `${endTimeStr}:00`,
      });
      setAppointments((prev) => prev.map((a) => (a.id === apptId ? { ...a, ...updated } : a)));

      toast({ title: '✅ Cita movida' });
    } catch (err) {
      logger.error('Error moving appointment:', err);
      toast({
        variant: 'destructive',
        title: 'Error al mover cita',
        description: err.message,
      });
      fetchAgendaData();
    }
  }, [appointments, hasOverlap, fetchAgendaData, toast]);

  // Callbacks para modales
  const handleAppointmentCreated = useCallback((created) => {
    setAppointments((prev) => [...prev, created]);
  }, []);

  const handleAppointmentUpdated = useCallback((updated) => {
    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }, []);

  // Cambio rápido de estado desde el badge "Citas de Hoy" del sidebar.
  // El asistente/admin clickea el badge → dropdown con opciones → onStatusChange dispara.
  // Audit: si el nuevo status es 'cancelled' usamos action='cancel', sino 'update'.
  const handleAppointmentStatusChange = useCallback(async (apptId, newStatus) => {
    const apt = appointments.find((a) => a.id === apptId);
    if (!apt || apt.status === newStatus) return;
    try {
      const updated = await updateOrgAppointment(apptId, { status: newStatus });
      setAppointments((prev) => prev.map((a) => (a.id === apptId ? { ...a, ...updated } : a)));
      const auditAction = newStatus === 'cancelled' ? 'cancel' : 'update';
      logClinicalAccess({
        organization_id: organizationId,
        user_id: user?.id,
        patient_id: apt.patient?.id || apt.patient_id,
        action: auditAction,
        resource_type: 'appointment',
        resource_id: apptId,
        grant_id: null,
        reason: `status:${apt.status}→${newStatus}`,
        ip_address: null,
      }).catch((err) => logger.warn('audit log status change failed:', err?.message));
      toast({ title: '✅ Estado actualizado' });
    } catch (err) {
      logger.error('Error updating appointment status:', err);
      toast({
        variant: 'destructive',
        title: 'Error al cambiar estado',
        description: err.message || 'No se pudo actualizar la cita.',
      });
    }
  }, [appointments, organizationId, user?.id, toast]);

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
          Esta clínica aún no tiene dentistas asociados. Contacta al administrador
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

        {/* Tooltip de UX — cómo usar drag vs click */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-50 border">
            <CalendarIcon className="h-3.5 w-3.5 text-primary" />
            <span><strong>Click</strong> en slot libre = crear cita</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-red-50 border border-red-100">
            <Ban className="h-3.5 w-3.5 text-red-600" />
            <span><strong>Drag</strong> sobre slots = bloquear hora</span>
          </div>
        </div>
      </div>

      {/* Layout 2-column: sidebar a la izquierda (Ubicación + Estado + mini calendar
          + Citas de Hoy) + grid semanal a la derecha. Mismo pattern que CalendarPage
          del dentista para consistencia. */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-1">
          <AgendaSidebar
            clinics={clinics}
            selectedClinicId={selectedClinicId}
            onClinicChange={setSelectedClinicId}
            appointments={filteredAppointments}
            currentWeek={currentWeek}
            onWeekChange={setCurrentWeek}
            organizationId={organizationId}
            userId={user?.id}
            boxes={boxesForClinic}
            selectedBoxId={selectedBoxId}
            onBoxChange={setSelectedBoxId}
            dentists={dentists}
            selectedDentistId={selectedDentistId}
            onDentistChange={setSelectedDentistId}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onStatusChange={handleAppointmentStatusChange}
            onBlockTime={() => {
              if (!selectedDentistId) {
                toast({
                  variant: 'destructive',
                  title: 'Elegí un dentista primero',
                  description: 'Los bloqueos son por dentista. Filtrá por uno en el sidebar.',
                });
                return;
              }
              setBlockTimeModalOpen(true);
            }}
          />
        </div>
        <div className="lg:col-span-4 space-y-2">
          {/* Mini-header de navegación: flechas izquierda/derecha en los
              extremos, rango de fechas + estado a la izquierda, botón
              "Hoy {fecha}" centrado. Reemplaza el card grande original. */}
          <div className="flex items-center gap-3 px-1">
            {/* Flecha previa semana */}
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousWeek}
              className="h-8 w-8 flex-shrink-0"
              title="Semana anterior"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Rango de fechas + estado de la semana */}
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              <span className="font-medium text-foreground">
                {format(currentWeek, "d MMM", { locale: es })} – {format(addDays(currentWeek, 6), "d MMM yyyy", { locale: es })}
              </span>
              {' '}·{' '}
              {(() => {
                const today = new Date();
                const isThisWeek = currentWeek <= today && addDays(currentWeek, 6) >= today;
                return isThisWeek ? 'Esta semana' : 'Otra semana';
              })()}
            </span>

            {/* Spacer flexible para empujar el botón Hoy al centro */}
            <div className="flex-1" />

            {/* Botón "Hoy {día} de {mes}" centrado */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="h-8 text-xs whitespace-nowrap"
            >
              <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
              Hoy {format(new Date(), "d 'de' MMMM", { locale: es })}
            </Button>

            <div className="flex-1" />

            {/* Flecha siguiente semana */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextWeek}
              className="h-8 w-8 flex-shrink-0"
              title="Semana siguiente"
              aria-label="Semana siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Grid semanal */}
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
                  blockedTimes={filteredBlockedTimes}
                  availabilityData={availabilityData}
                  clinics={virtualClinics}
                  selectedClinic={selectedDentistId || 'all'}
                  dentists={dentists}
                  startHour={clinics[0]?.calendar_start_hour ?? 8}
                  endHour={clinics[0]?.calendar_end_hour ?? 20}
                  slotMinutes={clinics[0]?.calendar_slot_minutes ?? 30}
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
        </div>
      </div>

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
        dentists={dentists}
        blockedTimes={blockedTimes}
        availableBoxes={boxesForClinic}
        onCreated={handleAppointmentCreated}
        onUpdated={handleAppointmentUpdated}
        onSessionCompleted={(apt) => setCompletedAppointment(apt)}
        onSwitchToBlock={(slot) => {
          // Cierra el modal de cita y abre el de bloqueo con fecha+hora+dentista+box
          setAppointmentModalOpen(false);
          setPrefilledSlot(null);
          setEditingAppointmentId(null);
          setBlockTimePrefilledSlot({
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            clinicId: clinics[0]?.id || 'all',
            boxId: slot.boxId,
          });
          setBlockTimeTherapistId(slot.therapistId);
          setBlockTimeModalOpen(true);
        }}
      />

      {/* Spec 030: PostSession se abre cuando se marca cita como completada.
          El modal lista items pending del budget del paciente, permite tildar
          los hechos y disparar el cobro contextual. */}
      <PostSessionModal
        isOpen={!!completedAppointment}
        onClose={() => setCompletedAppointment(null)}
        appointment={completedAppointment}
        therapistId={completedAppointment?.therapist_id || user?.id}
      />

      {/* Spec 030 followup: modal completo de bloqueo desde sidebar.
          Permite multi-día + recurring + selector de box obligatorio. */}
      <BlockTimeModal
        isOpen={blockTimeModalOpen}
        onOpenChange={(open) => {
          setBlockTimeModalOpen(open);
          if (!open) {
            setBlockTimePrefilledSlot(null);
            setBlockTimeTherapistId(null);
          }
        }}
        clinics={clinics}
        selectedClinic={clinics[0]?.id || 'all'}
        selectedBoxId={blockTimePrefilledSlot?.boxId || selectedBoxId}
        availableBoxes={boxesForClinic}
        slotInfo={blockTimePrefilledSlot}
        therapistIdOverride={blockTimeTherapistId || selectedDentistId}
        onSuccess={() => {
          setBlockTimeModalOpen(false);
          setBlockTimePrefilledSlot(null);
          setBlockTimeTherapistId(null);
          fetchAgendaData();
        }}
      />

      {/* Dialog para bloquear hora con razón */}
      <Dialog
        open={blockDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setBlockDialogOpen(false);
            setPendingBlock(null);
            setBlockReason('');
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-600" />
              Bloquear hora
            </DialogTitle>
            <DialogDescription>
              {pendingBlock && (
                <>
                  Bloqueará <strong>{pendingBlock.startTime} — {pendingBlock.endTime}</strong>
                  {' del '}
                  {pendingBlock.date && format(new Date(`${pendingBlock.date}T00:00:00`), "EEEE d 'de' MMMM", { locale: es })}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Spec 030 followup: selector de box. Empuja al dentista a
                elegir conscientemente entre un box especifico O todos. Solo
                aparece si la clinica tiene boxes configurados. */}
            {boxesForClinic.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="block-box" className="text-xs">
                  Box *
                </Label>
                <Select value={pendingBlockBoxId} onValueChange={setPendingBlockBoxId}>
                  <SelectTrigger id="block-box">
                    <SelectValue placeholder="Seleccionar box" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los boxes</SelectItem>
                    {boxesForClinic.map((box) => (
                      <SelectItem key={box.id} value={box.id}>
                        {box.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {pendingBlockBoxId === 'all'
                    ? 'Bloquea al dentista en todos los boxes.'
                    : 'Bloquea solo este box (los otros boxes quedan libres).'}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="block-reason" className="text-xs">
                Razón (opcional)
              </Label>
              <Input
                id="block-reason"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value.slice(0, 200))}
                placeholder="Ej: Almuerzo, Reunión, Vacaciones..."
                maxLength={200}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSubmittingBlock) {
                    e.preventDefault();
                    handleConfirmBlock();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground text-right">
                {blockReason.length}/200
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setBlockDialogOpen(false);
                setPendingBlock(null);
                setBlockReason('');
              }}
              disabled={isSubmittingBlock}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmBlock}
              disabled={isSubmittingBlock}
              className="bg-red-500 hover:bg-red-600 text-white border-red-500"
            >
              {isSubmittingBlock ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Bloqueando...</>
              ) : (
                <><Ban className="h-4 w-4 mr-2" />Bloquear hora</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm unblock */}
      <Dialog
        open={Boolean(blockToDelete)}
        onOpenChange={(open) => {
          if (!open) setBlockToDelete(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Desbloquear esta hora?</DialogTitle>
            <DialogDescription>
              {blockToDelete && (
                <>
                  {blockToDelete.reason ? (
                    <>Bloqueo: <strong>{blockToDelete.reason}</strong><br /></>
                  ) : null}
                  {new Date(blockToDelete.start_time).toLocaleString('es-CL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {' — '}
                  {new Date(blockToDelete.end_time).toLocaleString('es-CL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setBlockToDelete(null)}
              disabled={isDeletingBlock}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmUnblock}
              disabled={isDeletingBlock}
            >
              {isDeletingBlock ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Desbloqueando...</>
              ) : (
                'Desbloquear'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgCalendarView;
