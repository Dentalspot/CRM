import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import { format, addDays, isSameDay, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabaseClient';
import { getTherapistAvailability } from '@/features/therapist/services/therapist.api';
import TimeSlotPicker from '@/components/calendar/TimeSlotPicker';
import logger from '@/lib/utils/logger';

const RescheduleModal = ({ isOpen, onClose, appointment, onRescheduled }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [availability, setAvailability] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const therapistId = appointment?.therapist_id;
  const clinicId = appointment?.clinic_id || null;

  // Fetch 7 days of availability starting from weekOffset
  const fetchAvailability = useCallback(async () => {
    if (!therapistId) return;
    setLoading(true);
    try {
      const startDate = format(addDays(new Date(), weekOffset * 7), 'yyyy-MM-dd');
      const data = await getTherapistAvailability(therapistId, clinicId, startDate, 7);
      setAvailability(data || []);
    } catch (err) {
      logger.error('Error fetching availability:', err);
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  }, [therapistId, clinicId, weekOffset]);

  useEffect(() => {
    if (isOpen) {
      setDone(false);
      setSelectedDate(null);
      setSelectedTime(null);
      setWeekOffset(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && therapistId) {
      fetchAvailability();
    }
  }, [isOpen, therapistId, fetchAvailability]);

  // Get available dates (those with at least one slot)
  const availableDates = availability.filter(d => {
    const slots = d.time_slots || [];
    return slots.some(s => (typeof s === 'object' ? s.available : true));
  });

  // Get slots for selected date
  const slotsForDate = selectedDate
    ? availability.find(d => d.availability_date === selectedDate)?.time_slots?.filter(
        s => (typeof s === 'object' ? s.available : true)
      ) || []
    : [];

  const handleSave = async () => {
    if (!selectedDate || !selectedTime || !appointment?.id) return;
    setSaving(true);
    try {
      const timeValue = typeof selectedTime === 'object' ? selectedTime.time : selectedTime;

      // Calculate end_time from duration
      const duration = appointment.duration_minutes || 30;
      const [h, m] = timeValue.split(':').map(Number);
      const endMinutes = h * 60 + m + duration;
      const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

      const { error } = await supabase
        .from('appointments')
        .update({
          date: selectedDate,
          start_time: timeValue,
          end_time: endTime,
          status: 'scheduled',
        })
        .eq('id', appointment.id);

      if (error) throw error;

      setDone(true);
      if (onRescheduled) onRescheduled();
    } catch (err) {
      logger.error('Error rescheduling:', err);
    } finally {
      setSaving(false);
    }
  };

  const startDate = addDays(new Date(), weekOffset * 7);
  const endDate = addDays(startDate, 6);
  const weekLabel = `${format(startDate, "d MMM", { locale: es })} – ${format(endDate, "d MMM", { locale: es })}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {done ? '¡Cita reprogramada!' : 'Reprogramar cita'}
          </DialogTitle>
          {!done && (
            <DialogDescription>
              Selecciona una nueva fecha y hora disponible
            </DialogDescription>
          )}
        </DialogHeader>

        {done ? (
          <div className="text-center py-8 space-y-3">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <p className="text-lg font-semibold">Tu cita ha sido reprogramada</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(`${selectedDate}T12:00`), "EEEE d 'de' MMMM", { locale: es })} a las{' '}
              {typeof selectedTime === 'object' ? selectedTime.time : selectedTime} hrs
            </p>
            <Button onClick={onClose} className="mt-4">Cerrar</Button>
          </div>
        ) : (
          <>
            {/* Week navigation */}
            <div className="flex items-center justify-between py-2">
              <Button
                variant="ghost" size="icon"
                onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                disabled={weekOffset === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium capitalize">{weekLabel}</span>
              <Button
                variant="ghost" size="icon"
                onClick={() => setWeekOffset(weekOffset + 1)}
                disabled={weekOffset >= 3}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Date pills */}
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : availableDates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No hay horarios disponibles esta semana. Prueba la siguiente.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {availableDates.map(d => {
                  const dateObj = new Date(`${d.availability_date}T12:00`);
                  const isSelected = selectedDate === d.availability_date;
                  return (
                    <Button
                      key={d.availability_date}
                      variant={isSelected ? 'default' : 'outline'}
                      className="flex flex-col h-auto py-2 text-xs"
                      onClick={() => {
                        setSelectedDate(d.availability_date);
                        setSelectedTime(null);
                      }}
                    >
                      <span className="capitalize">{format(dateObj, 'EEE', { locale: es })}</span>
                      <span className="font-bold text-sm">{format(dateObj, 'd')}</span>
                    </Button>
                  );
                })}
              </div>
            )}

            {/* Time slots */}
            {selectedDate && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2 capitalize">
                  Horarios para {format(new Date(`${selectedDate}T12:00`), "EEEE d", { locale: es })}
                </p>
                <TimeSlotPicker
                  availableSlots={slotsForDate}
                  selectedTime={typeof selectedTime === 'object' ? selectedTime?.time : selectedTime}
                  onTimeSelect={setSelectedTime}
                />
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button
                onClick={handleSave}
                disabled={!selectedDate || !selectedTime || saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirmar cambio
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleModal;
