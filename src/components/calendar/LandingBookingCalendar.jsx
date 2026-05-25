import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Video,
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  CheckCircle2,
  Sparkles,
  PartyPopper
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  set,
  addMinutes
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { getTherapistAvailability } from '@/features/therapist/services/therapist.api';
import { cn } from '@/lib/utils';
import logger from '@/lib/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const slotVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.03, duration: 0.2 }
  })
};

const successVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", bounce: 0.4 }
  }
};

const confettiVariants = {
  hidden: { y: -20, opacity: 0 },
  visible: (i) => ({
    y: 0,
    opacity: 1,
    transition: { delay: i * 0.1, duration: 0.5 }
  })
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================
const SuccessState = ({ selectedDate, selectedTime, primaryColor }) => (
  <motion.div
    variants={successVariants}
    initial="hidden"
    animate="visible"
    className="py-10 px-6 text-center"
  >
    {/* Confetti decoration */}
    <div className="relative mb-6">
      <motion.div
        variants={confettiVariants}
        custom={0}
        initial="hidden"
        animate="visible"
        className="absolute -top-4 left-1/4"
      >
        <Sparkles className="w-6 h-6 text-yellow-400" />
      </motion.div>
      <motion.div
        variants={confettiVariants}
        custom={1}
        initial="hidden"
        animate="visible"
        className="absolute -top-2 right-1/4"
      >
        <PartyPopper className="w-5 h-5 text-primary" />
      </motion.div>

      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
        className="w-24 h-24 rounded-full mx-auto flex items-center justify-center shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
          boxShadow: `0 20px 40px -10px ${primaryColor}50`
        }}
      >
        <CheckCircle2 className="w-12 h-12 text-white" />
      </motion.div>
    </div>

    <motion.h3
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="text-2xl font-bold text-slate-900 mb-2"
    >
      ¡Reserva Confirmada!
    </motion.h3>

    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="text-slate-500 mb-6"
    >
      Tu cita ha sido agendada exitosamente
    </motion.p>

    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="inline-flex items-center gap-4 bg-slate-50 rounded-xl px-6 py-4 text-sm"
    >
      <div className="flex items-center gap-2 text-slate-700">
        <CalendarIcon className="w-4 h-4" style={{ color: primaryColor }} />
        <span className="font-medium capitalize">
          {selectedDate && format(selectedDate, "EEEE d 'de' MMM", { locale: es })}
        </span>
      </div>
      <div className="w-px h-6 bg-slate-200" />
      <div className="flex items-center gap-2 text-slate-700">
        <Clock className="w-4 h-4" style={{ color: primaryColor }} />
        <span className="font-medium">{selectedTime} hrs</span>
      </div>
    </motion.div>

    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="text-sm text-slate-400 mt-6"
    >
      📧 Revisa tu correo para los detalles de la cita
    </motion.p>
  </motion.div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function LandingBookingCalendar({
  therapistId,
  branding = {},
  clinicId = null,
  modality = 'online' // 'online' | 'presencial'
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Availability State
  const [availability, setAvailability] = useState({});
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  // Booking Form State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [patientForm, setPatientForm] = useState({
    name: '',
    email: '',
    phone: '',
    rut: ''
  });
  // Consentimiento de datos personales (Ley 21.719). Obligatorio antes de reservar.
  const [consentChecked, setConsentChecked] = useState(false);

  const isFetchingRef = useRef(false);

  // Colors from branding
  const primaryColor = branding?.primaryColor || branding?.primary_color || '#E11D48';
  const secondaryColor = branding?.secondaryColor || branding?.secondary_color || '#0F172A';

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user) {
      setPatientForm(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || user.profile?.full_name || prev.name,
        email: user.email || prev.email
      }));
    }
  }, [user]);

  // Reset when clinic/modality changes
  useEffect(() => {
    setSelectedDate(null);
    setSelectedTime(null);
    setAvailability({});
  }, [clinicId, modality]);

  // --- Fetch Availability ---
  const fetchAvailabilityData = useCallback(async () => {
    if (!therapistId) return;

    // For presencial, we need a clinicId
    if (modality === 'presencial' && !clinicId) return;

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoadingAvailability(true);
    setAvailability({});

    try {
      const monthStart = startOfMonth(currentMonth);
      const data = await getTherapistAvailability(
        therapistId,
        modality === 'presencial' ? clinicId : null,
        format(monthStart, 'yyyy-MM-dd'),
        45
      );

      const list = Array.isArray(data) ? data : [];
      const availMap = {};
      list.forEach(day => {
        if (day?.availability_date) {
          availMap[day.availability_date] = (day.time_slots || []).filter(s => s.available);
        }
      });
      setAvailability(availMap);

    } catch (error) {
      logger.error("Availability fetch error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las horas disponibles."
      });
    } finally {
      setIsLoadingAvailability(false);
      isFetchingRef.current = false;
    }
  }, [therapistId, modality, clinicId, currentMonth, toast]);

  useEffect(() => {
    fetchAvailabilityData();
  }, [fetchAvailabilityData]);

  // --- Handlers ---
  const handleDateSelect = (date) => {
    if (isBefore(date, new Date()) && !isToday(date)) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const slots = availability[dateStr] || [];

    if (slots.length === 0) return;

    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setBookingModalOpen(true);
  };

  const handleBooking = async () => {
    if (!patientForm.name || !patientForm.email) {
      toast({
        variant: "destructive",
        title: "Datos incompletos",
        description: "Por favor ingresa tu nombre y correo."
      });
      return;
    }

    // Ley 21.719: el tratamiento de datos personales requiere consentimiento
    // explícito del titular. Sin el checkbox marcado, no creamos la reserva.
    if (!consentChecked) {
      toast({
        variant: "destructive",
        title: "Falta tu consentimiento",
        description: "Debes aceptar el tratamiento de tus datos para reservar."
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate end time properly (30 min default)
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startDate = set(new Date(selectedDate), {
        hours,
        minutes,
        seconds: 0,
        milliseconds: 0
      });
      const endDate = addMinutes(startDate, 30);
      const endTimeStr = format(endDate, 'HH:mm');

      // Use RPC for guest booking
      const { error } = await supabase.rpc('schedule_appointment_and_patient', {
        p_therapist_id: therapistId,
        p_clinic_id: modality === 'presencial' ? clinicId : null,
        p_service_id: null,
        p_patient_full_name: patientForm.name,
        p_patient_email: patientForm.email,
        p_patient_phone: patientForm.phone || '',
        p_patient_rut: patientForm.rut || '',
        p_date: format(selectedDate, 'yyyy-MM-dd'),
        p_start_time: selectedTime,
        p_end_time: endTimeStr,
        p_notes: `Reserva desde Landing Page. Modalidad: ${modality}`,
        p_send_email_reminder: true
      });

      if (error) throw error;

      // Show success state
      setBookingSuccess(true);

      // Auto-close after animation
      setTimeout(() => {
        setBookingModalOpen(false);
        setBookingSuccess(false);
        setSelectedDate(null);
        setSelectedTime(null);
        // Reset form but keep user data if logged in
        setPatientForm(prev => ({
          name: user?.user_metadata?.full_name || '',
          email: user?.email || '',
          phone: '',
          rut: ''
        }));
        // Refresh availability
        fetchAvailabilityData();
      }, 4000);

    } catch (err) {
      logger.error('Booking error:', err);
      toast({
        variant: "destructive",
        title: "Error al reservar",
        description: err.message || "Hubo un problema procesando tu solicitud. Intenta nuevamente."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Calendar Grid ---
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const selectedDateSlots = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return availability[dateStr] || [];
  }, [selectedDate, availability]);

  return (
    <div
      className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans"
      style={{ '--primary': primaryColor, '--secondary': secondaryColor }}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        {/* Left Column: Calendar */}
        <div className="lg:col-span-7">
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/5">
            <CardContent className="p-6">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  disabled={isSameMonth(currentMonth, new Date())}
                  className="rounded-full hover:bg-slate-100"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </Button>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" style={{ color: primaryColor }} />
                  <span className="text-xl font-bold text-slate-800 capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: es })}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="rounded-full hover:bg-slate-100"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </Button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2 uppercase tracking-wide">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              {isLoadingAvailability ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                  <Loader2
                    className="w-8 h-8 animate-spin mb-2"
                    style={{ color: primaryColor }}
                  />
                  <span className="text-sm font-medium">Buscando disponibilidad...</span>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isPast = isBefore(day, new Date()) && !isToday(day);
                    const daySlots = availability[dateStr] || [];
                    const hasSlots = daySlots.length > 0;

                    return (
                      <div key={dateStr} className="relative aspect-square">
                        <button
                          onClick={() => handleDateSelect(day)}
                          disabled={!isCurrentMonth || isPast || !hasSlots}
                          className={cn(
                            "w-full h-full flex flex-col items-center justify-center rounded-xl transition-all duration-300 relative overflow-hidden group",
                            !isCurrentMonth && "opacity-0 pointer-events-none",
                            isPast && "text-slate-300 cursor-not-allowed",
                            !isPast && isCurrentMonth && !hasSlots && "text-slate-400 bg-slate-50",
                            !isPast && isCurrentMonth && hasSlots && !isSelected && "bg-white hover:bg-slate-50 text-slate-700 shadow-sm border border-slate-100 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5",
                            isSelected && "text-white shadow-lg scale-105 z-10 font-bold"
                          )}
                          style={isSelected ? {
                            backgroundColor: primaryColor,
                            boxShadow: `0 10px 30px -5px ${primaryColor}40`
                          } : {}}
                        >
                          <span className="text-sm">{format(day, 'd')}</span>

                          {/* Availability Dot */}
                          {hasSlots && !isSelected && !isPast && (
                            <span
                              className="absolute bottom-2 w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: primaryColor }}
                            />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Time Slots */}
        <div className="lg:col-span-5">
          <div className="sticky top-8 space-y-6">
            <AnimatePresence mode="wait">
              {selectedDate ? (
                <motion.div
                  key="slots"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100"
                >
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 capitalize">
                        {format(selectedDate, 'EEEE d', { locale: es })}
                      </h3>
                      <p className="text-slate-500 text-sm">
                        {selectedDateSlots.length} horarios disponibles
                      </p>
                    </div>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <Clock className="w-5 h-5" style={{ color: primaryColor }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedDateSlots.map((slot, i) => (
                      <motion.button
                        key={`${slot.time}-${i}`}
                        custom={i}
                        variants={slotVariants}
                        initial="hidden"
                        animate="visible"
                        onClick={() => handleTimeSelect(slot.time)}
                        className="group relative flex items-center justify-center py-3 px-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-all active:scale-95"
                        style={{
                          '--hover-border': primaryColor
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = primaryColor}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                      >
                        <span
                          className="font-semibold text-slate-700 group-hover:text-[var(--primary)]"
                          style={{ '--primary': primaryColor }}
                        >
                          {slot.time}
                        </span>
                        <div
                          className="absolute right-3 w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ backgroundColor: '#22c55e' }}
                        />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-slate-50/50 rounded-3xl p-8 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center h-[300px]"
                >
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <CalendarIcon className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Selecciona una fecha</h3>
                  <p className="text-slate-500 max-w-[200px]">
                    Elige un día en el calendario para ver los horarios disponibles.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Info Card */}
            <div
              className="rounded-2xl p-6 text-white shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${secondaryColor}, ${secondaryColor}ee)`
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold">Reserva Instantánea</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Tu hora quedará reservada al instante. Recibirás un correo con los detalles
                {modality === 'online' ? ' de conexión.' : ' de ubicación.'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* === Booking Dialog === */}
      <Dialog open={bookingModalOpen} onOpenChange={(open) => {
        if (!isSubmitting && !bookingSuccess) {
          setBookingModalOpen(open);
        }
      }}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white rounded-2xl gap-0 border-0">
          <AnimatePresence mode="wait">
            {bookingSuccess ? (
              <SuccessState
                key="success"
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                primaryColor={primaryColor}
              />
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Header */}
                <div
                  className="p-6 text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-white">
                      Confirmar Reserva
                    </DialogTitle>
                    <DialogDescription className="text-white/80">
                      Verifica los detalles de tu cita
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4 flex gap-4 text-sm font-medium bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      {selectedDate && format(selectedDate, 'dd MMM yyyy', { locale: es })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {selectedTime}
                    </div>
                    <div className="flex items-center gap-2">
                      {modality === 'online' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                      {modality === 'online' ? 'Online' : 'Presencial'}
                    </div>
                  </div>
                </div>

                {/* Form */}
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre Completo *</Label>
                    <Input
                      value={patientForm.name}
                      onChange={(e) => setPatientForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej. Juan Pérez"
                      className="bg-slate-50 border-slate-200"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Correo Electrónico *</Label>
                    <Input
                      type="email"
                      value={patientForm.email}
                      onChange={(e) => setPatientForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="tucorreo@ejemplo.com"
                      className="bg-slate-50 border-slate-200"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Teléfono <span className="text-slate-400 font-normal">(Opcional)</span></Label>
                      <Input
                        value={patientForm.phone}
                        onChange={(e) => setPatientForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+569..."
                        className="bg-slate-50 border-slate-200"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>RUT <span className="text-slate-400 font-normal">(Opcional)</span></Label>
                      <Input
                        value={patientForm.rut}
                        onChange={(e) => setPatientForm(prev => ({ ...prev, rut: e.target.value }))}
                        placeholder="12.345.678-9"
                        className="bg-slate-50 border-slate-200"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Consentimiento de datos (Ley 21.719) — obligatorio */}
                  <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      disabled={isSubmitting}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 shrink-0"
                    />
                    <span>
                      Autorizo el tratamiento de mis datos personales para gestionar esta
                      reserva, conforme a la{' '}
                      <a
                        href="/legal/politica-privacidad"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-slate-800"
                      >
                        Política de Privacidad
                      </a>.
                    </span>
                  </label>
                </div>

                {/* Footer */}
                <DialogFooter className="p-6 pt-2 bg-slate-50">
                  <Button
                    variant="ghost"
                    onClick={() => setBookingModalOpen(false)}
                    className="hover:bg-slate-200"
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleBooking}
                    disabled={isSubmitting || !patientForm.name || !patientForm.email || !consentChecked}
                    className="text-white shadow-lg"
                    style={{
                      backgroundColor: primaryColor,
                      boxShadow: `0 10px 30px -10px ${primaryColor}50`
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      'Confirmar Reserva'
                    )}
                  </Button>
                </DialogFooter>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}