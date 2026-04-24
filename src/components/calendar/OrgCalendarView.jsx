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

  // State: block time dialog (crear)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [pendingBlock, setPendingBlock] = useState(null); // { date, startTime, endTime }
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
      const clinicIdForAvailability = clinics[0]?.id || null;
      const [apts, blocks, availability] = await Promise.all([
        getOrgAppointments(organizationId, selectedDentistId, weekStart, weekEnd),
        getOrgBlockedTimes(organizationId, selectedDentistId, weekStart, weekEnd),
        getOrgAvailability(organizationId, selectedDentistId, weekStart, 7, clinicIdForAvailability),
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
  }, [organizationId, selectedDentistId, currentWeek, clinics, toast]);

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
  const handleSlotClick = useCallback((slotInfo) => {
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

    // Abrir modal de nueva cita
    setPrefilledSlot({
      date,
      startTime,
      endTime,
      therapistId: selectedDentistId,
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
  const handleBlockDragCreate = useCallback((blockInfo) => {
    if (!selectedDentistId) return;
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
    setBlockDialogOpen(true);
  }, [selectedDentistId, hasOverlap, toast]);

  // Confirm del block dialog — crea el blocked_time
  const handleConfirmBlock = useCallback(async () => {
    if (!pendingBlock || !selectedDentistId) return;
    setIsSubmittingBlock(true);
    try {
      const clinic = clinics[0];
      const created = await createOrgBlockedTime({
        therapist_id: selectedDentistId,
        clinic_id: clinic?.id || null,
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
  }, [pendingBlock, selectedDentistId, clinics, blockReason, toast]);

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
                  <SelectItem value="no-show">Ausentes</SelectItem>
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

          <div className="space-y-2">
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
