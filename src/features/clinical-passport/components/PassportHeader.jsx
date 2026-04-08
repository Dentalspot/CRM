import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Stethoscope, Target, Activity } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-gray-100">
    <div className={`h-8 w-8 rounded-lg ${color} flex items-center justify-center shrink-0`}>
      <Icon className="h-4 w-4 text-white" />
    </div>
    <div>
      <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
    </div>
  </div>
);

const PassportHeader = ({ patientName, stats, isPatientView }) => {
  if (!stats) return null;

  const formatDate = (d) => {
    if (!d) return '—';
    try { return format(parseISO(d), 'd MMM yyyy', { locale: es }); } catch { return d; }
  };

  return (
    <Card className="border-0 bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isPatientView ? 'Mi Pasaporte Clínico' : `Pasaporte — ${patientName}`}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {stats.firstDate && stats.lastDate
                ? `${formatDate(stats.firstDate)} → ${formatDate(stats.lastDate)}`
                : 'Sin registros aún'
              }
            </p>
          </div>
          {isPatientView && (
            <Badge variant="outline" className="bg-white/80 text-teal-700 border-teal-200 shrink-0">
              Tu historia te pertenece
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <StatCard icon={Activity} label="Eventos totales" value={stats.totalEvents} color="bg-teal-500" />
          <StatCard icon={Calendar} label="Sesiones" value={stats.sessions} color="bg-cyan-500" />
          <StatCard icon={Stethoscope} label="Diagnósticos" value={stats.diagnoses} color="bg-blue-500" />
          <StatCard icon={Target} label="Planes" value={stats.plans} color="bg-purple-500" />
          <StatCard icon={Users} label="Terapeutas" value={stats.therapistCount} color="bg-amber-500" />
        </div>
      </CardContent>
    </Card>
  );
};

export default PassportHeader;