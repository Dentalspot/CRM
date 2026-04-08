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
        <CardContent className="p-4 flex items-center gap-4">
          {/* Time & Date Column */}
          <div className="flex flex-col items-center justify-center min-w-[4.5rem] bg-muted/30 rounded-lg py-2 px-1">
            <span className="text-xs font-semibold text-primary uppercase">{dateLabel}</span>
            <span className="text-xl font-bold text-foreground">{timeLabel}</span>
          </div>

          {/* Patient Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-base truncate">{patientName}</h4>
              <Badge variant={isOnline ? "secondary" : "outline"} className="text-[10px] h-5 px-1.5">
                {isOnline ? <Video className="w-3 h-3 mr-1" /> : <MapPin className="w-3 h-3 mr-1" />}
                {isOnline ? 'Online' : 'Presencial'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
              <Clock className="w-3 h-3" /> 
              {status === 'confirmed' ? 'Confirmado' : 'Agendado'}
            </p>
          </div>

          {/* Action */}
          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" asChild>
            <Link to={`/dashboard/patients/${patient?.id}/clinical-history`}>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UpcomingAppointmentCard;