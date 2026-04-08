import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  User, 
  XCircle, 
  AlertTriangle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useMetaTracking } from '@/hooks/useMetaTracking';
import logger from '@/lib/utils/logger';
import { DATASET_ID } from '@/lib/metaPixel';

const CancelAppointmentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { trackEvent } = useMetaTracking();
  
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            patient:patients (
              id,
              profile:profiles (
                full_name,
                email,
                phone
              )
            ),
            clinic:clinics (
              name
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setAppointment(data);
      } catch (error) {
        logger.error('Error fetching appointment:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar la información de la cita.",
          variant: "destructive"
        });
        navigate('/dashboard/calendar');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAppointment();
  }, [id, navigate, toast]);

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast({
        title: "Motivo requerido",
        description: "Por favor indica el motivo de la cancelación.",
        variant: "destructive"
      });
      return;
    }

    setCancelling(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'cancelled',
          cancellation_reason: reason,
          updated_at: new Date()
        })
        .eq('id', id);

      if (error) throw error;

      // Track 'Lead' event on cancellation (as requested)
      // This signifies a significant interaction, even if negative, or follows a specific lead flow
      await trackEvent('Lead', {
        content_name: 'Appointment Cancellation',
        content_category: 'Healthcare',
        content_ids: [id],
        status: 'cancelled',
        cancellation_reason: reason,
        value: 0,
        currency: 'CLP'
      }, {
        email: appointment?.patient?.profile?.email || user?.email,
        phone: appointment?.patient?.profile?.phone
      }, DATASET_ID);

      setShowSuccess(true);
      
      setTimeout(() => {
        navigate('/dashboard/calendar');
      }, 3000);

    } catch (error) {
      logger.error('Error cancelling appointment:', error);
      toast({
        title: "Error",
        description: "No se pudo cancelar la cita. Inténtalo de nuevo.",
        variant: "destructive"
      });
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!appointment) return null;

  const appointmentDate = new Date(`${appointment.date}T${appointment.start_time}`);

  return (
    <>
      <Helmet>
        <title>Cancelar Cita | DentalSpot</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg"
        >
          {showSuccess ? (
             <Card className="text-center p-8 border-green-200 bg-green-50">
               <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                 <XCircle className="w-8 h-8 text-green-600 rotate-45" /> {/* Simulating checkmark via icon reuse or simple check */}
               </div>
               <h2 className="text-2xl font-bold text-green-800 mb-2">Cita Cancelada</h2>
               <p className="text-green-700">La cancelación ha sido procesada correctamente.</p>
               <p className="text-sm text-green-600 mt-4">Redirigiendo al calendario...</p>
             </Card>
          ) : (
            <Card className="shadow-xl border-0 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-red-500 to-orange-500" />
              
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle className="text-2xl text-gray-900">Cancelar Cita</CardTitle>
                <CardDescription>
                  ¿Estás seguro que deseas cancelar esta sesión?
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Paciente</p>
                      <p className="font-medium">{appointment.patient?.profile?.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Fecha y Hora</p>
                      <p className="font-medium capitalize">
                        {format(appointmentDate, "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Motivo de cancelación <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Indica la razón de la cancelación..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="resize-none"
                  />
                </div>
              </CardContent>

              <CardFooter className="flex gap-3 bg-gray-50/50 p-6">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(-1)}
                  className="flex-1"
                  disabled={cancelling}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleCancel} 
                  className="flex-1"
                  disabled={cancelling}
                >
                  {cancelling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Confirmar Cancelación
                </Button>
              </CardFooter>
            </Card>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default CancelAppointmentPage;