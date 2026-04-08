/**
 * BlockTimeModal.jsx
 * 
 * Modal unificado para bloquear y desbloquear horarios.
 * - Modo "block": Crear nuevo bloqueo
 * - Modo "unblock": Ver y eliminar bloqueo existente
 */

import React, { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Ban,
  Unlock,
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  Trash2,
  MapPin
} from 'lucide-react';
import { format, set, parseISO } from 'date-fns';
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

const BlockTimeModal = ({
  isOpen,
  onOpenChange,
  clinics = [],
  selectedClinic = 'all',
  // Para modo bloqueo desde slot
  slotInfo = null,
  // Para modo desbloqueo (editar/eliminar)
  blockedTime = null,
  // Callbacks
  onSuccess
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Determinar modo
  const mode = blockedTime ? 'unblock' : 'block';
  const isUnblockMode = mode === 'unblock';

  // Estados del formulario
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [reason, setReason] = useState('otro');
  const [customReason, setCustomReason] = useState('');
  const [clinicId, setClinicId] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar valores según modo
  useEffect(() => {
    if (!isOpen) return;

    if (isUnblockMode && blockedTime) {
      // Modo desbloqueo: cargar datos del bloqueo existente
      const blockStart = new Date(blockedTime.start_time);
      const blockEnd = new Date(blockedTime.end_time);

      setStartDate(blockStart);
      setEndDate(blockEnd);
      setStartTime(format(blockStart, 'HH:mm'));
      setEndTime(format(blockEnd, 'HH:mm'));
      setClinicId(blockedTime.clinic_id || 'all');

      // Determinar el reason
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
      // Modo bloqueo desde slot del calendario
      const slotDate = slotInfo.date ? parseISO(slotInfo.date) : new Date();
      setStartDate(slotDate);
      setEndDate(slotDate);
      setStartTime(slotInfo.startTime || '09:00');
      setEndTime(slotInfo.endTime || '10:00');
      setClinicId(slotInfo.clinicId || selectedClinic || 'all');
      setReason('otro');
      setCustomReason('');
    } else {
      // Modo bloqueo desde cero
      setStartDate(new Date());
      setEndDate(new Date());
      setStartTime('09:00');
      setEndTime('18:00');
      setClinicId(selectedClinic || 'all');
      setReason('vacaciones');
      setCustomReason('');
    }
  }, [isOpen, blockedTime, slotInfo, selectedClinic, isUnblockMode]);

  const handleClose = () => {
    onOpenChange(false);
  };

  // Crear bloqueo
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

    // Validar fechas
    const startDateTime = set(startDate, {
      hours: parseInt(startTime.split(':')[0]),
      minutes: parseInt(startTime.split(':')[1]),
      seconds: 0,
      milliseconds: 0,
    });

    const endDateTime = set(endDate, {
      hours: parseInt(endTime.split(':')[0]),
      minutes: parseInt(endTime.split(':')[1]),
      seconds: 0,
      milliseconds: 0,
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
      // Determinar clínicas a bloquear
      const clinicsToBlock = clinicId === 'all'
        ? clinics.map(c => c.id)
        : [clinicId];

      const blocksToInsert = [];

      if (clinicsToBlock.length === 0) {
        // Sin clínicas - bloqueo general
        blocksToInsert.push({
          therapist_id: user.id,
          clinic_id: null,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          reason: finalReason,
        });
      } else {
        // Con clínicas
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
      toast({
        variant: 'destructive',
        title: 'Error al bloquear',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar bloqueo
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
      toast({
        variant: 'destructive',
        title: 'Error al desbloquear',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Actualizar bloqueo existente
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
      seconds: 0,
      milliseconds: 0,
    });

    const endDateTime = set(endDate, {
      hours: parseInt(endTime.split(':')[0]),
      minutes: parseInt(endTime.split(':')[1]),
      seconds: 0,
      milliseconds: 0,
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
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description: error.message,
      });
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
      <DialogContent className="sm:max-w-[500px]">
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

          {/* Motivo personalizado */}
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

          {/* Resumen */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="text-gray-600">
              <strong>Resumen:</strong> Bloqueo desde{' '}
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
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isUnblockMode ? (
            <>
              {/* Modo desbloqueo: Eliminar, Actualizar, Cancelar */}
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
              {/* Modo bloqueo: Cancelar, Bloquear */}
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateBlock}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Ban className="mr-2 h-4 w-4" />
                )}
                Bloquear Horario
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BlockTimeModal;