import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import * as remindersApi from '../api/remindersApi';

export const useReminders = (therapistId) => {
  const [reminders, setReminders] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchReminders = useCallback(async () => {
    if (!therapistId) return;
    setLoading(true);
    const { data, error } = await remindersApi.getScheduledReminders(therapistId);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los recordatorios.' });
    } else {
      setReminders(data || []);
    }
    setLoading(false);
  }, [therapistId, toast]);

  const fetchLogs = useCallback(async () => {
    if (!therapistId) return;
    const { data } = await remindersApi.getReminderLogs(therapistId);
    setLogs(data || []);
  }, [therapistId]);

  const scheduleReminder = async (appointmentId, reminderType, scheduledTime) => {
    const { data, error } = await remindersApi.scheduleEmailReminder(appointmentId, therapistId, reminderType, scheduledTime);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Fallo al agendar recordatorio.' });
      return null;
    }
    toast({ title: 'Recordatorio Agendado', description: `Se enviará un recordatorio el ${new Date(scheduledTime).toLocaleString()}` });
    fetchReminders();
    return data;
  };

  const deleteReminder = async (reminderId) => {
    const { error } = await remindersApi.deleteReminder(reminderId);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el recordatorio.' });
    } else {
      toast({ title: 'Eliminado', description: 'Recordatorio cancelado correctamente.' });
      setReminders(prev => prev.filter(r => r.id !== reminderId));
    }
  };

  const sendTest = async (appointmentId, email) => {
    setLoading(true);
    const { data, error } = await remindersApi.sendTestReminder(appointmentId, email);
    setLoading(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return false;
    }
    toast({ title: 'Enviado', description: 'Correo de prueba enviado correctamente.' });
    return true;
  };

  useEffect(() => {
    fetchReminders();
    fetchLogs();
  }, [fetchReminders, fetchLogs]);

  return {
    reminders,
    logs,
    loading,
    scheduleReminder,
    deleteReminder,
    sendTestReminder: sendTest,
    refresh: () => { fetchReminders(); fetchLogs(); }
  };
};