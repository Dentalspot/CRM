import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  CalendarDays 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_CONFIG = {
  operational: {
    label: 'Todo operativo',
    icon: CheckCircle,
    className: 'bg-green-50 text-green-700 border-green-200',
    dot: 'bg-green-500',
  },
  attention: {
    label: 'Requiere atención',
    icon: AlertTriangle,
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    dot: 'bg-yellow-500',
  },
  critical: {
    label: 'Alertas críticas',
    icon: XCircle,
    className: 'bg-red-50 text-red-600 border-red-200',
    dot: 'bg-red-500',
  },
};

const resolveClinicStatus = ({ alertCount = 0, criticalCount = 0 }) => {
  if (criticalCount > 0) return 'critical';
  if (alertCount > 0) return 'attention';
  return 'operational';
};

const ClinicContextHeader = ({
  clinicName = 'Mi Centro',
  userName = '',
  alertCount = 0,
  criticalCount = 0,
  todayAppointments = 0,
  statusOverride = null,
}) => {
  const today = new Date();
  const dateLabel = format(today, "EEEE d 'de' MMMM", { locale: es });
  const greeting = today.getHours() < 12 ? 'Buenos días' : today.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = userName?.split(' ')[0] || '';

  const status = statusOverride || resolveClinicStatus({ alertCount, criticalCount });
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  const pendingCount = alertCount + criticalCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      {/* Top bar: clinic name + date + status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Building2 className="h-4 w-4" />
          <span className="font-medium text-gray-700">{clinicName}</span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {dateLabel}
          </span>
        </div>
        <Badge variant="outline" className={`${config.className} gap-1.5 text-xs font-medium py-1`}>
          <span className={`h-2 w-2 rounded-full ${config.dot} inline-block`} />
          {config.label}
        </Badge>
      </div>

      {/* Greeting + summary */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {greeting}{firstName ? `, ${firstName}` : ''}.
        </h1>
        <p className="text-gray-500 mt-1">
          {todayAppointments > 0 ? (
            <>
              Tu centro tiene <span className="font-semibold text-gray-700">{todayAppointments} citas hoy</span>
              {pendingCount > 0 && (
                <> y <span className="font-semibold text-orange-600">{pendingCount} situación{pendingCount > 1 ? 'es' : ''}</span> que necesita{pendingCount > 1 ? 'n' : ''} tu atención.</>
              )}
              {pendingCount === 0 && '. Todo marcha dentro de parámetros normales.'}
            </>
          ) : (
            'No hay citas programadas para hoy. Buen momento para planificar la semana.'
          )}
        </p>
      </div>
    </motion.div>
  );
};

export { resolveClinicStatus };
export default ClinicContextHeader;