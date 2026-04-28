import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  Video, 
  Trophy, 
  CheckCircle, 
  X, 
  ArrowLeft,
  AlertCircle,
  Loader2
} from 'lucide-react';

import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import logger from '@/lib/utils/logger';
import { useMetaTracking } from '@/hooks/useMetaTracking';

const ConfirmAppointmentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { trackEvent } = useMetaTracking();
  
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [notes, setNotes] = useState('');

  // Fetch Appointment Data
  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            patient:patients (
              id,
              notes,
              profile:profiles (
                full_name,
                email,
                phone,
                avatar_url,
                rut
              )
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setAppointment(data);
        if (data?.notes) setNotes(data.notes);
      } catch (error) {
        logger.error('Error fetching appointment:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar la información de la cita.",
          variant: "destructive"
        });
        navigate('/dashboard/calendar'); // Fallback navigation
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAppointment();
  }, [id, navigate, toast]);

  // Handle Actions
  const triggerCelebration = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
    });
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'confirmed',
          notes: notes,
          updated_at: new Date()
        })
        .eq('id', id);

      if (error) throw error;

      // Track Lead event
      trackEvent('Lead', {
        content_name: 'Appointment Confirmation',
        content_category: 'Healthcare',
        content_ids: [id],
        value: 0,
        currency: 'CLP'
      }, {
        email: appointment?.patient?.profile?.email,
        phone: appointment?.patient?.profile?.phone
      });

      trackEvent('Schedule', { content_name: 'Appointment Booking', content_category: 'Healthcare' });

      triggerCelebration();
      setShowCelebration(true);
      
      // Auto close/redirect after 3 seconds
      setTimeout(() => {
        navigate('/dashboard/calendar');
      }, 3000);

    } catch (error) {
      logger.error('Error confirming appointment:', error);
      toast({
        title: "Error",
        description: "No se pudo confirmar la cita. Inténtalo de nuevo.",
        variant: "destructive"
      });
      setConfirming(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleReschedule = () => {
    // Navigate to a reschedule page or open modal context
    navigate(`/dashboard/calendar?action=reschedule&appointmentId=${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando detalles de la cita...</p>
        </div>
      </div>
    );
  }

  if (!appointment) return null;

  const isOnline = appointment.modality_patient === 'online' || appointment.modality_patient === 'video_call';
  const patientProfile = appointment.patient?.profile;
  const appointmentDate = new Date(`${appointment.date}T${appointment.start_time}`);

  return (
    <>
      <Helmet>
        <title>Confirmar Cita | DentalSpot</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8 flex items-center justify-center">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl"
        >
          <Card className="shadow-2xl border-0 overflow-hidden relative">
            {/* Header Gradient Stripe */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-primary" />

            <CardHeader className="pt-8 pb-6 text-center space-y-2">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-primary/10 p-4 rounded-full">
                  <Calendar className="w-10 h-10 text-primary" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Confirmar Cita
              </CardTitle>
              <p className="text-gray-500 dark:text-gray-400">
                Revisa los detalles antes de confirmar la sesión.
              </p>
            </CardHeader>

            <CardContent className="grid gap-8 p-6 md:p-8">
              
              {/* Main Info Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Left: Patient Profile */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4" /> Paciente
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-800 flex items-start gap-4 hover:shadow-md transition-shadow">
                    <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                      <AvatarImage src={patientProfile?.avatar_url} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                        {patientProfile?.full_name?.charAt(0) || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <p className="font-bold text-lg text-gray-900 dark:text-white leading-tight">
                        {patientProfile?.full_name || 'Paciente sin nombre'}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Phone className="w-3 h-3" />
                        {patientProfile?.phone || 'Sin teléfono'}
                      </div>
                      {patientProfile?.rut && (
                        <Badge variant="outline" className="text-xs mt-1 bg-white dark:bg-gray-800">
                          RUT: {patientProfile.rut}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Session Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Detalles de Sesión
                  </h3>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y dark:divide-gray-700 shadow-sm">
                    <div className="p-4 flex items-center justify-between">
                      <span className="text-sm text-gray-500">Fecha</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {format(appointmentDate, "EEEE d 'de' MMMM", { locale: es })}
                      </span>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <span className="text-sm text-gray-500">Hora</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xl text-primary">
                          {appointment.start_time?.substring(0, 5)}
                        </span>
                        <span className="text-xs text-muted-foreground bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                          {appointment.duration_minutes} min
                        </span>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <span className="text-sm text-gray-500">Modalidad</span>
                      <Badge 
                        className={isOnline 
                          ? "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200" 
                          : "bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
                        }
                      >
                        {isOnline ? (
                          <><Video className="w-3 h-3 mr-1.5" /> Online</>
                        ) : (
                          <><MapPin className="w-3 h-3 mr-1.5" /> Presencial</>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Notas u Observaciones (Opcional)
                </label>
                <Textarea
                  placeholder="Añade instrucciones especiales, recordatorios o notas para esta sesión..."
                  className="resize-none min-h-[100px] border-gray-300 focus:ring-primary/20 bg-white dark:bg-gray-800"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

            </CardContent>

            <Separator />

            <CardFooter className="p-6 md:p-8 flex flex-col-reverse md:flex-row gap-4 justify-between bg-gray-50/50 dark:bg-gray-900/50">
              <Button 
                variant="ghost" 
                onClick={handleCancel}
                className="w-full md:w-auto text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <Button 
                  variant="outline" 
                  onClick={handleReschedule}
                  className="w-full md:w-auto border-gray-300 hover:bg-white hover:border-gray-400 dark:border-gray-600"
                >
                  Reprogramar
                </Button>
                <Button 
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {confirming ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Confirmar Cita
                </Button>
              </div>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Celebration Overlay */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setShowCelebration(false)}
            >
              <motion.div
                initial={{ scale: 0.5, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center relative overflow-hidden"
                onClick={(e) => e.stopPropagation()} // Prevent close on modal click
              >
                {/* Background decoration */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-yellow-100/50 to-transparent dark:from-yellow-900/20" />
                
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                    className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-2"
                  >
                    <Trophy className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
                  </motion.div>
                  
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                    ¡Cita Confirmada!
                  </h2>
                  
                  <div className="space-y-1">
                    <p className="text-gray-500 dark:text-gray-400">
                      Has confirmado tu sesión con
                    </p>
                    <p className="font-semibold text-lg text-primary">
                      {patientProfile?.full_name || 'Tu paciente'}
                    </p>
                  </div>

                  <div className="bg-primary/5 rounded-lg p-3 w-full border border-primary/10">
                    <p className="text-sm font-medium text-primary/80 italic">
                      "Cada sesión es un paso más hacia el éxito." 🚀
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    Redirigiendo en unos segundos...
                  </p>
                </div>

                <button 
                  onClick={() => setShowCelebration(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
};

export default ConfirmAppointmentPage;