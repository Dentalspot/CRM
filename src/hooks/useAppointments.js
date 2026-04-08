
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/utils/logger';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook para manejar las citas de un terapeuta o paciente.
 * Task 2 & 3 & 7: Se audita la consulta. Se incluye explícitamente service_id 
 * y se hace un join seguro con therapist_services si es necesario en el futuro.
 * La FK appointments.service_id -> therapist_services.id está garantizada.
 */
const useAppointments = (therapistId = null) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Obtener citas reservadas de un terapeuta
  const fetchAppointments = useCallback(async () => {
    const targetId = therapistId || user?.id;
    if (!targetId) return;

    setLoading(true);
    try {
      // Task 2 & 3: Se asegura de traer el service_id. Se puede expandir para hacer join con therapist_services
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          service:therapist_services(id, service_name, duration_minutes)
        `)
        .eq('therapist_id', targetId)
        .in('status', ['scheduled', 'confirmed', 'pending'])
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      logger.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [therapistId, user?.id]);

  // Crear nueva cita
  const createAppointment = useCallback(async (appointmentData) => {
    setLoading(true);
    try {
      // Task 7: Inserción asegurando paso de service_id si está presente
      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          therapist_id: appointmentData.therapistId,
          patient_id: user?.id || null,
          service_id: appointmentData.serviceId || null, // Relación FK segura
          date: appointmentData.date,
          start_time: appointmentData.startTime,
          end_time: appointmentData.endTime,
          modality_patient: appointmentData.consultationType,
          notes: appointmentData.notes,
          status: 'scheduled' 
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "✅ Cita reservada",
        description: `Tu cita para el ${appointmentData.date} a las ${appointmentData.startTime} ha sido reservada.`
      });

      await fetchAppointments();
      return { success: true, data };
    } catch (error) {
      logger.error('Error creating appointment:', error);
      toast({
        variant: "destructive",
        title: "Error al reservar",
        description: error.message || "No se pudo crear la cita."
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [user, toast, fetchAppointments]);

  // Verificar si un horario está ocupado
  const isSlotBooked = useCallback((date, time) => {
    return appointments.some(apt =>
      apt.date === date &&
      apt.start_time === time
    );
  }, [appointments]);

  // Obtener slots reservados para una fecha
  const getBookedSlotsForDate = useCallback((date) => {
    const dateString = typeof date === 'string'
      ? date
      : date.toISOString().split('T')[0];

    return appointments
      .filter(apt => apt.date === dateString)
      .map(apt => apt.start_time);
  }, [appointments]);

  useEffect(() => {
    const targetId = therapistId || user?.id;
    if (targetId) {
      fetchAppointments();
    }
  }, [therapistId, user?.id, fetchAppointments]);

  return {
    appointments,
    loading,
    createAppointment,
    isSlotBooked,
    getBookedSlotsForDate,
    refreshAppointments: fetchAppointments
  };
};

export default useAppointments;
