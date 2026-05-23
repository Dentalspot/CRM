import React, { useEffect, useState, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Loader2, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import logger from '@/lib/utils/logger';

/**
 * @file src/components/calendar/BoxOccupancyPanel.jsx
 *
 * Panel lateral con ocupación de un box específico para la semana actual.
 * Permite al dentista (o clinic_admin) ver quiénes están usando un box
 * específico para coordinar uso del recurso físico.
 *
 * Props:
 *  - organizationId: string — org actual
 *  - currentWeek: Date — primer día (lunes) de la semana
 *  - userId: string — para destacar citas propias
 *
 * Comportamiento RLS:
 *  - Si user es clinic_admin → ve TODAS las citas del box (todos los dentistas)
 *  - Si user es solo dentista → ve solo SUS propias citas en ese box
 *    (degradación graceful, no es regresión)
 *
 * Para extender a "dentista invitado ve ocupación del equipo", agregar
 * policy futura sobre appointments. Hoy intencionalmente no se hace
 * para no exponer toda la agenda de la org a dentistas no-admins.
 */

const BOX_TYPE_LABEL = {
  general: 'General',
  ortodoncia: 'Ortodoncia',
  cirugia: 'Cirugía',
  radiologia: 'Radiología',
  otro: 'Otro',
};

const STATUS_LABEL = {
  scheduled: 'Programada',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  'no-show': 'Ausente',
};

const STATUS_COLOR = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500 line-through',
  'no-show': 'bg-amber-100 text-amber-700',
};

const BoxOccupancyPanel = ({ organizationId, currentWeek, userId }) => {
  const [boxes, setBoxes] = useState([]);
  const [selectedBoxId, setSelectedBoxId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loadingBoxes, setLoadingBoxes] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Cargar boxes de la org activa
  useEffect(() => {
    if (!organizationId) {
      setBoxes([]);
      return;
    }
    let cancelled = false;
    setLoadingBoxes(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('clinic_boxes')
          .select('id, name, box_type, clinic_id, clinics:clinic_id (name)')
          .eq('organization_id', organizationId)
          .eq('is_active', true)
          .order('name');
        if (error) throw error;
        if (!cancelled) setBoxes(data || []);
      } catch (err) {
        logger.warn('[BoxOccupancyPanel] load boxes:', err.message);
        if (!cancelled) setBoxes([]);
      } finally {
        if (!cancelled) setLoadingBoxes(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  // Cargar citas del box seleccionado para la semana
  useEffect(() => {
    if (!selectedBoxId || !currentWeek) {
      setAppointments([]);
      return;
    }
    let cancelled = false;
    setLoadingAppointments(true);
    (async () => {
      try {
        const weekStart = format(currentWeek, 'yyyy-MM-dd');
        const weekEnd = format(addDays(currentWeek, 6), 'yyyy-MM-dd');
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            id, date, start_time, end_time, status, therapist_id, patient_id,
            therapist:profiles!appointments_therapist_id_fkey(full_name),
            patient:patients!appointments_patient_id_fkey(
              full_name,
              profile:profiles!patients_profile_id_fkey(full_name)
            )
          `)
          .eq('box_id', selectedBoxId)
          .gte('date', weekStart)
          .lte('date', weekEnd)
          .neq('status', 'cancelled')
          .order('date')
          .order('start_time');
        if (error) throw error;
        if (!cancelled) setAppointments(data || []);
      } catch (err) {
        logger.warn('[BoxOccupancyPanel] load appointments:', err.message);
        if (!cancelled) setAppointments([]);
      } finally {
        if (!cancelled) setLoadingAppointments(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedBoxId, currentWeek]);

  const groupedByDay = useMemo(() => {
    const groups = {};
    for (const apt of appointments) {
      if (!groups[apt.date]) groups[apt.date] = [];
      groups[apt.date].push(apt);
    }
    return groups;
  }, [appointments]);

  const sortedDates = useMemo(() => Object.keys(groupedByDay).sort(), [groupedByDay]);

  if (boxes.length === 0 && !loadingBoxes) {
    // No mostrar el panel si la org no tiene boxes (early return)
    return null;
  }

  return (
    <Card className="border-purple-100">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Settings className="h-4 w-4 text-purple-600" />
          Ocupación de Box
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {loadingBoxes ? (
          <div className="h-9 rounded-md bg-muted/40 animate-pulse" />
        ) : (
          <Select
            value={selectedBoxId || ''}
            onValueChange={(v) => setSelectedBoxId(v || null)}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Elegí un box..." />
            </SelectTrigger>
            <SelectContent>
              {boxes.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  <span>{b.name}</span>
                  <span className="text-xs text-muted-foreground ml-1">
                    · {BOX_TYPE_LABEL[b.box_type] || b.box_type}
                    {b.clinics?.name ? ` · ${b.clinics.name}` : ''}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedBoxId && (
          <>
            {loadingAppointments ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : sortedDates.length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground italic">
                <Calendar className="h-8 w-8 mx-auto mb-1 opacity-40" />
                Sin citas en este box esta semana
              </div>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {sortedDates.map((date) => (
                  <div key={date}>
                    <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1 px-1">
                      {format(new Date(`${date}T00:00:00`), "EEE d 'de' MMM", { locale: es })}
                    </div>
                    <div className="space-y-1">
                      {groupedByDay[date].map((apt) => {
                        const isOwn = apt.therapist_id === userId;
                        const patientName =
                          apt.patient?.profile?.full_name ||
                          apt.patient?.full_name ||
                          'Sin paciente';
                        const therapistName = apt.therapist?.full_name || 'Sin asignar';
                        const startTime = apt.start_time?.slice(0, 5) || '';
                        const endTime = apt.end_time?.slice(0, 5) || '';
                        return (
                          <div
                            key={apt.id}
                            className={cn(
                              'rounded-md px-2 py-1.5 text-xs border',
                              isOwn
                                ? 'bg-primary/10 border-primary/30'
                                : 'bg-white border-gray-200'
                            )}
                          >
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="font-semibold text-gray-900">
                                {startTime}–{endTime}
                              </span>
                              <span
                                className={cn(
                                  'inline-block px-1.5 py-0 rounded-full text-[9px] font-medium',
                                  STATUS_COLOR[apt.status] || 'bg-gray-100 text-gray-600'
                                )}
                              >
                                {STATUS_LABEL[apt.status] || apt.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-700 truncate" title={therapistName}>
                              {isOwn ? '👤 Tú' : `🦷 ${therapistName}`}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate" title={patientName}>
                              {patientName}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BoxOccupancyPanel;
