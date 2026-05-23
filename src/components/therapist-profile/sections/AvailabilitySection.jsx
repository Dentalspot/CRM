import React, { useState, useEffect, useCallback } from 'react';
import ProfileSectionCard from '@/components/therapist-profile/ProfileSectionCard';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import TimePicker from '@/components/ui/time-picker';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, XCircle, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

const DAY_TO_NUMBER = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 0 };
const NUMBER_TO_DAY = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo' };
const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const AvailabilitySection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [availability, setAvailability] = useState([{ day: '', startTime: '', endTime: '' }]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadAvailability = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('therapist_availabilities')
        .select('*')
        .eq('therapist_id', user.id)
        .is('clinic_id', null); // Horarios online/generales

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedAvail = data.map(a => ({
          id: a.id,
          day: NUMBER_TO_DAY[a.day_of_week] || '',
          startTime: a.start_time || '',
          endTime: a.end_time || '',
        }));
        setAvailability(formattedAvail);
      } else {
        setAvailability([{ day: '', startTime: '', endTime: '' }]);
      }
    } catch (error) {
      logger.error('Error cargando disponibilidad:', error);
      toast({ variant: "destructive", title: "Error al cargar", description: "No se pudo cargar la disponibilidad." });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  const handleChange = (index, field, value) => {
    const newAvailability = [...availability];
    newAvailability[index][field] = value;
    setAvailability(newAvailability);
  };

  const addSlot = () => {
    setAvailability([...availability, { day: '', startTime: '', endTime: '' }]);
  };

  const removeSlot = (index) => {
    setAvailability(availability.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const validSlots = availability.filter(slot => slot.day && slot.startTime && slot.endTime);
      
      // Validation: Check time range to prevent DB constraint violation
      const invalidTimeSlots = validSlots.filter(slot => slot.startTime >= slot.endTime);
      if (invalidTimeSlots.length > 0) {
        throw new Error("La hora de inicio debe ser anterior a la hora de fin en todos los horarios.");
      }

      const schedulesToSave = validSlots.map(slot => ({
        therapist_id: user.id,
        clinic_id: null,
        day_of_week: DAY_TO_NUMBER[slot.day],
        start_time: slot.startTime,
        end_time: slot.endTime,
        modality: 'online', // Asumimos online para disponibilidad general
        is_active: true,
      }));

      // Borrar horarios online anteriores
      const { error: deleteError } = await supabase
          .from('therapist_availabilities')
          .delete()
          .eq('therapist_id', user.id)
          .is('clinic_id', null);

      if(deleteError) throw deleteError;

      // Insertar nuevos horarios
      if (schedulesToSave.length > 0) {
        const { error: insertError } = await supabase
            .from('therapist_availabilities')
            .insert(schedulesToSave);
        
        if (insertError) throw insertError;
      }

      toast({
        title: "✅ Horarios guardados",
        description: "Tu disponibilidad online se ha actualizado.",
      });
      loadAvailability();
    } catch (error) {
      logger.error('Error guardando disponibilidad:', error);
      toast({ variant: "destructive", title: "Error al guardar", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <ProfileSectionCard title="Disponibilidad Online" description="Cargando...">
        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </ProfileSectionCard>
    );
  }

  return (
    <ProfileSectionCard
      id="availability"
      title="Disponibilidad para Consultas Online"
      description="Configura tus horarios para atenciones virtuales. Estos horarios no están asociados a una clínica física."
    >
      {availability.map((slot, index) => (
        <div key={index} className="p-4 border rounded-md mb-4 space-y-4 bg-background/50 relative">
          {availability.length > 1 && (
            <Button type="button" variant="ghost" size="icon" onClick={() => removeSlot(index)} className="absolute top-2 right-2 text-destructive hover:text-destructive/80">
              <XCircle className="h-5 w-5" />
            </Button>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor={`day-${index}`}>Día de la Semana</Label>
              <Select value={slot.day} onValueChange={(value) => handleChange(index, 'day', value)}>
                <SelectTrigger id={`day-${index}`} className="w-full text-foreground"><SelectValue placeholder="Selecciona un día" /></SelectTrigger>
                <SelectContent>{daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Hora Inicio</Label>
              <TimePicker value={slot.startTime} onChange={(v) => handleChange(index, 'startTime', v)} />
            </div>
            <div>
              <Label>Hora Fin</Label>
              <TimePicker value={slot.endTime} onChange={(v) => handleChange(index, 'endTime', v)} />
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addSlot} className="mt-4"><PlusCircle className="mr-2 h-4 w-4" /> Añadir Horario</Button>
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || loading}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar Horarios Online
        </Button>
      </div>
    </ProfileSectionCard>
  );
};

export default AvailabilitySection;