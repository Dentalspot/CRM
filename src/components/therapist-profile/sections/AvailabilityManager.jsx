import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Trash2, Loader2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const DAY_TO_NUMBER = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 0 };
const NUMBER_TO_DAY = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo' };
const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2).toString().padStart(2, '0');
  const minute = (i % 2 === 0) ? '00' : '30';
  const time = `${hour}:${minute}`;
  return { value: time, label: time };
});

const AvailabilityManager = ({ clinicId, clinicModality }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newAvailability, setNewAvailability] = useState({
    day: 'Lunes',
    startTime: '09:00',
    endTime: '17:00',
  });

  const loadAvailability = useCallback(async () => {
    if (!user?.id || !clinicId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('therapist_availabilities')
        .select('*')
        .eq('therapist_id', user.id)
        .eq('clinic_id', clinicId);

      if (error) throw error;

      setAvailabilities(data.map(a => ({
        id: a.id,
        day: NUMBER_TO_DAY[a.day_of_week],
        startTime: a.start_time,
        endTime: a.end_time,
        is_new: false,
      })));
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cargar la disponibilidad.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user?.id, clinicId, toast]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  const handleInputChange = (field, value) => {
    setNewAvailability(prev => ({ ...prev, [field]: value }));
  };

  const addAvailability = () => {
    if (!newAvailability.day || !newAvailability.startTime || !newAvailability.endTime) {
      toast({ title: '¡Faltan datos!', description: 'Completa todos los campos.', variant: 'destructive' });
      return;
    }
    if (newAvailability.startTime >= newAvailability.endTime) {
      toast({ title: '¡Horario inválido!', description: 'La hora de fin debe ser posterior a la de inicio.', variant: 'destructive' });
      return;
    }

    setAvailabilities(prev => [
      ...prev,
      { ...newAvailability, id: `new-${Date.now()}`, is_new: true },
    ]);
  };

  const removeAvailability = (id) => {
    setAvailabilities(prev => prev.filter(a => a.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Defensive check before saving
      const invalidSlots = availabilities.filter(a => a.startTime >= a.endTime);
      if (invalidSlots.length > 0) {
        throw new Error(`Hay horarios inválidos (Inicio >= Fin). Por favor corrígelos.`);
      }

      // Borrar horarios existentes para esta clínica
      const { error: deleteError } = await supabase
        .from('therapist_availabilities')
        .delete()
        .eq('clinic_id', clinicId);
      if (deleteError) throw deleteError;

      // Insertar nuevos horarios
      if (availabilities.length > 0) {
        const schedulesToInsert = availabilities.map(slot => ({
          clinic_id: clinicId,
          therapist_id: user.id,
          day_of_week: DAY_TO_NUMBER[slot.day],
          start_time: slot.startTime,
          end_time: slot.endTime,
          is_active: true,
          modality: clinicModality, // Sin condicional
        }));
        const { error: insertError } = await supabase.from('therapist_availabilities').insert(schedulesToInsert);
        if (insertError) throw insertError;
      }

      toast({ title: '✅ ¡Guardado!', description: 'Los horarios para esta clínica se han actualizado.' });
      await loadAvailability();
    } catch (error) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-xl font-bold">Gestionar Disponibilidad</CardTitle>
          <CardDescription>Define tus horarios de atención para esta clínica.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="day">Día</Label>
              <Select onValueChange={(value) => handleInputChange('day', value)} value={newAvailability.day}>
                <SelectTrigger id="day"><SelectValue placeholder="Día" /></SelectTrigger>
                <SelectContent>{daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="start-time">Inicio</Label>
              <Select onValueChange={(value) => handleInputChange('startTime', value)} value={newAvailability.startTime}>
                <SelectTrigger id="start-time"><SelectValue placeholder="Inicio" /></SelectTrigger>
                <SelectContent>{timeOptions.map(time => <SelectItem key={time.value} value={time.value}>{time.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="end-time">Fin</Label>
              <Select onValueChange={(value) => handleInputChange('endTime', value)} value={newAvailability.endTime}>
                <SelectTrigger id="end-time"><SelectValue placeholder="Fin" /></SelectTrigger>
                <SelectContent>{timeOptions.map(time => <SelectItem key={time.value} value={time.value}>{time.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={addAvailability} className="w-full"><PlusCircle className="mr-2 h-5 w-5" /> Añadir Franja</Button>

          <h3 className="text-lg font-semibold pt-4">Horarios Actuales</h3>
          {loading ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> : (
            availabilities.length === 0 ? (
              <p className="text-muted-foreground text-center">No hay horarios configurados.</p>
            ) : (
              <div className="space-y-2">
                {availabilities.map(slot => (
                  <div key={slot.id} className="flex justify-between items-center p-2 bg-muted rounded-md">
                    <span>{slot.day}: {slot.startTime} - {slot.endTime}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeAvailability(slot.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            )
          )}

          <div className="mt-8 pt-6 border-t">
            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar Horarios de la Clínica
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AvailabilityManager;