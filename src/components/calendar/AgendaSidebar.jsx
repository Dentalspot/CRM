/**
 * AgendaSidebar.jsx
 * 
 * Sidebar de la agenda con:
 * - Selector de clínica (principal)
 * - Resumen de hoy
 * - Próximas citas
 * - Acciones rápidas
 * - Tip
 * 
 * NOTA: El buscador de pacientes se movió al header de CalendarPage
 */

import React from 'react';
import { format } from 'date-fns';
import {
  MapPin,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  RefreshCw,
  Ban,
  Users,
  Lightbulb
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const AgendaSidebar = ({
  clinics = [],
  selectedClinicId,
  onClinicChange,
  appointments = [],
  onRefresh,
  onBlockTime,
  className
}) => {
  const navigate = useNavigate();

  // Stats calculation
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const todayAppointments = appointments.filter(appt => {
    if (!appt.date && !appt.start_time) return false;
    const apptDate = new Date(appt.date || appt.start_time);
    return format(apptDate, 'yyyy-MM-dd') === todayStr;
  });

  const stats = {
    total: todayAppointments.length,
    completed: todayAppointments.filter(a => a.status === 'completed').length,
    scheduled: todayAppointments.filter(a => ['scheduled', 'confirmed'].includes(a.status)).length,
  };

  // Next appointments (future ones today)
  const now = new Date();
  const nextAppointments = todayAppointments
    .filter(a => ['scheduled', 'confirmed'].includes(a.status))
    .filter(a => {
      if (a.date && typeof a.start_time === 'string' && a.start_time.includes(':')) {
        const [hours, minutes] = a.start_time.split(':');
        const d = new Date(a.date);
        d.setHours(parseInt(hours), parseInt(minutes));
        return d > now;
      }
      const start = new Date(a.date || a.start_time);
      return start > now;
    })
    .sort((a, b) => {
      const timeA = new Date(a.date + 'T' + a.start_time).getTime();
      const timeB = new Date(b.date + 'T' + b.start_time).getTime();
      return timeA - timeB;
    })
    .slice(0, 3);

  const handleViewAllPatients = () => {
    navigate('/dashboard/patients');
  };

  // Get selected clinic name for display
  const selectedClinicName = selectedClinicId === 'all'
    ? 'Todas las clínicas'
    : clinics.find(c => c.id === selectedClinicId)?.name || 'Seleccionar clínica';

  // Count appointments for this week for selected clinic
  const weekAppointmentsCount = appointments.length;

  return (
    <div className={cn("flex flex-col h-full gap-4", className)}>

      {/* 1) Clinic Selector - Principal */}
      <Card className="shadow-sm border-2 border-pink-100 bg-gradient-to-br from-pink-50 to-white">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-pink-700">
            <MapPin className="h-4 w-4" />
            Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-2">
          <Select
            value={selectedClinicId?.toString() || 'all'}
            onValueChange={onClinicChange}
          >
            <SelectTrigger className="bg-white border-pink-200 focus:ring-pink-300">
              <SelectValue placeholder="Seleccionar clínica" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las clínicas</SelectItem>
              {clinics.map((clinic) => (
                <SelectItem key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-pink-600">
            Mostrando disponibilidad y citas de esta clínica
          </p>
          <div className="flex justify-between items-center text-sm pt-1">
            <span className="text-slate-600">Esta semana</span>
            <span className="font-semibold text-slate-700">{weekAppointmentsCount} citas</span>
          </div>
        </CardContent>
      </Card>

      {/* 2) Today's Summary */}
      <Card className="shadow-none border bg-white/50">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-700">
            <CalendarIcon className="h-4 w-4 text-primary" />
            Resumen de Hoy
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">Total citas</span>
            <Badge variant="secondary" className="font-bold bg-slate-100 text-slate-700">
              {stats.total}
            </Badge>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-2 text-slate-500 text-xs">
              <CheckCircle2 className="h-3 w-3 text-green-500" /> Completadas
            </span>
            <span className="text-xs font-medium text-green-600">{stats.completed}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-2 text-slate-500 text-xs">
              <Clock className="h-3 w-3 text-blue-500" /> Programadas
            </span>
            <span className="text-xs font-medium text-blue-600">{stats.scheduled}</span>
          </div>
        </CardContent>
      </Card>

      {/* 3) Next Appointments */}
      {nextAppointments.length > 0 && (
        <Card className="shadow-none border bg-white/50">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm font-medium text-slate-700">
              Próximas Citas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {nextAppointments.map((appt, i) => {
              const timeStr = typeof appt.start_time === 'string' && appt.start_time.length >= 5
                ? appt.start_time.substring(0, 5)
                : '--:--';

              const patientName = appt.patients?.full_name || appt.patient?.full_name || 'Paciente';

              return (
                <div key={appt.id || i} className="flex items-center gap-2 text-sm group cursor-default">
                  <div className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0">
                    {timeStr}
                  </div>
                  <span
                    className="truncate text-slate-600 text-xs flex-1 group-hover:text-slate-900 transition-colors"
                    title={patientName}
                  >
                    {patientName}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Separator className="opacity-50" />

      {/* 4) Quick Actions */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground ml-1">
          Acciones Rápidas
        </label>
        <div className="grid gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 bg-white h-9"
            onClick={onRefresh}
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            Actualizar Agenda
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 bg-white h-9 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
            onClick={onBlockTime}
          >
            <Ban className="h-3.5 w-3.5" />
            Bloquear Horarios
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 bg-white h-9"
            onClick={handleViewAllPatients}
          >
            <Users className="h-3.5 w-3.5 text-slate-500" />
            Ver Todos los Pacientes
          </Button>
        </div>
      </div>

      <div className="flex-1" />

      {/* 5) Tip Card */}
      <Card className="bg-yellow-50 border-yellow-100 mt-auto shadow-none">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-yellow-700">Tip</p>
              <p className="text-[11px] text-yellow-700/80 leading-snug">
                Arrastra las citas para reprogramarlas. Haz clic en un bloqueo para editarlo o eliminarlo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgendaSidebar;