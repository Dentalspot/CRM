/**
 * AgendaSidebar.jsx
 *
 * Sidebar de la agenda con:
 * - Selector de clínica (con colores)
 * - Resumen de hoy (total, completadas, canceladas, ausentes)
 * - Próximas citas
 * - Acciones rápidas
 */

import React from 'react';
import { format } from 'date-fns';
import {
  MapPin,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Ban,
  Users,
  Lightbulb,
  XCircle,
  UserX,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getClinicColor } from './WeeklyAgendaView';
import MiniMonthCalendar from './MiniMonthCalendar';

// Mismos estados disponibles que en UpcomingAppointmentCard.
const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Programada' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'completed', label: 'Completada' },
  { value: 'no-show', label: 'Ausente' },
  { value: 'cancelled', label: 'Cancelada' },
];

const AgendaSidebar = ({
  clinics = [],
  selectedClinicId,
  onClinicChange,
  appointments = [],
  onRefresh,
  onBlockTime,
  onNewAppointment,
  onStatusChange,
  currentWeek,
  onWeekChange,
  organizationId,
  userId,
  boxes = [],
  selectedBoxId = 'all',
  onBoxChange,
  className
}) => {
  const navigate = useNavigate();

  // Use local date to avoid timezone issues with format()
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const todayAppointments = appointments.filter(appt => {
    // Compare date strings directly to avoid timezone issues
    if (appt.date) return appt.date === todayStr;
    if (appt.start_time) {
      try { return format(new Date(appt.start_time), 'yyyy-MM-dd') === todayStr; } catch { return false; }
    }
    return false;
  });

  const stats = {
    total: todayAppointments.length,
    completed: todayAppointments.filter(a => a.status === 'completed').length,
    scheduled: todayAppointments.filter(a => ['scheduled', 'confirmed'].includes(a.status)).length,
    canceled: todayAppointments.filter(a => a.status === 'canceled' || a.status === 'cancelled').length,
    noShow: todayAppointments.filter(a => a.status === 'no-show').length,
  };

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

  const weekAppointmentsCount = appointments.length;

  return (
    <div className={cn("flex flex-col h-full gap-4", className)}>

      {/* 0) Mini calendario mensual. Arriba de todo (order 0) — permite
          saltar rápidamente a cualquier semana pasada/futura sin tener
          que paginar semana a semana en la agenda principal. */}
      {currentWeek && onWeekChange && (
        <div className="order-0 lg:order-0">
          <MiniMonthCalendar currentWeek={currentWeek} onWeekChange={onWeekChange} />
        </div>
      )}

      {/* 0) Today's appointments card. Desktop order 2 (después de Ubicación). */}
      <Card className="order-2 lg:order-2 shadow-sm border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700">
            <CalendarIcon className="h-4 w-4" />
            Citas de Hoy
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-1 space-y-2">
          {todayAppointments.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">Sin citas para hoy</p>
          ) : (
            todayAppointments
              .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
              .map((appt, i) => {
                const timeStr = appt.start_time?.substring(0, 5) || '--:--';
                const patientName = appt.patient?.profile?.full_name || appt.patient?.full_name || 'Paciente';
                const serviceName = appt.service?.service_name || null;
                const statusLabel = { completed: 'Completada', confirmed: 'Confirmada', canceled: 'Cancelada', cancelled: 'Cancelada', 'no-show': 'Ausente' }[appt.status] || 'Programada';
                // Badges con fondo de color suave + texto fuerte → más legible
                // que solo border (especialmente en mobile).
                const statusColor = {
                  completed: 'bg-green-100 text-green-700 border-green-200',
                  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
                  canceled: 'bg-red-100 text-red-700 border-red-200',
                  cancelled: 'bg-red-100 text-red-700 border-red-200',
                  'no-show': 'bg-amber-100 text-amber-800 border-amber-200',
                }[appt.status] || 'bg-sky-100 text-sky-700 border-sky-200';
                const patientId = appt.patient?.id;
                return (
                  <div key={appt.id || i} className="flex items-start gap-2 py-1.5 border-b border-blue-50 last:border-0">
                    <div className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 mt-0.5">
                      {timeStr}
                    </div>
                    <div className="min-w-0 flex-1">
                      {/* Nombre como link a la ficha clínica del paciente. */}
                      {patientId ? (
                        <Link
                          to={`/dashboard/patients/${patientId}/clinical-history`}
                          className="text-xs font-medium text-gray-800 truncate block hover:text-primary hover:underline transition-colors"
                          title={`Ver ficha de ${patientName}`}
                        >
                          {patientName}
                        </Link>
                      ) : (
                        <p className="text-xs font-medium text-gray-800 truncate">{patientName}</p>
                      )}
                      {serviceName && (
                        <p className="text-[10px] text-gray-500 truncate">{serviceName}</p>
                      )}
                    </div>
                    {/* Badge clickable para cambiar el estado. Si no se pasó
                        onStatusChange, queda como Badge plano (read-only). */}
                    {onStatusChange && appt.id ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label={`Cambiar estado (actual: ${statusLabel})`}
                            className={cn(
                              "inline-flex items-center gap-0.5 text-[9px] px-1 py-0 h-4 rounded-full border font-semibold shrink-0",
                              "transition-colors hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary/40",
                              statusColor
                            )}
                          >
                            <span>{statusLabel}</span>
                            <ChevronDown className="w-2.5 h-2.5 opacity-70" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          {STATUS_OPTIONS.map((opt) => {
                            const isCurrent = opt.value === appt.status
                              || (opt.value === 'cancelled' && appt.status === 'canceled');
                            return (
                              <DropdownMenuItem
                                key={opt.value}
                                disabled={isCurrent}
                                onClick={() => { if (!isCurrent) onStatusChange(appt.id, opt.value); }}
                                className={cn('text-xs cursor-pointer', isCurrent && 'font-semibold')}
                              >
                                {opt.label}
                                {isCurrent && <span className="ml-auto text-[10px] opacity-60">(actual)</span>}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Badge variant="outline" className={cn("text-[9px] px-1 py-0 shrink-0", statusColor)}>
                        {statusLabel}
                      </Badge>
                    )}
                  </div>
                );
              })
          )}
        </CardContent>
      </Card>

      {/* 1) Ubicación + Box selector. Order 1 (primero del sidebar).
          Fondo teal sólido con texto blanco para destacar visualmente. */}
      <Card className="order-1 lg:order-1 shadow-sm border-2 border-primary bg-primary text-white">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
            <MapPin className="h-4 w-4 text-white" />
            Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-2">
          {/* Selector de sucursal — cada sucursal tiene su agenda independiente
              (cada una con sus propios boxes y horarios). No hay opción
              "Todas las clínicas" porque mezclar agendas no tiene sentido
              operacional. Default a la primera sucursal (auto-set en CalendarPage). */}
          <Select
            value={selectedClinicId?.toString() || ''}
            onValueChange={onClinicChange}
          >
            <SelectTrigger className="bg-white text-slate-900 border-white">
              <SelectValue placeholder="Seleccionar clínica" />
            </SelectTrigger>
            <SelectContent>
              {clinics.map((clinic) => {
                const color = getClinicColor(clinic.id, clinics);
                return (
                  <SelectItem key={clinic.id} value={clinic.id}>
                    <div className="flex items-center gap-2">
                      {color && <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", color.dot)} />}
                      {clinic.name}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Box selector — cada box tiene su agenda independiente.
              No hay opción "Todos los boxes" porque la user no quiere
              mezclar agendas en una sola vista (decisión de producto).
              Default al primer box (auto-seteado en CalendarPage). */}
          {boxes.length > 0 && (
            <Select value={selectedBoxId || ''} onValueChange={onBoxChange}>
              <SelectTrigger className="bg-white text-slate-900 border-white">
                <SelectValue placeholder="Seleccionar box" />
              </SelectTrigger>
              <SelectContent>
                {boxes.map((box) => (
                  <SelectItem key={box.id} value={box.id}>
                    {box.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex justify-between items-center text-sm pt-1">
            <span className="text-white/80">Esta semana</span>
            <span className="font-semibold text-white">{weekAppointmentsCount} citas</span>
          </div>
        </CardContent>
      </Card>

      {/* 3) Next Appointments. Mobile order 5, Desktop order 4. */}
      {nextAppointments.length > 0 && (
        <Card className="order-5 lg:order-4 shadow-none border bg-white/50">
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

              const patientName = appt.patients?.full_name || appt.patient?.full_name || appt.patient?.profile?.full_name || 'Paciente';

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

      <Separator className="order-6 lg:order-5 opacity-50 hidden lg:block" />

      {/* 4) Quick Actions. Mobile order 4, Desktop order 6. */}
      <div className="order-4 lg:order-6 space-y-2">
        <label className="text-xs font-medium text-muted-foreground ml-1">
          Acciones Rápidas
        </label>
        <div className="grid gap-2">
          <Button
            variant="default"
            size="sm"
            className="w-full justify-start gap-2 h-10 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={onNewAppointment}
          >
            <Plus className="h-4 w-4" />
            Agendar Cita
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

      <div className="hidden lg:block flex-1 order-7" />

      {/* 5) Tip Card. Mobile order 7 (al final), Desktop order 8. */}
      <Card className="order-7 lg:order-8 bg-yellow-50 border-yellow-100 mt-auto shadow-none">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-yellow-700">Tip</p>
              <p className="text-[11px] text-yellow-700/80 leading-snug">
                Arrastra las citas para reprogramarlas. Arrastra sobre slots vacíos para crear bloqueos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgendaSidebar;
