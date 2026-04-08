import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle 
} from 'lucide-react';

const STATUS_CONFIG = {
  active: {
    label: 'En tratamiento activo',
    icon: CheckCircle,
    className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50',
  },
  pending_evaluation: {
    label: 'Próxima evaluación pendiente',
    icon: AlertTriangle,
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50',
  },
  no_appointments: {
    label: 'Sin citas agendadas',
    icon: XCircle,
    className: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-50',
  },
};

/**
 * Calcula el estado del tratamiento basado en data real.
 * No depende de un campo manual — se autocalcula.
 */
const resolveStatus = ({ appointments = [], therapist = null }) => {
  // Sin terapeuta asignado → sin citas
  if (!therapist) return 'no_appointments';

  // Filtrar citas futuras activas
  const now = new Date();
  const upcoming = appointments.filter((apt) => {
    try {
      const aptDate = new Date(apt.date);
      return aptDate >= now && ['scheduled', 'confirmed'].includes(apt.status);
    } catch {
      return false;
    }
  });

  if (upcoming.length === 0) return 'no_appointments';

  // Si hay citas pero ninguna confirmada → evaluación pendiente
  const hasConfirmed = upcoming.some((apt) => apt.status === 'confirmed');
  if (!hasConfirmed) return 'pending_evaluation';

  return 'active';
};

const TreatmentStatusBadge = ({ appointments, therapist, statusOverride = null }) => {
  const status = statusOverride || resolveStatus({ appointments, therapist });
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.no_appointments;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`${config.className} font-medium text-xs py-1 px-2.5 gap-1.5`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

export { resolveStatus };
export default TreatmentStatusBadge;