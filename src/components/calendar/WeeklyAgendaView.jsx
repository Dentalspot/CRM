
/**
 * WeeklyAgendaView.jsx
 *
 * Vista semanal del calendario que usa datos de disponibilidad REALES.
 * Implementa Drag & Drop con persistencia a base de datos.
 * Soporta drag-to-create blocks y mover bloques existentes.
 */

import React, { useMemo, useState, useCallback, useRef } from 'react';
import { format, addDays, startOfWeek, isToday, addMinutes, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MapPin, Video, AlertCircle, Loader2, GripVertical } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { buildHolidaysMap } from '@/lib/chilean-holidays';

// Palette for clinic column backgrounds (soft tints)
const CLINIC_COLORS = [
  { bg: 'bg-primary/40', border: 'border-primary', dot: 'bg-primary', label: 'text-primary' },
  { bg: 'bg-indigo-50/40', border: 'border-indigo-200', dot: 'bg-indigo-400', label: 'text-indigo-700' },
  { bg: 'bg-teal-50/40', border: 'border-teal-200', dot: 'bg-teal-400', label: 'text-teal-700' },
  { bg: 'bg-amber-50/40', border: 'border-amber-200', dot: 'bg-amber-400', label: 'text-amber-700' },
  { bg: 'bg-violet-50/40', border: 'border-violet-200', dot: 'bg-violet-400', label: 'text-violet-700' },
  { bg: 'bg-cyan-50/40', border: 'border-cyan-200', dot: 'bg-cyan-400', label: 'text-cyan-700' },
];

export const getClinicColor = (clinicId, clinics) => {
  if (!clinicId) return null;
  const idx = clinics.findIndex(c => c.id === clinicId);
  if (idx < 0) return null;
  return CLINIC_COLORS[idx % CLINIC_COLORS.length];
};

// Spec 028 US5 FR-005/FR-006: paleta para diferenciar dentistas en chips del
// calendario. Mismo dentista = mismo color consistente (índice determinístico
// por orden alfabético, ver getOrgDentists con .sort en org.api.js).
// LEGACY NAMING: el prop sigue siendo "dentistId" en JS; en DB es therapist_id.
const DENTIST_COLORS = [
  { border: 'border-l-teal-500', text: 'text-teal-700' },
  { border: 'border-l-pink-500', text: 'text-pink-700' },
  { border: 'border-l-amber-500', text: 'text-amber-700' },
  { border: 'border-l-violet-500', text: 'text-violet-700' },
  { border: 'border-l-cyan-500', text: 'text-cyan-700' },
  { border: 'border-l-rose-500', text: 'text-rose-700' },
];

export const getDentistColor = (dentistId, dentists) => {
  if (!dentistId || !dentists?.length) return null;
  const idx = dentists.findIndex((d) => d.id === dentistId);
  if (idx < 0) return null;
  return DENTIST_COLORS[idx % DENTIST_COLORS.length];
};

