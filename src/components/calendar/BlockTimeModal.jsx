/**
 * BlockTimeModal.jsx
 *
 * Modal unificado para bloquear y desbloquear horarios.
 * - Modo "block": Crear nuevo bloqueo (con opción de repetir semanalmente)
 * - Modo "unblock": Ver y eliminar bloqueo existente
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Ban,
  Unlock,
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  Trash2,
  MapPin,
  Repeat
} from 'lucide-react';
import { format, set, parseISO, addDays, startOfMonth, endOfMonth, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/utils/logger';
import { useToast } from '@/components/ui/use-toast';

const BLOCK_REASONS = [
  { value: 'vacaciones', label: 'Vacaciones' },
  { value: 'congreso', label: 'Congreso/Curso' },
  { value: 'tramite', label: 'Trámite personal' },
  { value: 'medico', label: 'Cita médica' },
  { value: 'reunion', label: 'Reunión administrativa' },
  { value: 'almuerzo', label: 'Horario de almuerzo' },
  { value: 'otro', label: 'Otro (especificar)' },
];

const DAY_LABELS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
];

const BlockTimeModal = ({
  isOpen,
  onOpenChange,
  clinics = [],
  selectedClinic = 'all',
  slotInfo = null,
  blockedTime = null,
  onSuccess
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const mode = blockedTime ? 'unblock' : 'block';
  const isUnblockMode = mode === 'unblock';

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [reason, setReason] = useState('otro');
  const [customReason, setCustomReason] = useState('');
  const [clinicId, setClinicId] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recurring block state
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [repeatWeeks, setRepeatWeeks] = useState('4');

  useEffect(() => {
    if (!isOpen) return;

    // Reset recurring state
    setIsRecurring(false);
    setSelectedDays([]);
    setRepeatWeeks('4');

    if (isUnblockMode && blockedTime) {
      const blockStart = new Date(blockedTime.start_time);
      const blockEnd = new Date(blockedTime.end_time);

      setStartDate(blockStart);
      setEndDate(blockEnd);
      setStartTime(format(blockStart, 'HH:mm'));
      setEndTime(format(blockEnd, 'HH:mm'));
      setClinicId(blockedTime.clinic_id || 'all');

      const existingReason = blockedTime.reason?.toLowerCase() || '';
      const matchedReason = BLOCK_REASONS.find(r =>
        existingReason.includes(r.value) || r.label.toLowerCase() === existingReason
      );

      if (matchedReason && matchedReason.value !== 'otro') {
        setReason(matchedReason.value);
        setCustomReason('');
      } else {
        setReason('otro');
        setCustomReason(blockedTime.reason || '');
      }
    } else if (slotInfo) {
      const slotDate = slotInfo.date ? parseISO(slotInfo.date) : new Date();
      setStartDate(slotDate);
      setEndDate(slotDate);
      setStartTime(slotInfo.startTime || '09:00');
      setEndTime(slotInfo.endTime || '10:00');
      setClinicId(slotInfo.clinicId || selectedClinic || 'all');
      setReason('otro');
      setCustomReason('');

      // Pre-select the day of the week from slotInfo
      const dayOfWeek = slotDate.getDay();
      setSelectedDays([dayOfWeek]);
    } else {
      setStartDate(new Date());
      setEndDate(new Date());
      setStartTime('09:00');
      setEndTime('18:00');
      setClinicId(selectedClinic || 'all');
      setReason('vacaciones');
      setCustomReason('');
    }
  }, [isOpen, blockedTime, slotInfo, selectedClinic, isUnblockMode]);

  const toggleDay = (day) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  // Calculate recurring dates preview
  const recurringDates = useMemo(() => {
    if (!isRecurring || selectedDays.length === 0) return [];

    const weeks = parseInt(repeatWeeks) || 4;
    const dates = [];
    const baseDate = startDate;

    for (let w = 0; w < weeks; w++) {
      for (const dow of selectedDays) {
        // Find the next occurrence of this day of week from baseDate + w weeks
        const weekStart = addDays(baseDate, w * 7);
        const currentDow = weekStart.getDay();
        let diff = dow - currentDow;
        if (diff < 0) diff += 7;
        const targetDate = addDays(weekStart, diff);

        // Only include dates from startDate forward
        if (targetDate >= baseDate) {
          const dateStr = format(targetDate, 'yyyy-MM-dd');
          if (!dates.includes(dateStr)) {
            dates.push(dateStr);
          }
        }
      }
    }

    return dates.sort();
  }, [isRecurring, selectedDays, repeatWeeks, startDate]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleCreateBlock = async () => {
    const finalReason = reason === 'otro' ? customReason : BLOCK_REASONS.find(r => r.value === reason)?.label;

    if (!finalReason?.trim()) {
      toast({
        variant: 'destructive',
        title: 'Motivo requerido',
        description: 'Por favor especifica un motivo para el bloqueo.',
      });
      return;
    }

    // Determine dates to block
    let datesToBlock;
    if (isRecurring && recurringDates.length > 0) {
      datesToBlock = recurringDates;
    } else {
      // Single block: use startDate to endDate range
      const startDateTime = set(startDate, {
        hours: parseInt(startTime.split(':')[0]),
        minutes: parseInt(startTime.split(':')[1]),
        seconds: 0, milliseconds: 0,
      });
      const endDateTime = set(endDate, {
        hours: parseInt(endTime.split(':')[0]),
        minutes: parseInt(endTime.split(':')[1]),
        seconds: 0, milliseconds: 0,
      });

      if (endDateTime <= startDateTime) {
        toast({
          variant: 'destructive',
          title: 'Error de fechas',
          description: 'La fecha/hora de fin debe ser posterior a la de inicio.',
        });
        return;
      }

      // For non-recurring, insert as a single block (original behavior)
      setIsSubmitting(true);
      try {
        const clinicsToBlock = clinicId === 'all'
          ? clinics.map(c => c.id)
          : [clinicId];

        const blocksToInsert = [];

        if (clinicsToBlock.length === 0) {
          blocksToInsert.push({
            therapist_id: user.id,
            clinic_id: null,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            reason: finalReason,
          });
        } else {
          for (const cId of clinicsToBlock) {
            blocksToInsert.push({
              therapist_id: user.id,
              clinic_id: cId === 'all' ? null : cId,
              start_time: startDateTime.toISOString(),
              end_time: endDateTime.toISOString(),
              reason: finalReason,
            });
          }
        }

        const { error } = await supabase.from('blocked_times').insert(blocksToInsert);
        if (error) throw error;

        toast({
          title: '✅ Horario bloqueado',
          description: `Bloqueado desde ${format(startDateTime, 'PPp', { locale: es })} hasta ${format(endDateTime, 'PPp', { locale: es })}.`,
        });

        onSuccess?.();
        handleClose();
      } catch (error) {
        logger.error('Error blocking time:', error);
        toast({ variant: 'destructive', title: 'Error al bloquear', description: error.message });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Recurring blocks: create one block per date
    setIsSubmitting(true);
    try {
      const clinicsToBlock = clinicId === 'all'
        ? clinics.map(c => c.id)
        : [clinicId];

      const blocksToInsert = [];

      for (const dateStr of datesToBlock) {
        const blockStartTime = `${dateStr}T${startTime}:00`;
        const blockEndTime = `${dateStr}T${endTime}:00`;

        if (clinicsToBlock.length === 0) {
          blocksToInsert.push({
            therapist_id: user.id,
            clinic_id: null,
            start_time: blockStartTime,
            end_time: blockEndTime,
            reason: finalReason,
          });
        } else {
          for (const cId of clinicsToBlock) {
            blocksToInsert.push({
              therapist_id: user.id,
              clinic_id: cId === 'all' ? null : cId,
              start_time: blockStartTime,
              end_time: blockEndTime,
              reason: finalReason,
            });
          }
        }
      }

      const { error } = await supabase.from('blocked_times').insert(blocksToInsert);
      if (error) throw error;

      toast({
        title: '✅ Bloqueos creados',
        description: `Se crearon ${datesToBlock.length} bloqueos recurrentes.`,
      });

      onSuccess?.();
      handleClose();
    } catch (error) {
      logger.error('Error creating recurring blocks:', error);
      toast({ variant: 'destructive', title: 'Error al bloquear', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBlock = async () => {
    if (!blockedTime?.id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('blocked_times')
        .delete()
        .eq('id', blockedTime.id);

      if (error) throw error;

      toast({
        title: '✅ Horario desbloqueado',
        description: 'El horario está disponible nuevamente para agendar citas.',
      });

      onSuccess?.();
      handleClose();
    } catch (error) {
      logger.error('Error unblocking time:', error);
      toast({ variant: 'destructive', title: 'Error al desbloquear', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBlock = async () => {
    if (!blockedTime?.id) return;

    const finalReason = reason === 'otro' ? customReason : BLOCK_REASONS.find(r => r.value === reason)?.label;

    if (!finalReason?.trim()) {
      toast({
        variant: 'destructive',
        title: 'Motivo requerido',
        description: 'Por favor especifica un motivo para el bloqueo.',
      });
      return;
    }

    const startDateTime = set(startDate, {
      hours: parseInt(startTime.split(':')[0]),
      minutes: parseInt(startTime.split(':')[1]),
      seconds: 0, milliseconds: 0,
    });

    const endDateTime = set(endDate, {
      hours: parseInt(endTime.split(':')[0]),
      minutes: parseInt(endTime.split(':')[1]),
      seconds: 0, milliseconds: 0,
    });

    if (endDateTime <= startDateTime) {
      toast({
        variant: 'destructive',
        title: 'Error de fechas',
        description: 'La fecha/hora de fin debe ser posterior a la de inicio.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('blocked_times')
        .update({
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          reason: finalReason,
          clinic_id: clinicId === 'all' ? null : clinicId,
        })
        .eq('id', blockedTime.id);

      if (error) throw error;

      toast({
        title: '✅ Bloqueo actualizado',
        description: 'Los cambios han sido guardados.',
      });

      onSuccess?.();
      handleClose();
    } catch (error) {
      logger.error('Error updating block:', error);
      toast({ variant: 'destructive', title: 'Error al actualizar', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getClinicName = (cId) => {
    if (!cId || cId === 'all') return 'Todas las clínicas';
    return clinics.find(c => c.id === cId)?.name || 'Clínica';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={cn(
            "flex items-center gap-2",
            isUnblockMode ? "text-amber-700" : "text-red-700"
          )}>
            {isUnblockMode ? (
              <>
                <Unlock className="h-5 w-5" />
                Gestionar Bloqueo
              </>
            ) : (
              <>
                <Ban className="h-5 w-5" />
                Bloquear Horario
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isUnblockMode
              ? 'Puedes modificar o eliminar este bloqueo para liberar el horario.'
              : 'Bloquea un período de tiempo para evitar que se agenden citas.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info del bloqueo existente (modo unblock) */}
          {isUnblockMode && blockedTime && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-red-800 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Bloqueo actual</span>
              </div>
              <div className="text-sm text-red-700">
                {blockedTime.reason || 'Sin motivo especificado'}
              </div>
            </div>
          )}

          {/* Fechas */}
          {!isRecurring && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP", { locale: es }) : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Fecha de Fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP", { locale: es }) : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Horas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Hora de Inicio</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-time">Hora de Fin</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Clínica */}
          {clinics.length > 0 && (
            <div className="space-y-2">
              <Label>Clínica</Label>
              <Select value={clinicId} onValueChange={setClinicId}>
                <SelectTrigger>
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Seleccionar clínica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas mis clínicas</SelectItem>
                  {clinics.map(clinic => (
                    <SelectItem key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Motivo */}
          <div className="space-y-2">
            <Label>Motivo del bloqueo</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar motivo" />
              </SelectTrigger>
              <SelectContent>
                {BLOCK_REASONS.map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reason === 'otro' && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason">Especificar motivo</Label>
              <Textarea
                id="custom-reason"
                placeholder="Ej: Compromiso familiar, emergencia..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={2}
              />
            </div>
          )}

          {/* Recurring block section - only in block mode */}
          {!isUnblockMode && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-gray-500" />
                    <Label htmlFor="recurring-toggle" className="font-medium cursor-pointer">
                      Repetir bloqueo
                    </Label>
                  </div>
                  <Switch
                    id="recurring-toggle"
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                  />
                </div>

                {isRecurring && (
                  <div className="space-y-3 pl-6 border-l-2 border-red-100">
                    {/* Day selector */}
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">Días de la semana</Label>
                      <div className="flex gap-1.5">
                        {DAY_LABELS.map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => toggleDay(value)}
                            className={cn(
                              "w-10 h-10 rounded-full text-xs font-medium transition-colors",
                              selectedDays.includes(value)
                                ? "bg-red-500 text-white shadow-sm"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Weeks selector */}
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">Duración</Label>
                      <Select value={repeatWeeks} onValueChange={setRepeatWeeks}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 semana</SelectItem>
                          <SelectItem value="2">2 semanas</SelectItem>
                          <SelectItem value="3">3 semanas</SelectItem>
                          <SelectItem value="4">4 semanas (1 mes)</SelectItem>
                          <SelectItem value="6">6 semanas</SelectItem>
                          <SelectItem value="8">8 semanas (2 meses)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Preview dates */}
                    {recurringDates.length > 0 && (
                      <div className="bg-red-50/50 border border-red-100 rounded-lg p-3">
                        <p className="text-xs font-medium text-red-700 mb-2">
                          Se bloquearán {recurringDates.length} fechas:
                        </p>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {recurringDates.map(dateStr => (
                            <span
                              key={dateStr}
                              className="inline-block px-2 py-0.5 bg-white border border-red-200 rounded text-[11px] text-red-700"
                            >
                              {format(parseISO(dateStr), 'EEE d MMM', { locale: es })}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Resumen */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="text-gray-600">
              <strong>Resumen:</strong>{' '}
              {isRecurring && recurringDates.length > 0 ? (
                <>
                  {recurringDates.length} bloqueos de{' '}
                  <span className="font-medium text-gray-900">{startTime}</span> a{' '}
                  <span className="font-medium text-gray-900">{endTime}</span> en{' '}
                  <span className="font-medium text-gray-900">{getClinicName(clinicId)}</span>
                </>
              ) : (
                <>
                  Bloqueo desde{' '}
                  <span className="font-medium text-gray-900">
                    {format(startDate, "d MMM", { locale: es })} {startTime}
                  </span>
                  {' '}hasta{' '}
                  <span className="font-medium text-gray-900">
                    {format(endDate, "d MMM", { locale: es })} {endTime}
                  </span>
                  {' '}en{' '}
                  <span className="font-medium text-gray-900">
                    {getClinicName(clinicId)}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isUnblockMode ? (
            <>
              <Button
                variant="destructive"
                onClick={handleDeleteBlock}
                disabled={isSubmitting}
                className="sm:mr-auto"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Eliminar Bloqueo
              </Button>
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateBlock}
                disabled={isSubmitting}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateBlock}
                disabled={isSubmitting || (isRecurring && recurringDates.length === 0)}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Ban className="mr-2 h-4 w-4" />
                )}
                {isRecurring && recurringDates.length > 0
                  ? `Bloquear ${recurringDates.length} horarios`
                  : 'Bloquear Horario'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BlockTimeModal;
