import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UserX, 
  Phone, 
  CalendarPlus, 
  ChevronRight,
  AlertTriangle 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

const getRiskLevel = (daysWithout) => {
  if (daysWithout >= 30) return { label: 'Crítico', className: 'bg-red-50 text-red-700 border-red-200' };
  if (daysWithout >= 14) return { label: 'Alto', className: 'bg-orange-50 text-orange-700 border-orange-200' };
  return { label: 'Moderado', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
};

const PatientsAtRisk = ({ patients = [], onContact, onSchedule }) => {

  // ========== EMPTY STATE ==========
  if (patients.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <Card className="border border-gray-100">
          <CardContent className="py-6 text-center">
            <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
              <UserX className="h-5 w-5 text-green-400" />
            </div>
            <p className="text-gray-600 font-medium text-sm">
              Sin pacientes en riesgo
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Todos tus pacientes tienen seguimiento activo. ¡Buen trabajo!
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ========== AGRUPAR POR MOTIVO ==========
  const noFollowUp = patients.filter(p => p.riskType === 'no_followup');
  const multipleCancellations = patients.filter(p => p.riskType === 'cancellations');
  const noSecondAppointment = patients.filter(p => p.riskType === 'no_second');

  const groups = [
    { key: 'no_followup', label: 'Sin cita hace +14 días', patients: noFollowUp, icon: UserX },
    { key: 'cancellations', label: '2+ cancelaciones recientes', patients: multipleCancellations, icon: AlertTriangle },
    { key: 'no_second', label: 'Nuevos sin 2da cita', patients: noSecondAppointment, icon: CalendarPlus },
  ].filter(g => g.patients.length > 0);

  // ========== CON DATOS ==========
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.25 }}
    >
      <Card className="border border-gray-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <UserX className="h-4 w-4 text-red-500" />
            Pacientes en riesgo
            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-xs ml-auto">
              {patients.length}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 pt-1">
          {groups.map((group) => {
            const GroupIcon = group.icon;

            return (
              <div key={group.key}>
                {/* Group header */}
                <div className="flex items-center gap-1.5 mb-2">
                  <GroupIcon className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500">
                    {group.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({group.patients.length})
                  </span>
                </div>

                {/* Patient items */}
                <div className="space-y-1.5">
                  {group.patients.slice(0, 3).map((patient, index) => {
                    const daysWithout = patient.lastAppointmentDate
                      ? differenceInDays(new Date(), typeof patient.lastAppointmentDate === 'string' ? parseISO(patient.lastAppointmentDate) : patient.lastAppointmentDate)
                      : null;

                    const risk = daysWithout ? getRiskLevel(daysWithout) : null;

                    return (
                      <div
                        key={patient.id || index}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        {/* Name + meta */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {patient.name || 'Paciente'}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {daysWithout !== null
                              ? `Última cita hace ${daysWithout} días`
                              : patient.detail || 'Sin cita registrada'
                            }
                            {patient.therapistName && ` · ${patient.therapistName}`}
                          </p>
                        </div>

                        {/* Risk badge */}
                        {risk && (
                          <Badge variant="outline" className={`text-[10px] py-0 px-1.5 shrink-0 ${risk.className}`}>
                            {risk.label}
                          </Badge>
                        )}

                        {/* Actions */}
                        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
                            onClick={() => onContact?.(patient)}
                            title="Contactar"
                          >
                            <Phone className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-gray-400 hover:text-teal-600"
                            onClick={() => onSchedule?.(patient)}
                            title="Agendar cita"
                          >
                            <CalendarPlus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Ver más */}
                  {group.patients.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-gray-400 hover:text-gray-600 h-7"
                    >
                      Ver {group.patients.length - 3} más
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PatientsAtRisk;