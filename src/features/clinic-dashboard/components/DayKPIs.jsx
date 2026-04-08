import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  CalendarCheck, 
  CalendarX, 
  UserCheck, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';
import { motion } from 'framer-motion';

const KPI_CONFIG = [
  {
    key: 'patientsToday',
    label: 'Pacientes hoy',
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    key: 'confirmedToday',
    label: 'Citas confirmadas',
    icon: CalendarCheck,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-100',
  },
  {
    key: 'cancellationsToday',
    label: 'Cancelaciones',
    icon: CalendarX,
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-100',
  },
  {
    key: 'activeTherapists',
    label: 'Terapeutas activos',
    icon: UserCheck,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-100',
  },
  {
    key: 'emptySlots',
    label: 'Cupos vacíos',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
  {
    key: 'criticalPending',
    label: 'Pendientes críticos',
    icon: AlertTriangle,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
  },
];

const DayKPIs = ({ data = {} }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {KPI_CONFIG.map((kpi, index) => {
        const Icon = kpi.icon;
        const value = data[kpi.key] ?? 0;
        const delta = data[`${kpi.key}Delta`] ?? null;
        const subtext = data[`${kpi.key}Sub`] ?? null;

        return (
          <motion.div
            key={kpi.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
          >
            <Card className={`border ${kpi.border} hover:shadow-sm transition-shadow cursor-default`}>
              <CardContent className="p-3">
                {/* Icon + Label */}
                <div className="flex items-center gap-1.5 mb-2">
                  <div className={`h-6 w-6 rounded-md ${kpi.bg} flex items-center justify-center`}>
                    <Icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                  </div>
                  <span className="text-xs text-gray-500 font-medium truncate">
                    {kpi.label}
                  </span>
                </div>

                {/* Value */}
                {value > 0 ? (
                  <p className="text-2xl font-bold text-gray-900 leading-none">
                    {value}
                  </p>
                ) : (
                  <p className="text-lg font-semibold text-gray-300 leading-none">
                    —
                  </p>
                )}

                {/* Delta / Subtext */}
                <div className="mt-1 h-4">
                  {value === 0 ? (
                    <span className="text-xs text-gray-400">Se actualiza con actividad</span>
                  ) : delta !== null && delta !== 0 ? (
                    <span className={`text-xs font-medium ${
                      kpi.key === 'cancellationsToday' || kpi.key === 'criticalPending'
                        ? (delta > 0 ? 'text-red-500' : 'text-green-600')
                        : (delta > 0 ? 'text-green-600' : 'text-red-500')
                    }`}>
                      {delta > 0 ? '↑' : '↓'} {Math.abs(delta)} vs ayer
                    </span>
                  ) : subtext ? (
                    <span className="text-xs text-gray-400">{subtext}</span>
                  ) : (
                    <span className="text-xs text-gray-400">Sin cambios</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default DayKPIs;