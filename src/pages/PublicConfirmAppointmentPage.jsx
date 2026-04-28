import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  CheckCircle, 
  XCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';

import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import logger from '@/lib/utils/logger';
import { useToast } from '@/components/ui/use-toast';

const PublicConfirmAppointmentPage = () => {
  const { appointmentId } = useParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [error, setError] = useState(null);
  const [confirmationStatus, setConfirmationStatus] = useState('pending'); // pending, confirmed, error

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        // Fetch public appointment details
        // Note: RLS policies must allow anon read access for this specific query or use an edge function
        // For now we assume the query is permitted for the existence of the page logic
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            id,
            date,
            start_time,
            duration_minutes,
            modality_patient,
            status,
            therapist:profiles!appointments_therapist_id_fkey(
              full_name
            ),
            clinic:clinics(
              name,
              address
            )
          `)
          .eq('id', appointmentId)
          .single();

        if (error) throw error;
        setAppointment(data);
        
        if (data.status === 'confirmed') {
          setConfirmationStatus('already_confirmed');
        }
      } catch (err) {
        logger.error('Error fetching appointment:', err);
        setError('No pudimos encontrar la cita o el enlace ha expirado.');
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'confirmed',
          updated_at: new Date()
        })
        .eq('id', appointmentId);

      if (error) throw error;

      setConfirmationStatus('success');
      toast({
        title: "¡Cita Confirmada!",
        description: "Tu asistencia ha sido registrada exitosamente.",
        variant: "default",
      });
    } catch (err) {
      logger.error('Error confirming appointment:', err);
      toast({
        title: "Error",
        description: "Hubo un problema al confirmar la cita. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !appointment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Cargando información de la cita...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-lg border-red-100">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-900">Enlace no válido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button asChild variant="outline">
              <Link to="/">Ir al inicio</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const appointmentDate = new Date(`${appointment.date}T${appointment.start_time}`);
  const isOnline = appointment.modality_patient === 'online' || appointment.modality_patient === 'video_call';

  return (
    <>
      <Helmet>
        <title>Confirmar Asistencia | DentalSpot</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <Card className="shadow-xl border-0 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary to-purple-600" />
            
            <CardHeader className="text-center pt-8 pb-2">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Confirmar Asistencia
              </CardTitle>
              <CardDescription>
                Por favor confirma tu cita con {appointment.therapist?.full_name}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
              {/* Status Banner */}
              <AnimatePresence mode="wait">
                {confirmationStatus === 'success' ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-green-50 border border-green-200 rounded-xl p-6 text-center"
                  >
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-green-800 mb-1">¡Confirmada!</h3>
                    <p className="text-green-700 text-sm">
                      Gracias por confirmar tu asistencia. Te esperamos.
                    </p>
                  </motion.div>
                ) : confirmationStatus === 'already_confirmed' ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <p className="text-blue-800 text-sm font-medium">
                      Esta cita ya ha sido confirmada anteriormente.
                    </p>
                  </div>
                ) : null}
              </AnimatePresence>

              {/* Appointment Details */}
              <div className="bg-white border border-gray-100 rounded-xl shadow-sm divide-y divide-gray-100">
                <div className="p-4 flex items-start gap-4">
                  <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Fecha</p>
                    <p className="text-gray-900 font-semibold capitalize">
                      {format(appointmentDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                </div>

                <div className="p-4 flex items-start gap-4">
                  <div className="bg-primary p-2.5 rounded-lg text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Hora</p>
                    <p className="text-gray-900 font-semibold">
                      {appointment.start_time?.substring(0, 5)} ({appointment.duration_minutes} min)
                    </p>
                  </div>
                </div>

                <div className="p-4 flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg ${isOnline ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                    {isOnline ? <Video className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Modalidad</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className={isOnline ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-green-50 text-green-700 border-green-200"}>
                        {isOnline ? 'Online / Videollamada' : 'Presencial'}
                      </Badge>
                    </div>
                    {!isOnline && appointment.clinic && (
                      <p className="text-sm text-gray-600 mt-1">
                        {appointment.clinic.name} - {appointment.clinic.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-6 bg-gray-50 flex flex-col sm:flex-row gap-3">
              {confirmationStatus === 'pending' && (
                <Button 
                  size="lg" 
                  className="w-full font-semibold shadow-lg shadow-primary/20"
                  onClick={handleConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Confirmar Asistencia
                </Button>
              )}
              
              {confirmationStatus !== 'pending' && (
                <Button asChild variant="outline" className="w-full">
                  <Link to="/">Volver al inicio</Link>
                </Button>
              )}
            </CardFooter>
          </Card>
          
          <p className="text-center text-xs text-gray-400 mt-6">
            Si necesitas reprogramar, por favor contacta directamente a tu profesional.
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default PublicConfirmAppointmentPage;