import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  UserX, 
  TrendingDown, 
  Clock, 
  CalendarX,
  CheckCircle,
  ChevronRight 
} from 'lucide-react';
import { motion } from 'framer-motion';

const ALERT_TYPES = {
  patients_no_followup: {
    icon: UserX,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-red-500',
    priority: 1,
  },
  high_cancellation: {
    icon: TrendingDown,
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    dot: 'bg-yellow-500',
    priority: 2,
  },
  empty_slots_today: {
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    priority: 3,
  },
  unconfirmed_appointments: {
    icon: CalendarX,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
    priority: 4,
  },
};

const CriticalAlerts = ({ alerts = [], onAction }) => {
  // Ordenar por prioridad
  const sorted = [...alerts].sort((a, b) => {
    const pa = ALERT_TYPES[a.type]?.priority ?? 99;
    const pb = ALERT_TYPES[b.type]?.priority ?? 99;
    return pa - pb;
  });

  // ========== SIN ALERTAS ==========
  if (sorted.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <Card className="border border-green-100 bg-green-50/30">
          <CardContent className="py-4 px-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Sin alertas críticas hoy
                </p>
                <p className="text-xs text-green-600">
                  Tu centro está operando dentro de parámetros normales.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ========== CON ALERTAS ==========
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      <Card className="border border-orange-200 bg-gradient-to-r from-orange-50/50 to-red-50/30">
        <CardContent className="py-4 px-5">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-bold text-gray-900">
              {sorted.length} situación{sorted.length > 1 ? 'es' : ''} requiere{sorted.length > 1 ? 'n' : ''} acción hoy
            </span>
          </div>

          {/* Alert items */}
          <div className="space-y-2">
            {sorted.map((alert, index) => {
              const config = ALERT_TYPES[alert.type] || ALERT_TYPES.empty_slots_today;
              const Icon = config.icon;

              return (
                <div
                  key={alert.id || index}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${config.border} ${config.bg} group`}
                >
                  {/* Dot + Icon */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`h-2 w-2 rounded-full ${config.dot}`} />
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>

                  {/* Message */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {alert.title}
                    </p>
                    {alert.detail && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {alert.detail}
                      </p>
                    )}
                  </div>

                  {/* Action */}
                  {alert.actionLabel && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`shrink-0 text-xs font-semibold ${config.color} opacity-70 group-hover:opacity-100 transition-opacity`}
                      onClick={() => onAction?.(alert)}
                    >
                      {alert.actionLabel}
                      <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CriticalAlerts;