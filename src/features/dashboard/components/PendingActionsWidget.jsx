/**
 * PendingActionsWidget.jsx
 *
 * Muestra al terapeuta qué le falta del loop diario:
 *   - Sesiones sin nota clínica
 *   - Sesiones sin pago registrado
 *   - Pacientes activos sin próxima cita
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  DollarSign,
  CalendarPlus,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PendingActionsWidget = ({ pendingActions, onBookAppointment }) => {
  const navigate = useNavigate();

  if (!pendingActions) return null;

  const { undocumented = [], unpaid = [], noFollowUp = [] } = pendingActions;
  const totalPending = undocumented.length + unpaid.length + noFollowUp.length;

  if (totalPending === 0) return null;

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          Pendientes ({totalPending})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {undocumented.length > 0 && (
          <PendingRow
            icon={FileText}
            color="text-blue-600 bg-blue-100"
            count={undocumented.length}
            label={undocumented.length === 1 ? 'sesión sin nota clínica' : 'sesiones sin nota clínica'}
            items={undocumented.map(a => ({
              id: a.id,
              name: a.patient?.profile?.full_name || 'Paciente',
              detail: a.date,
            }))}
            onAction={(item) => navigate(`/dashboard/patients/${undocumented.find(u => u.id === item.id)?.patient_id}`)}
          />
        )}

        {unpaid.length > 0 && (
          <PendingRow
            icon={DollarSign}
            color="text-orange-600 bg-orange-100"
            count={unpaid.length}
            label={unpaid.length === 1 ? 'sesión sin pago registrado' : 'sesiones sin pago registrado'}
            items={unpaid.map(a => ({
              id: a.id,
              name: a.patient?.profile?.full_name || 'Paciente',
              detail: a.date,
            }))}
            onAction={(item) => navigate(`/dashboard/patients/${unpaid.find(u => u.id === item.id)?.patient_id}`)}
          />
        )}

        {noFollowUp.length > 0 && (
          <PendingRow
            icon={CalendarPlus}
            color="text-purple-600 bg-purple-100"
            count={noFollowUp.length}
            label={noFollowUp.length === 1 ? 'paciente sin próxima cita' : 'pacientes sin próxima cita'}
            items={noFollowUp.map(p => ({
              id: p.id,
              name: p.profile?.full_name || 'Paciente',
              detail: 'Sin cita agendada',
            }))}
            onAction={(item) => onBookAppointment ? onBookAppointment(item.id) : navigate('/dashboard/calendar')}
          />
        )}
      </CardContent>
    </Card>
  );
};

const PendingRow = ({ icon: Icon, color, count, label, items, onAction }) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="rounded-lg bg-white border border-gray-100 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className={cn('h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0', color)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-900">{count}</span>{' '}
          <span className="text-sm text-gray-600">{label}</span>
        </div>
        <ChevronRight
          className={cn(
            'h-4 w-4 text-gray-400 transition-transform flex-shrink-0',
            expanded && 'rotate-90'
          )}
        />
      </button>
      {expanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {items.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-center justify-between px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                <p className="text-xs text-gray-500">{item.detail}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary flex-shrink-0"
                onClick={() => onAction(item)}
              >
                Ver
              </Button>
            </div>
          ))}
          {items.length > 5 && (
            <p className="text-xs text-gray-400 text-center py-2">
              y {items.length - 5} más...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PendingActionsWidget;
