import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Stethoscope, Clock, CalendarPlus, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Mismo color mapping que AgendaSidebar — semáforo consistente en toda la app:
//   completed → verde (atención YA realizada)
//   confirmed → azul (paciente confirmó la asistencia)
//   scheduled → celeste (programada, pendiente de confirmar)
//   cancelled → rojo
//   no-show   → ámbar
const STATUS_STYLES = {
  completed: {
    card: 'bg-green-50 border-l-green-500',
    badge: 'bg-green-100 text-green-700 border-green-200',
    pill: 'bg-green-100 text-green-700',
    label: 'Completada',
  },
  confirmed: {
    card: 'bg-blue-50 border-l-blue-500',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    pill: 'bg-blue-100 text-blue-700',
    label: 'Confirmada',
  },
  scheduled: {
    // Programada: blanco con sombra suave (mismo look del calendario).
    card: 'bg-white border-l-gray-300 shadow-sm',
    badge: 'bg-gray-100 text-gray-700 border-gray-200',
    pill: 'bg-gray-100 text-gray-700',
    label: 'Programada',
  },
  cancelled: {
    card: 'bg-red-50 border-l-red-400',
    badge: 'bg-red-100 text-red-700 border-red-200',
    pill: 'bg-red-100 text-red-700',
    label: 'Cancelada',
  },
  canceled: {
    card: 'bg-red-50 border-l-red-400',
    badge: 'bg-red-100 text-red-700 border-red-200',
    pill: 'bg-red-100 text-red-700',
    label: 'Cancelada',
  },
  'no-show': {
    card: 'bg-amber-50 border-l-amber-400',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    pill: 'bg-amber-100 text-amber-800',
    label: 'Ausente',
  },
};

// Estados por los que el dentista puede mover una cita desde el dashboard.
// 'no-show' se incluye para marcar ausentes; 'completed' y 'cancelled' la
// quitan de la lista de "Próximas Citas" porque la query las excluye.
const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Programada' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'completed', label: 'Completada' },
  { value: 'no-show', label: 'Ausente' },
  { value: 'cancelled', label: 'Cancelada' },
];

const UpcomingAppointmentCard = ({ appointment, index = 0, onReschedule, onStatusChange }) => {
  const { id, date, start_time, patient, status, service } = appointment;

  const patientName = patient?.profile?.full_name || patient?.full_name || 'Paciente';
  const serviceName = service?.service_name;

  const getDateLabel = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    if (isToday(d)) return 'Hoy';
    if (isTomorrow(d)) return 'Mañana';
    return format(d, 'EEEE d', { locale: es });
  };

  const dateLabel = getDateLabel(date);
  const timeLabel = start_time?.substring(0, 5);
  const styles = STATUS_STYLES[status] || STATUS_STYLES.scheduled;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={cn(
        'group hover:shadow-md transition-all duration-300 border-l-4 overflow-hidden',
        styles.card,
      )}>
        <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          {/* Date+Time pill */}
          <div className={cn(
            'flex flex-col items-center justify-center min-w-[5.5rem] shrink-0 rounded-lg py-2 px-2',
            styles.pill,
          )}>
            <span className="text-[11px] font-semibold uppercase">{dateLabel}</span>
            <span className="text-lg sm:text-xl font-bold tabular-nums">{timeLabel}</span>
          </div>

          {/* Patient Info — el nombre es link a su ficha clínica. */}
          <div className="flex-1 min-w-0">
            <Link
              to={`/dashboard/patients/${patient?.id}/clinical-history`}
              className="block group/name"
            >
              <h4 className="font-semibold text-sm sm:text-base truncate mb-1 hover:underline group-hover/name:text-primary transition-colors">
                {patientName}
              </h4>
            </Link>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Procedimiento — antes era Presencial/Online. */}
              <Badge variant="outline" className="text-[10px] h-5 px-1.5 shrink-0 bg-white/70 max-w-[180px]">
                <Stethoscope className="w-3 h-3 mr-1 shrink-0" />
                {serviceName ? (
                  <span className="truncate">{serviceName}</span>
                ) : (
                  <span className="italic opacity-70">Sin procedimiento</span>
                )}
              </Badge>

              {/* Estado — clickable. Abre dropdown para cambiar el estado.
                  Si no hay handler (uso read-only), queda como Badge plano. */}
              {onStatusChange ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Cambiar estado (actual: ${styles.label})`}
                      className={cn(
                        'inline-flex items-center gap-1 text-[10px] h-5 px-1.5 rounded-full shrink-0',
                        'border font-semibold transition-colors hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary/40',
                        styles.badge,
                      )}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{styles.label}</span>
                      <ChevronDown className="w-3 h-3 opacity-70" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44">
                    {STATUS_OPTIONS.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        disabled={opt.value === status}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (opt.value !== status) onStatusChange(id, opt.value);
                        }}
                        className={cn(
                          'text-xs cursor-pointer',
                          opt.value === status && 'font-semibold',
                        )}
                      >
                        {opt.label}
                        {opt.value === status && <span className="ml-auto text-[10px] opacity-60">(actual)</span>}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Badge className={cn('text-[10px] h-5 px-1.5 shrink-0', styles.badge)}>
                  <Clock className="w-3 h-3 mr-1" />
                  {styles.label}
                </Badge>
              )}
            </div>
          </div>

          {/* Acción: Reagendar (abre AppointmentModal con paciente pre-cargado).
              Si no hay handler, no se renderiza el botón. */}
          {onReschedule && patient?.id && (
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 gap-1 text-xs sm:opacity-70 sm:group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.preventDefault();
                onReschedule(patient.id, appointment);
              }}
              aria-label="Reagendar cita"
              title="Reagendar"
            >
              <CalendarPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Reagendar</span>
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UpcomingAppointmentCard;
