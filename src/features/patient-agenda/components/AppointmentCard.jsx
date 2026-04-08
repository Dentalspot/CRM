// ✅ VERSIÓN LIMPIA Y CORREGIDA

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, MapPin, Video, User, Repeat, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const formatDate = (dateString, timeString) => {
  if (!dateString || !timeString) return { date: 'N/A', time: 'N/A' };

  try {
    const date = new Date(`${dateString}T${timeString}`);

    return {
      date: format(date, "EEEE, d 'de' MMMM", { locale: es }),
      time: format(date, "HH:mm 'hrs'", { locale: es })
    };
  } catch {
    return { date: 'Fecha inválida', time: 'Hora inválida' };
  }
};

const statusConfig = {
  scheduled: { label: 'Programada', color: 'bg-blue-500' },
  completed: { label: 'Completada', color: 'bg-green-500' },
  cancelled: { label: 'Cancelada', color: 'bg-red-500' },
  'no-show': { label: 'No Asistió', color: 'bg-yellow-500' },
};

const AppointmentCard = ({ appointment, isUpcoming, onReschedule, onCancel }) => {

  const {
    date,
    start_time,
    therapist,
    clinic,
    modality_patient,
    status
  } = appointment;

  const { date: formattedDate, time: formattedTime } =
    formatDate(date, start_time);

  const currentStatus =
    statusConfig[status] || { label: status, color: 'bg-gray-500' };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden hover:shadow-lg">

        <CardHeader className="flex gap-4 items-start p-4">
          <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarImage src={therapist?.avatar_url} />
            <AvatarFallback>
              {therapist?.full_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <CardTitle>{therapist?.full_name}</CardTitle>
            <CardDescription>Fonoaudiólogo/a</CardDescription>
          </div>

          <Badge className={`${currentStatus.color} text-white`}>
            {currentStatus.label}
          </Badge>
        </CardHeader>

        <Separator />

        <CardContent className="p-4 space-y-3">

          <div className="flex items-center text-sm">
            <Calendar className="mr-2 h-4 w-4 text-primary" />
            <span className="capitalize font-semibold">{formattedDate}</span>
          </div>

          <div className="flex items-center text-sm">
            <Clock className="mr-2 h-4 w-4 text-primary" />
            <span className="font-semibold">{formattedTime}</span>
          </div>

          <div className="flex items-center text-sm">
            {modality_patient === 'online'
              ? <Video className="mr-2 h-4 w-4 text-primary" />
              : <MapPin className="mr-2 h-4 w-4 text-primary" />
            }

            <div>
              <span className="font-semibold capitalize">
                {modality_patient}
              </span>

              {modality_patient === 'presencial' && clinic && (
                <p className="text-xs text-muted-foreground">
                  {clinic.name} — {clinic.address}
                </p>
              )}
            </div>
          </div>

        </CardContent>

        {isUpcoming && (
          <>
            <Separator />
            <div className="p-4 flex justify-end gap-2">

              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel(appointment)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar
              </Button>

              <Button
                size="sm"
                onClick={() => onReschedule(appointment)}
              >
                <Repeat className="mr-2 h-4 w-4" />
                Reprogramar
              </Button>

            </div>
          </>
        )}

      </Card>
    </motion.div>
  );
};

export default AppointmentCard;