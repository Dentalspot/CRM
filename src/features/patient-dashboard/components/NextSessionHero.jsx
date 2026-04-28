import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Video, 
  MapPin, 
  CheckCircle, 
  RefreshCw 
} from 'lucide-react';
import { format, isToday, isTomorrow, parseISO, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import ProfileAvatar from '@/components/shared/ProfileAvatar';

const NextSessionHero = ({ appointment, therapist, onConfirm, onReschedule }) => {
  const [countdown, setCountdown] = useState('');

  // Countdown timer si la sesión es hoy
  useEffect(() => {
    if (!appointment || !isToday(parseISO(appointment.date))) return;

    const updateCountdown = () => {
      const now = new Date();
      const [hours, minutes] = (appointment.start_time || '00:00').split(':').map(Number);
      const sessionTime = new Date();
      sessionTime.setHours(hours, minutes, 0, 0);

      const diff = differenceInMinutes(sessionTime, now);

      if (diff <= 0) {
        setCountdown('¡Tu sesión está comenzando!');
      } else if (diff < 60) {
        setCountdown(`En ${diff} minutos`);
      } else {
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        setCountdown(`En ${h}h ${m}min`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [appointment]);

  // ========== EMPTY STATE ==========
  if (!appointment) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
          <CardContent className="py-8 text-center">
            <Calendar className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium">
              Aún no tienes sesiones agendadas.
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Tu terapeuta puede ayudarte a programar la siguiente, o puedes buscar un especialista.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ========== DATA ==========
  const sessionDate = parseISO(appointment.date);
  const isSessionToday = isToday(sessionDate);
  const isSessionTomorrow = isTomorrow(sessionDate);
  const isOnline = appointment.location_type === 'online';
  const isConfirmed = appointment.confirmation_status === 'confirmed';
  const needsConfirmation = appointment.status === 'scheduled' && !isConfirmed;
  const timeStr = appointment.start_time?.slice(0, 5) || '';

  const dateLabel = isSessionToday
    ? 'Hoy'
    : isSessionTomorrow
      ? 'Mañana'
      : format(sessionDate, "EEEE d 'de' MMMM", { locale: es });

  const therapistName = appointment.therapist?.full_name || therapist?.full_name || 'Tu terapeuta';

  // ========== RENDER ==========
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card
        className={`overflow-hidden border-none shadow-lg ${
          isSessionToday
            ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white'
            : 'bg-white border border-gray-200'
        }`}
      >
        <CardContent className="p-6">
          {/* Status badge */}
          <div className="flex items-center justify-between mb-4">
            <span
              className={`text-sm font-medium uppercase tracking-wide ${
                isSessionToday ? 'text-teal-100' : 'text-gray-400'
              }`}
            >
              Tu próxima sesión
            </span>

            {needsConfirmation && (
              <Badge
                variant="outline"
                className={`${
                  isSessionToday
                    ? 'border-yellow-300 text-yellow-100 bg-yellow-500/20'
                    : 'border-orange-300 text-orange-700 bg-orange-50'
                }`}
              >
                Confirmación pendiente
              </Badge>
            )}

            {isConfirmed && (
              <Badge
                variant="outline"
                className={`${
                  isSessionToday
                    ? 'border-primary text-primary bg-primary/20'
                    : 'border-primary text-primary bg-primary'
                }`}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Confirmada
              </Badge>
            )}
          </div>

          {/* Main info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Date block */}
            <div className="flex items-center gap-4 flex-1">
              <div
                className={`h-16 w-16 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                  isSessionToday
                    ? 'bg-white/15 backdrop-blur-sm'
                    : 'bg-teal-50'
                }`}
              >
                <span
                  className={`text-xs font-semibold uppercase ${
                    isSessionToday ? 'text-teal-100' : 'text-teal-600'
                  }`}
                >
                  {format(sessionDate, 'MMM', { locale: es })}
                </span>
                <span
                  className={`text-2xl font-bold leading-none ${
                    isSessionToday ? 'text-white' : 'text-teal-700'
                  }`}
                >
                  {format(sessionDate, 'd')}
                </span>
              </div>

              <div>
                <h2
                  className={`text-xl font-bold ${
                    isSessionToday ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {dateLabel} a las {timeStr}
                </h2>

                <div className="flex items-center gap-3 mt-1">
                  {/* Therapist */}
                  <span
                    className={`text-sm flex items-center gap-1 ${
                      isSessionToday ? 'text-teal-100' : 'text-gray-500'
                    }`}
                  >
                    {therapistName}
                  </span>

                  <span
                    className={`text-sm ${
                      isSessionToday ? 'text-teal-200' : 'text-gray-300'
                    }`}
                  >
                    •
                  </span>

                  {/* Modality */}
                  <span
                    className={`text-sm flex items-center gap-1 ${
                      isSessionToday ? 'text-teal-100' : 'text-gray-500'
                    }`}
                  >
                    {isOnline ? (
                      <><Video className="h-3.5 w-3.5" /> Online</>
                    ) : (
                      <><MapPin className="h-3.5 w-3.5" /> Presencial</>
                    )}
                  </span>
                </div>

                {/* Countdown */}
                {isSessionToday && countdown && (
                  <p className="text-sm font-semibold text-teal-100 mt-1 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {countdown}
                  </p>
                )}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              {/* Primary CTA */}
              {isSessionToday && isOnline && appointment.meeting_url ? (
                <Button
                  className={`${
                    isSessionToday
                      ? 'bg-white text-teal-700 hover:bg-teal-50'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  } font-semibold`}
                  asChild
                >
                  <a href={appointment.meeting_url} target="_blank" rel="noopener noreferrer">
                    <Video className="h-4 w-4 mr-2" />
                    Unirme a sesión
                  </a>
                </Button>
              ) : needsConfirmation ? (
                <Button
                  className={`${
                    isSessionToday
                      ? 'bg-white text-teal-700 hover:bg-teal-50'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  } font-semibold`}
                  onClick={onConfirm}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar asistencia
                </Button>
              ) : isConfirmed ? (
                <Button
                  disabled
                  className="bg-primary text-white font-semibold cursor-default opacity-100"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Cita confirmada
                </Button>
              ) : null}

              {/* Secondary CTA */}
              <Button
                variant="ghost"
                size="sm"
                className={`${
                  isSessionToday
                    ? 'text-teal-100 hover:text-white hover:bg-white/10'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={onReschedule}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Necesito cambiar la hora
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NextSessionHero;