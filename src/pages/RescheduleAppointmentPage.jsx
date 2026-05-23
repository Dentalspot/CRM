import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  RefreshCw, 
  ArrowLeft,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import TimePicker from '@/components/ui/time-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useMetaTracking } from '@/hooks/useMetaTracking';
import logger from '@/lib/utils/logger';
import { DATASET_ID } from '@/lib/metaPixel';

const RescheduleAppointmentPage = () => {
  const { id } = useParams(); // Usually passed as param or query, handling route param here
  const [searchParams] = useSearchParams();
  const appointmentId = id || searchParams.get('appointmentId');
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { trackEvent } = useMetaTracking();
  
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!appointmentId) return;
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            patient:patients (
              id,
              profile:profiles!patients_profile_id_fkey (
                full_name,
                email,
                phone
              )
            )
          `)
          .eq('id', appointmentId)
          .single();

        if (error) throw error;
        setAppointment(data);
        // Initialize inputs with current values
        setNewDate(data.date);
        setNewTime(data.start_time);
      } catch (error) {
        logger.error('Error fetching appointment:', error);
        navigate('/dashboard/calendar');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [appointmentId, navigate]);

  const handleReschedule = async () => {
    if (!newDate || !newTime) {
      toast({ title: "Datos incompletos", description: "Selecciona nueva fecha y hora.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // 1. Update in DB
      const { error } = await supabase
        .from('appointments')
        .update({
          date: newDate,
          start_time: newTime,
          updated_at: new Date(),
          notes: appointment.notes ? `${appointment.notes}\n[Reprogramada: ${reason}]` : `[Reprogramada: ${reason}]`,
          status: 'scheduled' // Reset status to scheduled if it was confirmed
        })
        .eq('id', appointmentId);

      if (error) throw error;

      // 2. Meta CAPI Tracking
      const oldDetails = {
        date: appointment.date,
        time: appointment.start_time
      };
      
      const newDetails = {
        date: newDate,
        time: newTime
      };

      await trackEvent('Lead', {
        content_name: 'Appointment Reschedule',
        content_category: 'Healthcare',
        content_ids: [appointmentId],
        old_schedule: oldDetails,
        new_schedule: newDetails,
        reschedule_reason: reason,
        value: 0,
        currency: 'CLP'
      }, {
        email: appointment.patient?.profile?.email || user?.email,
        phone: appointment.patient?.profile?.phone
      }, DATASET_ID);

      toast({
        title: "¡Cita Reprogramada!",
        description: "Los cambios se han guardado exitosamente.",
      });

      setTimeout(() => navigate('/dashboard/calendar'), 2000);

    } catch (error) {
      logger.error('Error rescheduling:', error);
      toast({
        title: "Error",
        description: "No se pudo reprogramar la cita.",
        variant: "destructive"
      });
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!appointment) return null;

  return (
    <>
      <Helmet>
        <title>Reprogramar Cita | DentalSpot</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                Reprogramar Cita
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
                <p><strong>Paciente:</strong> {appointment.patient?.profile?.full_name}</p>
                <p><strong>Actual:</strong> {format(new Date(`${appointment.date}T${appointment.start_time}`), "dd/MM/yyyy HH:mm")}</p>
              </div>

              <div className="grid gap-2">
                <Label>Nueva Fecha</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input 
                    type="date" 
                    className="pl-9"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Nueva Hora</Label>
                <TimePicker value={newTime} onChange={setNewTime} />
              </div>

              <div className="grid gap-2">
                <Label>Motivo (Opcional)</Label>
                <Textarea 
                  placeholder="¿Por qué se cambia la fecha?"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
              <Button onClick={handleReschedule} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Confirmar Cambio
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default RescheduleAppointmentPage;