const WeeklyAgendaView = ({
  currentWeek,
  appointments = [],
  blockedTimes = [],
  availabilityData = [],
  clinics = [],
  selectedClinic = 'all',
  dentists = [],
  startHour = 8,
  endHour = 20,
  slotMinutes = 30,
  onSlotClick,
  onAppointmentClick,
  onBlockedTimeClick,
  onAppointmentMove,
  onBlockDragCreate,
  onBlockMove,
  loading = false
}) => {
  const { toast } = useToast();

  const [draggedApt, setDraggedApt] = useState(null);
  const [draggedBlock, setDraggedBlock] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);

  // Drag-to-create block state
  const [blockSelection, setBlockSelection] = useState(null); // { date, startTime, endTime } - only set when dragging
  const isSelectingBlock = useRef(false);
  const suppressClick = useRef(false); // suppress next click after drag-to-block

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [currentWeek]);

  // Feriados chilenos del año actual (+ adyacentes para que la
  // navegación entre años no requiera recalcular). Map yyyy-MM-dd → nombre.
  const holidaysMap = useMemo(() => {
    const year = currentWeek.getFullYear();
    return buildHolidaysMap([year - 1, year, year + 1]);
  }, [currentWeek]);

  const getHolidayName = (day) => holidaysMap.get(format(day, 'yyyy-MM-dd')) || null;

  const timeSlots = useMemo(() => {
    const slots = [];
    // Genera slots cada `slotMinutes` (15 o 30) entre startHour y endHour
    for (let hour = startHour; hour < endHour; hour++) {
      for (let m = 0; m < 60; m += slotMinutes) {
        slots.push(`${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return slots;
  }, [startHour, endHour, slotMinutes]);

  const availabilityMap = useMemo(() => {
    const map = {};
    if (!availabilityData || !Array.isArray(availabilityData)) return map;

    availabilityData.forEach(dayData => {
      if (dayData?.availability_date && Array.isArray(dayData.time_slots)) {
        const dateStr = dayData.availability_date;
        map[dateStr] = {};

        dayData.time_slots.forEach(slot => {
          if (slot?.time) {
            const timeKey = slot.time.substring(0, 5);
            map[dateStr][timeKey] = {
              available: slot.available !== false,
              clinicId: slot.clinic_id
            };
          }
        });
      }
    });

    return map;
  }, [availabilityData]);

  const isSlotAvailable = (dateStr, timeStr) => {
    if (!availabilityMap[dateStr]) return false;
    return availabilityMap[dateStr][timeStr]?.available === true;
  };

  const isRangeAvailableForDrop = (dateStr, startTimeStr, durationMinutes, excludeId, isBlock = false) => {
    const slotsNeeded = Math.ceil(durationMinutes / slotMinutes);
    const hasAvailabilityForDate = availabilityMap[dateStr] && Object.keys(availabilityMap[dateStr]).length > 0;

    const [startH, startM] = startTimeStr.split(':').map(Number);
    let currentH = startH;
    let currentM = startM;

    for (let i = 0; i < slotsNeeded; i++) {
      const currentTimeStr = `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`;

      if (!isBlock && hasAvailabilityForDate && !isSlotAvailable(dateStr, currentTimeStr)) return false;

      const existingBlock = getBlockedTimeForSlot(dateStr, currentTimeStr);
      if (existingBlock && existingBlock.id !== excludeId) return false;

      const blockingApt = getAppointmentForSlot(dateStr, currentTimeStr);
      if (blockingApt && blockingApt.id !== excludeId) return false;

      currentM += slotMinutes;
      if (currentM >= 60) {
        currentM = 0;
        currentH += 1;
      }
    }
    return true;
  };

  const getAppointmentForSlot = (dateStr, timeStr) => {
    return appointments.find(apt => {
      if (apt.date !== dateStr) return false;
      if (apt.status === 'cancelled' || apt.status === 'canceled') return false;

      const aptStart = apt.start_time?.substring(0, 5);
      const aptEnd = apt.end_time?.substring(0, 5);

      if (!aptStart || !aptEnd) return false;
      return timeStr >= aptStart && timeStr < aptEnd;
    });
  };

  const getBlockedTimeForSlot = (dateStr, timeStr) => {
    return blockedTimes.find(block => {
      const blockStart = new Date(block.start_time);
      const blockEnd = new Date(block.end_time);
      const blockDateStr = format(blockStart, 'yyyy-MM-dd');

      if (blockDateStr !== dateStr) return false;

      const blockStartTime = format(blockStart, 'HH:mm');
      const blockEndTime = format(blockEnd, 'HH:mm');

      return timeStr >= blockStartTime && timeStr < blockEndTime;
    });
  };

  const getNextTimeSlot = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    const newM = m + slotMinutes;
    if (newM >= 60) {
      const extraHours = Math.floor(newM / 60);
      return `${String(h + extraHours).padStart(2, '0')}:${String(newM % 60).padStart(2, '0')}`;
    }
    return `${String(h).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  };

  // --- Drag-to-create block handlers ---
  // mouseDown records the anchor slot, but does NOT set blockSelection state yet.
  // blockSelection is only set once the mouse actually moves to a different slot.
  // This ensures a simple click never shows block UI.
  const dragAnchor = useRef(null); // { date, time }

  const handleSlotMouseDown = useCallback((e, dateStr, timeStr) => {
    if (e.button !== 0) return;
    if (getAppointmentForSlot(dateStr, timeStr)) return;
    // Spec 028 multi-dentista: en modo "Todos", permitir drag-to-block sobre slots
    // que tienen bloqueo de otro dentista (la asistente puede bloquear para Pablo
    // un horario donde Cristobal ya está bloqueado).
    const isMultiMode = selectedClinic === 'all';
    if (getBlockedTimeForSlot(dateStr, timeStr) && !isMultiMode) return;

    dragAnchor.current = { date: dateStr, time: timeStr };
    isSelectingBlock.current = true;
    suppressClick.current = false;
  }, [appointments, blockedTimes]);

  const handleSlotMouseEnter = useCallback((dateStr, timeStr) => {
    if (!isSelectingBlock.current || !dragAnchor.current) return;
    if (dateStr !== dragAnchor.current.date) return;
    if (timeStr === dragAnchor.current.time) return; // still on same slot

    // User moved to a different slot → NOW start showing block selection
    const anchor = dragAnchor.current;
    if (timeStr >= anchor.time) {
      setBlockSelection({ date: dateStr, startTime: anchor.time, endTime: getNextTimeSlot(timeStr) });
    }
  }, []);

  const handleSlotMouseUp = useCallback(() => {
    const hadSelection = blockSelection !== null;
    isSelectingBlock.current = false;
    dragAnchor.current = null;

    if (hadSelection && blockSelection.endTime > blockSelection.startTime) {
      suppressClick.current = true;
      const slotInfo = {
        date: blockSelection.date,
        startTime: blockSelection.startTime,
        endTime: blockSelection.endTime,
        clinicId: availabilityMap[blockSelection.date]?.[blockSelection.startTime]?.clinicId
          || (selectedClinic !== 'all' ? selectedClinic : null)
      };
      if (onBlockDragCreate) {
        onBlockDragCreate(slotInfo);
      }
    }

    setBlockSelection(null);
  }, [blockSelection, selectedClinic, availabilityMap, onBlockDragCreate]);

  const isSlotInBlockSelection = (dateStr, timeStr) => {
    if (!blockSelection || blockSelection.date !== dateStr) return false;
    return timeStr >= blockSelection.startTime && timeStr < blockSelection.endTime;
  };

  const handleSlotClick = (day, timeStr) => {
    // Don't fire click if user just finished a drag-to-block
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }

    const dateStr = format(day, 'yyyy-MM-dd');

    // El dentista/admin puede agendar en cualquier slot vacío, incluso fuera
    // del horario configurado en "Mis Lugares" — para urgencias o excepciones.
    // El guard de availability solo aplica al self-booking del paciente
    // (feature futura, no en este flow).
    if (getAppointmentForSlot(dateStr, timeStr)) return;
    // Spec 028 multi-dentista: en modo "Todos los dentistas", un bloqueo de un
    // dentista NO debe impedir agendar con otro. El modal valida el conflicto
    // específico por dentista (warning amber + trigger DB).
    const isMultiMode = selectedClinic === 'all';
    if (getBlockedTimeForSlot(dateStr, timeStr) && !isMultiMode) return;

    const [hour, minute] = timeStr.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hour, minute, 0, 0);
    // Duración default = 1 slot (slotMinutes de la clinic, 15 o 30 min).
    // Si el dentista necesita más, lo ajusta desde el TimePicker del modal.
    const endDate = addMinutes(startDate, slotMinutes);
    const endTimeStr = format(endDate, 'HH:mm');

    onSlotClick?.({
      date: dateStr,
      startTime: timeStr,
      endTime: endTimeStr,
      clinicId: availabilityMap[dateStr]?.[timeStr]?.clinicId || (selectedClinic !== 'all' ? selectedClinic : null)
    });
  };

  // --- Appointment drag handlers ---
  const handleDragStart = (e, apt) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ ...apt, _type: 'appointment' }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedApt(apt);
    setDraggedBlock(null);
  };

  // --- Block drag handlers ---
  const handleBlockDragStart = (e, block) => {
    e.stopPropagation();
    const blockStart = new Date(block.start_time);
    const blockEnd = new Date(block.end_time);
    const diffMins = (blockEnd - blockStart) / 60000;

    e.dataTransfer.setData('application/json', JSON.stringify({ ...block, _type: 'block', _duration: diffMins }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedBlock({ ...block, duration: diffMins });
    setDraggedApt(null);
  };

  const handleDragOver = (e, dateStr, timeStr) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSlot?.date !== dateStr || dragOverSlot?.time !== timeStr) {
      setDragOverSlot({ date: dateStr, time: timeStr });
    }
  };

  const handleDragLeave = (e) => { };

  const handleDrop = (e, dateStr, timeStr) => {
    e.preventDefault();
    setDragOverSlot(null);

    // Handle block drop
    if (draggedBlock) {
      const block = draggedBlock;
      setDraggedBlock(null);

      const blockStart = new Date(block.start_time);
      const currentStartTime = format(blockStart, 'HH:mm');
      const currentDate = format(blockStart, 'yyyy-MM-dd');
      if (currentDate === dateStr && currentStartTime === timeStr) return;

      const duration = block.duration;
      if (!isRangeAvailableForDrop(dateStr, timeStr, duration, block.id, true)) {
        toast({
          variant: "destructive",
          title: "No disponible",
          description: "No se puede mover el bloqueo a este horario."
        });
        return;
      }

      const [h, m] = timeStr.split(':').map(Number);
      const newStart = new Date();
      newStart.setHours(h, m, 0, 0);
      const newEnd = addMinutes(newStart, duration);
      const endTimeStr = format(newEnd, 'HH:mm');

      if (onBlockMove) {
        onBlockMove(block.id, dateStr, timeStr, endTimeStr);
      }
      return;
    }

    // Handle appointment drop
    if (draggedApt) {
      setDraggedApt(null);

      const currentStart = draggedApt.start_time.substring(0, 5);
      if (draggedApt.date === dateStr && currentStart === timeStr) return;

      const duration = draggedApt.duration_minutes || 60;

      if (!isRangeAvailableForDrop(dateStr, timeStr, duration, draggedApt.id)) {
        toast({
          variant: "destructive",
          title: "No disponible",
          description: "El horario seleccionado no está disponible o tiene conflictos."
        });
        return;
      }

      const [h, m] = timeStr.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(h, m, 0, 0);
      const endDate = addMinutes(startDate, duration);
      const endTimeStr = format(endDate, 'HH:mm');

      if (onAppointmentMove) {
        onAppointmentMove(draggedApt.id, dateStr, timeStr, endTimeStr);
      }
    }
  };

  const getClinicName = (clinicId) => {
    if (!clinicId) return '';
    const clinic = clinics.find(c => c.id === clinicId);
    return clinic?.name || '';
  };

  const renderAppointment = (apt, dateStr, timeStr) => {
    const aptStart = apt.start_time?.substring(0, 5);
    if (timeStr !== aptStart) return null;

    const patientName = apt.patient?.profile?.full_name
      || apt.patient?.full_name
      || 'Paciente';

    const isOnline = apt.modality_patient === 'online';
    const isDraggingThis = draggedApt?.id === apt.id;

    // Spec 028 US5 FR-005/006: color de borde lateral por dentista responsable.
    // El border-left COLOR (border-l-{color}) sobrescribe el border-color del
    // status (border-{color}) sólo para el lado izquierdo — los otros 3 lados
    // quedan con el color del status (verde=completada, azul=confirmada, etc.).
    // LEGACY NAMING: apt.therapist_id semánticamente = dentista responsable.
    const dentistColor = getDentistColor(apt.therapist_id, dentists);
    const dentistName = dentists.find((d) => d.id === apt.therapist_id)?.full_name || '';
    // Convención chilena: tomamos el APELLIDO PATERNO (segundo token del nombre completo,
    // ej. "Cristobal Tagle Morales" → "Tagle"). Si solo hay 2 tokens (nombre + paterno),
    // también funciona. Edge case: nombres compuestos como "Maria José" → tomaría "José",
    // aceptable como tradeoff vs el bug de "Dr. Morales" (apellido materno).
    const nameTokens = dentistName.split(' ').filter(Boolean);
    const dentistLastName = nameTokens[1] || nameTokens[0] || dentistName;

    const duration = apt.duration_minutes || 60;
    const heightSlots = Math.ceil(duration / slotMinutes);
    // z-index 10: por encima del bg del slot pero por debajo de la columna
    // de horas sticky (z-20), así no se ven los cards bajo las horas al
    // scrollear horizontal en mobile.
    const style = { height: `${heightSlots * 32}px`, zIndex: 10 };

    let colorClasses = "";
    let blockLabel = "";

    if (apt.block_type) {
      if (apt.block_type === 'aula_recursos') {
        colorClasses = "bg-green-100 border-green-500 text-green-800";
        blockLabel = "Aula Rec.";
      } else if (apt.block_type === 'trabajo_colaborativo') {
        colorClasses = "bg-orange-100 border-orange-500 text-orange-800";
        blockLabel = "Trabajo Colab.";
      } else if (apt.block_type === 'coordinacion') {
        colorClasses = "bg-yellow-100 border-yellow-500 text-yellow-800";
        blockLabel = "Coordinación";
      } else if (apt.block_type === 'informe') {
        colorClasses = "bg-yellow-100 border-yellow-500 text-yellow-800";
        blockLabel = "Informe";
      } else if (apt.block_type === 'preparacion_material') {
        colorClasses = "bg-purple-100 border-purple-500 text-purple-800";
        blockLabel = "Prep. Mat.";
      } else {
        colorClasses = "bg-slate-100 border-slate-400 text-slate-800";
        blockLabel = apt.block_type.replace('_', ' ');
      }
    } else {
      switch (apt.status) {
        case 'completed':
          colorClasses = "bg-green-100 border-green-500 text-green-800";
          break;
        case 'confirmed':
          colorClasses = "bg-blue-100 border-blue-500 text-blue-800";
          break;
        case 'canceled':
        case 'cancelled':
          colorClasses = "bg-red-100 border-red-400 text-red-700 opacity-60";
          break;
        case 'no-show':
          colorClasses = "bg-amber-900/10 border-amber-800 text-amber-900";
          break;
        default: // scheduled
          colorClasses = "bg-white border-gray-300 text-gray-800";
      }
    }

    return (
      <TooltipProvider key={apt.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, apt)}
              style={style}
              className={cn(
                "absolute inset-x-1 rounded-md text-xs p-1.5 cursor-grab active:cursor-grabbing transition-all",
                "hover:brightness-95 hover:shadow-md overflow-hidden",
                "border-l-4 shadow-sm group",
                isDraggingThis ? "opacity-40" : "opacity-100",
                colorClasses,
                // Spec 028 US5: override del color del borde IZQUIERDO por dentista
                // (los otros 3 lados quedan con el color del status).
                dentistColor?.border
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (!isDraggingThis) onAppointmentClick?.(apt);
              }}
            >
              <div className="flex justify-between items-start">
                <div className="font-bold truncate leading-tight text-[11px]">
                  {patientName}
                </div>
                <GripVertical className="h-3 w-3 opacity-0 group-hover:opacity-50 flex-shrink-0" />
              </div>
              {/* Línea 2: procedimiento (servicio) o tipo de bloque.
                  Si no hay servicio definido, mostrar "Sin procedimiento" en italic. */}
              {apt.block_type ? (
                <div className="text-[10px] opacity-80 truncate mt-0.5">
                  {blockLabel}
                </div>
              ) : apt.service?.service_name ? (
                <div className="text-[10px] opacity-80 truncate mt-0.5">
                  {apt.service.service_name}
                </div>
              ) : (
                <div className="text-[10px] opacity-60 italic truncate mt-0.5">
                  Sin procedimiento
                </div>
              )}
              {/* Footer: signo de exclamación si la cita tiene nota.
                  La nota completa aparece en el tooltip on hover. */}
              {!apt.block_type && apt.notes && apt.notes.trim().length > 0 && (
                <div className="flex items-center gap-1 mt-0.5 text-[10px] opacity-90">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">Nota</span>
                </div>
              )}
              {/* Spec 028 US5 FR-005: footer con apellido del dentista responsable.
                  Solo se muestra si hay más de un dentista en la org (sino es ruido). */}
              {!apt.block_type && dentists.length > 1 && dentistLastName && (
                <div className={cn("text-[10px] mt-0.5 truncate font-medium", dentistColor?.text || 'text-gray-600')}>
                  Dr. {dentistLastName}
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="font-semibold">{patientName}</p>
            <p className="text-xs">{apt.start_time?.substring(0, 5)} - {apt.end_time?.substring(0, 5)} ({apt.duration_minutes || 60} min)</p>
            {apt.block_type && <p className="text-xs font-medium mt-1">Bloque: {blockLabel}</p>}
            {!apt.block_type && (
              <p className="text-xs">
                <span className="font-medium">Procedimiento:</span>{' '}
                {apt.service?.service_name || <span className="italic opacity-70">Sin procedimiento</span>}
              </p>
            )}
            {apt.clinic_id && <p className="text-xs text-muted-foreground">{getClinicName(apt.clinic_id)}</p>}
            {/* Spec 028 US5: dentista responsable en el tooltip */}
            {!apt.block_type && dentistName && (
              <p className="text-xs">
                <span className="font-medium">Dentista:</span> Dr. {dentistName}
              </p>
            )}
            {!apt.block_type && apt.notes && apt.notes.trim().length > 0 && (
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-xs font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Nota:
                </p>
                <p className="text-xs whitespace-pre-wrap mt-0.5">{apt.notes}</p>
              </div>
            )}
            <p className="text-xs text-blue-500 mt-1">Arrastra para reprogramar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderBlockedTime = (block, dateStr, timeStr) => {
    const blockStart = new Date(block.start_time);
    const blockStartTime = format(blockStart, 'HH:mm');
    if (timeStr !== blockStartTime) return null;

    const start = parseISO(block.start_time);
    const end = parseISO(block.end_time);
    const diffMins = (end - start) / 60000;
    const heightSlots = Math.ceil(diffMins / slotMinutes);
    const isDraggingThis = draggedBlock?.id === block.id;

    // Spec 028 multi-dentista: detectar modo "Todos los dentistas".
    // En ese modo el bloqueo se renderiza como banda LATERAL FINA con color del
    // dentista propietario. El slot queda clickable para agendar con OTRO dentista.
    // En modo single-dentista (filtro activo), el bloqueo ocupa todo el slot (legacy).
    const isMultiMode = selectedClinic === 'all';
    const dentistColor = isMultiMode ? getDentistColor(block.therapist_id, dentists) : null;
    const dentistName = isMultiMode
      ? (dentists.find((d) => d.id === block.therapist_id)?.full_name || '')
      : '';
    // Convención chilena: tomamos el APELLIDO PATERNO (segundo token del nombre completo,
    // ej. "Cristobal Tagle Morales" → "Tagle"). Si solo hay 2 tokens (nombre + paterno),
    // también funciona. Edge case: nombres compuestos como "Maria José" → tomaría "José",
    // aceptable como tradeoff vs el bug de "Dr. Morales" (apellido materno).
    const nameTokens = dentistName.split(' ').filter(Boolean);
    const dentistLastName = nameTokens[1] || nameTokens[0] || dentistName;

    const style = { height: `${heightSlots * 32}px`, zIndex: 10 };

    if (isMultiMode) {
      // Modo Todos: banda lateral 6px ancho. Slot CLICKABLE (parent maneja click cita).
      // pointer-events-none → el slot subyacente recibe el click.
      return (
        <TooltipProvider key={block.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                style={style}
                className={cn(
                  "absolute left-0 top-0 w-1.5 rounded-r pointer-events-auto cursor-help",
                  dentistColor?.border?.replace('border-l-', 'bg-') || 'bg-red-400'
                )}
                onClick={(e) => e.stopPropagation()}
              />
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-semibold text-red-600 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Bloqueado — Dr. {dentistLastName}
              </p>
              <p className="text-xs mt-1">{block.reason || 'Sin motivo especificado'}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Podés agendar con otro dentista en este horario.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Modo single-dentista (filtro activo): comportamiento legacy. Ocupa todo el slot.
    return (
      <TooltipProvider key={block.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              draggable
              onDragStart={(e) => handleBlockDragStart(e, block)}
              style={style}
              className={cn(
                "absolute inset-x-1 bg-red-50 border border-red-200 border-dashed rounded-md p-1 cursor-grab active:cursor-grabbing hover:bg-red-100 group",
                isDraggingThis ? "opacity-40" : "opacity-100"
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (!isDraggingThis) onBlockedTimeClick?.(block);
              }}
            >
              <div className="flex items-center justify-between h-full">
                <div className="flex items-center gap-1 text-red-500 text-[10px] font-medium">
                  <AlertCircle className="h-3 w-3" />
                  <span>Bloqueado</span>
                </div>
                <GripVertical className="h-3 w-3 text-red-300 opacity-0 group-hover:opacity-100 flex-shrink-0" />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold text-red-600">Horario Bloqueado</p>
            <p className="text-xs">{block.reason || 'Sin motivo especificado'}</p>
            <p className="text-xs text-red-400 mt-1">Arrastra para mover</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando agenda...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden select-none"
      onMouseUp={handleSlotMouseUp}
      onMouseLeave={() => {
        if (isSelectingBlock.current) {
          isSelectingBlock.current = false;
          setBlockSelection(null);
        }
      }}
    >
      {/* Legend — simbología arriba, fuera del scroll horizontal para que
          siempre quede visible aunque el usuario scrollee la grilla en mobile. */}
      <div className="border-b bg-white px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-white border border-gray-300 rounded" />
          <span>Programada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-blue-100 border-l-2 border-blue-500 rounded" />
          <span>Confirmada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-green-100 border-l-2 border-green-500 rounded" />
          <span>Completada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-red-100 border-l-2 border-red-400 rounded" />
          <span>Cancelada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-amber-900/10 border-l-2 border-amber-800 rounded" />
          <span>Ausente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-red-50 border border-dashed border-red-300 rounded" />
          <span>Bloqueado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-rose-50 border border-rose-200 rounded" />
          <span className="text-rose-600">Feriado</span>
        </div>
      </div>

      {/* Scrollable wrapper for mobile.
          Mobile: scroll horizontal con momentum iOS + hint visual en borde derecho.
          min-w 720px = ~85px/columna (8 cols), suficiente para leer cards sin
          truncar tanto. */}
      <div
        className="overflow-x-auto relative"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Scroll hint: gradiente sutil a la derecha que sugiere "hay más" */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white/80 to-transparent md:hidden z-10" />
      <div className="min-w-[720px]">
      {/* Header with days. Columna de horas angosta (50px) — el resto se
          reparte equitativamente entre los 7 días. */}
      <div className="grid grid-cols-[50px_repeat(7,1fr)] border-b bg-gray-50/80 sticky top-0 z-30">
        <div className="p-2 border-r bg-gray-50 sticky left-0 z-40" />
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const hasAvailability = availabilityMap[dateStr] && Object.values(availabilityMap[dateStr]).some(s => s.available);
          // Get the clinic for this day from availability data
          const dayClinicId = availabilityMap[dateStr]
            ? Object.values(availabilityMap[dateStr]).find(s => s.clinicId)?.clinicId
            : null;
          const clinicColor = getClinicColor(dayClinicId, clinics);
          const holidayName = getHolidayName(day);

          return (
            <div
              key={dateStr}
              title={holidayName ? `Feriado: ${holidayName}` : undefined}
              className={cn(
                "p-2 text-center border-r last:border-r-0",
                // Priority: hoy > feriado > clínica > default
                isToday(day)
                  ? "bg-blue-50"
                  : holidayName
                    ? "bg-rose-50"
                    : clinicColor ? clinicColor.bg : "bg-gray-50/50"
              )}
            >
              <div className={cn(
                "text-xs font-semibold uppercase",
                holidayName && !isToday(day) ? "text-rose-600" : "text-gray-500"
              )}>
                {format(day, 'EEE', { locale: es })}
              </div>
              <div className={cn(
                "text-lg font-bold w-8 h-8 flex items-center justify-center mx-auto rounded-full mt-1",
                isToday(day)
                  ? "bg-blue-600 text-white"
                  : holidayName
                    ? "text-rose-700"
                    : "text-gray-900"
              )}>
                {format(day, 'd')}
              </div>
              {/* Si es feriado, mostrar el nombre (truncado) en lugar del
                  dot de disponibilidad. El feriado es info más relevante
                  para planificar la semana. */}
              {holidayName ? (
                <div
                  className="mt-1 text-[9px] font-medium text-rose-600 leading-tight truncate px-0.5"
                  title={holidayName}
                >
                  {holidayName}
                </div>
              ) : hasAvailability && clinicColor ? (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <div className={cn("w-2 h-2 rounded-full", clinicColor.dot)} title={clinics.find(c => c.id === dayClinicId)?.name} />
                </div>
              ) : hasAvailability ? (
                <div className="w-2 h-2 bg-green-400 rounded-full mx-auto mt-1" title="Tiene disponibilidad" />
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Time grid. La columna de horas es sticky left:0 para que las
          horas (08:00, 09:00...) sigan visibles al scrollear horizontal.
          OJO: NO usar overflow-y-auto en este wrapper — crea un
          containing block que rompe el sticky horizontal. El scroll
          vertical pasa al nivel de página (más natural en mobile). */}
      <div className="flex-1">
        <div className="grid grid-cols-[50px_repeat(7,1fr)]">
          <div className="border-r bg-gray-50 sticky left-0 z-20">
            {timeSlots.map((time, idx) => (
              <div
                key={time}
                className={cn(
                  "h-8 px-2 text-xs font-medium text-gray-400 text-right flex items-center justify-end",
                  idx % 2 === 0 ? "border-t border-gray-100" : ""
                )}
              >
                {idx % 2 === 0 ? time : ''}
              </div>
            ))}
          </div>

          {weekDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isDayHoliday = !!getHolidayName(day);

            return (
              <div key={dateStr} className="border-r last:border-r-0 relative">
                {timeSlots.map((timeStr, idx) => {
                  const isAvailable = isSlotAvailable(dateStr, timeStr);
                  const hasAvailabilityForDate = availabilityMap[dateStr] && Object.keys(availabilityMap[dateStr]).length > 0;
                  const appointment = getAppointmentForSlot(dateStr, timeStr);
                  const blockedTime = getBlockedTimeForSlot(dateStr, timeStr);
                  const isHalfHour = idx % 2 === 1;
                  // Slot clickeable: sin cita siempre. Si hay bloqueo:
                  //  - modo single-dentista (filtro activo): bloqueo ocupa todo
                  //    el slot → NO clickable (legacy).
                  //  - modo "Todos los dentistas": bloqueo es banda lateral →
                  //    slot SIGUE clickable (la asistente puede agendar con
                  //    otro dentista que no esté bloqueado).
                  const isMultiMode = selectedClinic === 'all';
                  const isClickable = !appointment && (!blockedTime || isMultiMode);

                  const isDragOver = dragOverSlot?.date === dateStr && dragOverSlot?.time === timeStr;
                  const draggedItem = draggedApt || draggedBlock;
                  const dragDuration = draggedApt
                    ? (draggedApt.duration_minutes || 60)
                    : (draggedBlock?.duration || 30);
                  const canDropHere = draggedItem
                    ? isRangeAvailableForDrop(dateStr, timeStr, dragDuration, draggedItem.id, !!draggedBlock)
                    : false;

                  const inBlockSelection = isSlotInBlockSelection(dateStr, timeStr);

                  return (
                    <div
                      key={`${dateStr}-${timeStr}`}
                      className={cn(
                        "h-8 relative transition-colors",
                        isHalfHour ? "border-t border-dashed border-gray-100" : "border-t border-gray-200",
                        // TODOS los slots vacíos se ven verdes (uniforme).
                        // Antes distinguíamos "con availability config" (verde)
                        // vs "sin config pero clickeable" (blanco), pero como
                        // cualquier slot vacío es clickeable (el dentista puede
                        // agendar excepciones), la distinción solo confundía.
                        isClickable
                          ? "bg-green-50/50 hover:bg-green-100/70"
                          : "bg-gray-100/50",
                        // Hoy: tinte azul sutil que pisa el verde
                        isToday(day) && isClickable && "bg-blue-50/50 hover:bg-blue-100/70",
                        // Feriado: tinte rosa sutil que pisa el verde (pero no a hoy)
                        isDayHoliday && isClickable && !isToday(day) && "bg-rose-50/50 hover:bg-rose-100/60",
                        isDragOver && canDropHere && "bg-blue-200 !important ring-2 ring-inset ring-blue-400 z-30",
                        isDragOver && !canDropHere && "bg-red-100 !important ring-2 ring-inset ring-red-400 z-30",
                        inBlockSelection && "!bg-red-100/70 ring-1 ring-inset ring-red-300"
                      )}
                      onClick={() => handleSlotClick(day, timeStr)}
                      onMouseDown={(e) => isClickable && handleSlotMouseDown(e, dateStr, timeStr)}
                      onMouseEnter={() => handleSlotMouseEnter(dateStr, timeStr)}
                      onDragOver={(e) => handleDragOver(e, dateStr, timeStr)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, dateStr, timeStr)}
                    >
                      {appointment && renderAppointment(appointment, dateStr, timeStr)}
                      {!appointment && blockedTime && renderBlockedTime(blockedTime, dateStr, timeStr)}
                      {isClickable && !draggedItem && !inBlockSelection && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                          <span className="text-green-600 text-lg font-light">+</span>
                        </div>
                      )}
                      {inBlockSelection && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-red-500 text-[10px] font-medium">Bloquear</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      </div>{/* close min-w-[640px] */}
      </div>{/* close overflow-x-auto */}
    </div>
  );
};

export default WeeklyAgendaView;
