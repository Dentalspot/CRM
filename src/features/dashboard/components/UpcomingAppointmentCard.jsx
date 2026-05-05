import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Video, MapPin, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';

const UpcomingAppointmentCard = ({ appointment, index = 0 }) => {
  const { 
    id, 
    date, 
    start_time, 
    modality, 
    patient, 
    status 
  } = appointment;

  const patientName = patient?.profile?.full_name || patient?.full_name || 'Paciente';
  const patientInitials = patientName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Helper for date label
  const getDateLabel = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    if (isToday(d)) return 'Hoy';
    if (isTomorrow(d)) return 'Mañana';
    return format(d, 'EEEE d', { locale: es });
  };

  const dateLabel = getDateLabel(date);
  const timeLabel = start_time?.substring(0, 5); // HH:MM

  const isOnline = modality === 'online' || modality === 'video_call';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="group hover:shadow-md transition-all duration-300 border-l-4 border-l-primary/50 overflow-hidden">
        <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          {/* Date+Time pill — más ancho para que "MAÑANA" no se corte. */}
          <div className="flex flex-col items-center justify-center min-w-[5.5rem] shrink-0 bg-muted/30 rounded-lg py-2 px-2">
            <span className="text-[11px] font-semibold text-primary uppercase">{dateLabel}</span>
            <span className="text-lg sm:text-xl font-bold text-foreground tabular-nums">{timeLabel}</span>
          </div>

          {/* Patient Info — nombre full-width arriba, badge + status abajo
              en mobile. En desktop nombre+badge en línea (más compacto). */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm sm:text-base truncate mb-1">{patientName}</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={isOnline ? "secondary" : "outline"} className="text-[10px] h-5 px-1.5 shrink-0">
                {isOnline ? <Video className="w-3 h-3 mr-1" /> : <MapPin className="w-3 h-3 mr-1" />}
                {isOnline ? 'Online' : 'Presencial'}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {status === 'confirmed' ? 'Confirmado' : 'Agendado'}
              </span>
            </div>
          </div>

          {/* Action — visible siempre en mobile (no hover en touch). */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity"
            asChild
          >
            <Link to={`/dashboard/patients/${patient?.id}/clinical-history`} aria-label="Ver ficha del paciente">
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UpcomingAppointmentCard;