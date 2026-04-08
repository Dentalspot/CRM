import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  MapPin,
  Video
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

const BookingDialog = ({
  isOpen,
  onOpenChange,
  selectedDate,
  selectedTime,
  selectedSlotData = null,
  professionalInfo = null,
  onSuccess
}) => {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('guest');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState({});

  // Guest State
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setActiveTab('auth');
      } else {
        setActiveTab('guest');
      }
      setLoginErrors({});
      setLoginPassword('');
      // Reset guest form if you want to clear on open, or keep it
    }
  }, [isOpen, user]);

  const validateLoginForm = () => {
    const errors = {};
    if (!loginEmail?.trim()) errors.email = 'El email es obligatorio';
    if (!loginPassword?.trim()) errors.password = 'La contraseña es obligatoria';
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLoginForm()) return;
    setIsSubmitting(true);
    try {
      const { error } = await signIn(loginEmail, loginPassword);
      if (error) {
        setLoginErrors({ general: error.message || 'Error al iniciar sesión' });
      } else {
        // Successful login automatically updates 'user' via context
        setActiveTab('auth'); 
      }
    } catch (error) {
      setLoginErrors({ general: 'Error inesperado.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmBooking = async () => {
    // Determine mode
    const isGuest = activeTab === 'guest';
    const isAuth = activeTab === 'auth' && user;

    if (!isGuest && !isAuth) {
      toast({ variant: "destructive", title: "Error", description: "Debes iniciar sesión o completar tus datos." });
      return;
    }

    if (isGuest && (!guestName || !guestEmail)) {
      toast({ variant: "destructive", title: "Datos incompletos", description: "Nombre y Email son obligatorios." });
      return;
    }

    setIsSubmitting(true);

    try {
      // Common Data
      const duration = selectedSlotData?.duration || 30;
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startDate = new Date(selectedDate);
      startDate.setHours(hours, minutes, 0, 0);
      const endDate = new Date(startDate.getTime() + duration * 60000);
      const endTime = format(endDate, 'HH:mm');
      const serviceId = selectedSlotData?.serviceId || null;
      const clinicId = selectedSlotData?.clinicId || null;
      const modality = selectedSlotData?.isOnline ? 'online' : 'presencial';

      if (isAuth) {
        // --- AUTHENTICATED FLOW ---
        // 1. Associate patient
        const { data: patientId, error: rpcError } = await supabase.rpc('associate_patient_to_therapist', {
          p_therapist_id: professionalInfo.id,
          p_profile_id: user.id
        });

        if (rpcError) throw new Error(`Error vinculando paciente: ${rpcError.message}`);
        if (!patientId) throw new Error("No se pudo identificar al paciente.");

        // 2. Insert Appointment
        const { error: insertError } = await supabase
          .from('appointments')
          .insert({
            therapist_id: professionalInfo.id,
            patient_id: patientId,
            clinic_id: clinicId,
            service_id: serviceId,
            date: format(selectedDate, 'yyyy-MM-dd'),
            start_time: selectedTime,
            end_time: endTime,
            status: 'scheduled',
            modality_patient: modality,
            notes: `Reserva online (Auth) - Servicio: ${selectedSlotData?.serviceName || 'General'}`,
            duration_minutes: duration,
          });

        if (insertError) throw insertError;

      } else {
        // --- GUEST FLOW ---
        // Uses RPC that creates patient if needed and schedules appointment
        const { data, error: rpcError } = await supabase.rpc('schedule_appointment_and_patient', {
          p_therapist_id: professionalInfo.id,
          p_clinic_id: clinicId,
          p_service_id: serviceId,
          p_patient_full_name: guestName,
          p_patient_email: guestEmail,
          p_patient_phone: guestPhone || null,
          p_patient_rut: null, // Optional in guest flow
          p_date: format(selectedDate, 'yyyy-MM-dd'),
          p_start_time: selectedTime,
          p_end_time: endTime,
          p_notes: `Reserva online (Invitado) - Servicio: ${selectedSlotData?.serviceName || 'General'}`,
          p_send_email_reminder: true
        });

        if (rpcError) throw new Error(`Error reservando: ${rpcError.message}`);
      }

      toast({
        title: '¡Cita reservada con éxito!',
        description: `Recibirás un correo de confirmación en breve.`,
      });

      if (onSuccess) onSuccess();
      onOpenChange(false);
      
      // If authenticaded, redirect to dashboard, else maybe just close
      if (isAuth) {
        setTimeout(() => navigate('/dashboard/patient'), 1000);
      } else {
        // Maybe clear form
        setGuestName('');
        setGuestEmail('');
        setGuestPhone('');
      }

    } catch (error) {
      logger.error('Booking error:', error);
      let msg = error.message;
      if (msg.includes('double_booking') || msg.includes('overlap')) {
        msg = 'El horario seleccionado ya no está disponible.';
      }
      toast({
        variant: 'destructive',
        title: 'No se pudo reservar',
        description: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedDate || !selectedTime) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Finalizar Reserva</DialogTitle>
          <DialogDescription>
            Completa tus datos para confirmar la cita.
          </DialogDescription>
        </DialogHeader>

        {/* Appointment Summary */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg mb-4">
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-200">
            <Avatar className="h-10 w-10">
              <AvatarImage src={professionalInfo?.avatar_url} />
              <AvatarFallback>{professionalInfo?.full_name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-slate-900">{professionalInfo?.full_name}</p>
              <p className="text-xs text-slate-500">{professionalInfo?.headline_statement || 'Fonoaudiólogo'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
              <div>
                <span className="block text-xs text-slate-500">Fecha</span>
                <span className="font-medium text-slate-700 capitalize">
                  {format(selectedDate, "EEE d 'de' MMM", { locale: es })}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-slate-400 mt-0.5" />
              <div>
                <span className="block text-xs text-slate-500">Hora</span>
                <span className="font-medium text-slate-700">{selectedTime} hrs</span>
              </div>
            </div>
            <div className="col-span-2 flex items-start gap-2">
              {selectedSlotData?.isOnline ? (
                <Video className="h-4 w-4 text-blue-500 mt-0.5" />
              ) : (
                <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
              )}
              <div>
                <span className="block text-xs text-slate-500">Modalidad</span>
                <span className="font-medium text-slate-700">
                  {selectedSlotData?.isOnline ? 'Online / Videollamada' : 'Presencial en Consulta'}
                </span>
                {selectedSlotData?.clinicName && (
                  <p className="text-xs text-slate-500 mt-0.5">{selectedSlotData.clinicName}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {user ? (
          // LOGGED IN VIEW
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 text-green-800 rounded-md border border-green-100">
              <CheckCircle2 className="h-5 w-5" />
              <div className="text-sm">
                <p className="font-medium">Sesión iniciada como</p>
                <p>{user.email}</p>
              </div>
            </div>
            <Button onClick={handleConfirmBooking} className="w-full bg-teal-600 hover:bg-teal-700" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</> : 'Confirmar Reserva'}
            </Button>
          </div>
        ) : (
          // TABS FOR GUEST / LOGIN
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="guest">Invitado</TabsTrigger>
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            </TabsList>

            <TabsContent value="guest" className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="guestName">Nombre Completo <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                      id="guestName" 
                      placeholder="Ej: Juan Pérez" 
                      className="pl-9"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="guestEmail">Email <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                      id="guestEmail" 
                      type="email" 
                      placeholder="Ej: juan@email.com" 
                      className="pl-9"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="guestPhone">Teléfono (Opcional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                      id="guestPhone" 
                      type="tel" 
                      placeholder="+56 9 1234 5678" 
                      className="pl-9"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <Button onClick={handleConfirmBooking} className="w-full bg-teal-600 hover:bg-teal-700" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reservando...</> : 'Reservar Cita'}
              </Button>
            </TabsContent>

            <TabsContent value="login" className="space-y-4">
              {loginErrors.general && <div className="text-red-500 text-sm p-2 bg-red-50 rounded">{loginErrors.general}</div>}
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
                {loginErrors.email && <p className="text-red-500 text-xs">{loginErrors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label>Contraseña</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {loginErrors.password && <p className="text-red-500 text-xs">{loginErrors.password}</p>}
              </div>
              <Button onClick={handleLogin} className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ingresar y Continuar
              </Button>
              <div className="text-center mt-2">
                <Button
                  variant="link"
                  className="text-sm"
                  onClick={() => navigate('/auth/register', { state: { returnTo: window.location.pathname } })}
                >
                  ¿No tienes cuenta? Regístrate aquí
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;