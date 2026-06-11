/**
 * @file src/features/patient-file/components/PatientSummaryTab.jsx
 *
 * Spec 030 Tab Resumen — vista cabecera del paciente para el dentista.
 *
 * Muestra a primera vista lo crítico para la próxima sesión:
 *   - Datos identificatorios (nombre, RUT, contacto, edad)
 *   - 4 cards: progreso del tratamiento + saldo pendiente + próxima cita + alertas médicas
 *   - Lista de próximas 3 citas
 *
 * Lee de:
 *   - patient prop (cargado por PatientFilePage)
 *   - treatment_budgets activos + items (calcula % progreso)
 *   - v_budget_balance (saldo pendiente)
 *   - appointments futuras (próximas 3)
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Calendar,
  CircleDollarSign,
  AlertCircle,
  Phone,
  Mail,
  CreditCard,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { format, parseISO, differenceInYears, isAfter, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import logger from '@/lib/utils/logger';

const formatCLP = (n) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  try {
    return differenceInYears(new Date(), parseISO(birthDate));
  } catch {
    return null;
  }
};

export default function PatientSummaryTab({ patient, appointments = [], onSwitchTab }) {
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patient?.id) return;
    (async () => {
      setLoading(true);
      try {
        // Budget activo (más reciente en estado borrador/enviado/aceptado/en_progreso)
        const { data: budgets, error: bErr } = await supabase
          .from('treatment_budgets')
          .select(`
            id, title, status, total,
            items:treatment_budget_items(id, status)
          `)
          .eq('patient_id', patient.id)
          .in('status', ['borrador', 'enviado', 'aceptado', 'en_progreso'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (bErr) throw bErr;

        let balanceDue = 0;
        let totalPaid = 0;
        let itemsCompleted = 0;
        let itemsTotal = 0;

        if (budgets) {
          itemsTotal = budgets.items?.length || 0;
          itemsCompleted = (budgets.items || []).filter((i) => i.status === 'completed').length;

          // Saldo via v_budget_balance
          const { data: balance } = await supabase
            .from('v_budget_balance')
            .select('balance_due, total_paid')
            .eq('budget_id', budgets.id)
            .maybeSingle();

          balanceDue = Number(balance?.balance_due) || 0;
          totalPaid = Number(balance?.total_paid) || 0;
        }

        setBudgetData({
          budget: budgets,
          balanceDue,
          totalPaid,
          itemsCompleted,
          itemsTotal,
          progress: itemsTotal > 0 ? Math.round((itemsCompleted / itemsTotal) * 100) : 0,
        });
      } catch (err) {
        logger.warn('[PatientSummaryTab] load failed', { message: err.message });
        setBudgetData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [patient?.id]);

  if (!patient) return null;

  const today = startOfToday();
  const upcomingAppointments = (appointments || [])
    .filter((a) => {
      try {
        return isAfter(parseISO(a.date), today) && a.status !== 'cancelled';
      } catch {
        return false;
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date) || (a.start_time || '').localeCompare(b.start_time || ''))
    .slice(0, 3);

  const nextAppointment = upcomingAppointments[0];
  const age = calculateAge(patient.birth_date);

  const allergies = (patient.allergies || '').trim();
  const medications = (patient.medications || '').trim();
  const hasMedicalAlerts = Boolean(allergies || medications);

  return (
    <div className="space-y-4">
      {/* ═════ Header datos identificatorios ═════ */}
      <Card>
        <CardContent className="pt-6 pb-5">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {(patient.full_name || '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold flex items-center gap-2 flex-wrap">
                {patient.full_name}
                {age !== null && (
                  <Badge variant="secondary" className="text-xs">
                    {age} años
                  </Badge>
                )}
              </h2>
              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {patient.rut && (
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>{patient.rut}</span>
                  </div>
                )}
                {patient.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{patient.phone}</span>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═════ 4 cards de overview ═════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Progreso tratamiento */}
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onSwitchTab?.('presupuestos')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Progreso tratamiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : budgetData?.budget ? (
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold">{budgetData.progress}%</span>
                  <span className="text-xs text-muted-foreground">
                    {budgetData.itemsCompleted}/{budgetData.itemsTotal}
                  </span>
                </div>
                <Progress value={budgetData.progress} className="h-1.5" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin presupuesto activo</p>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Saldo pendiente */}
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onSwitchTab?.('pagos')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <CircleDollarSign className="h-3.5 w-3.5" />
              Saldo pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : budgetData?.budget ? (
              <div className="space-y-0.5">
                <p
                  className={`text-2xl font-bold ${
                    budgetData.balanceDue > 0 ? 'text-amber-600' : 'text-green-600'
                  }`}
                >
                  {formatCLP(budgetData.balanceDue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Pagado: {formatCLP(budgetData.totalPaid)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Próxima cita */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Próxima cita
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextAppointment ? (
              <div className="space-y-0.5">
                <p className="text-lg font-semibold">
                  {format(parseISO(nextAppointment.date), "d 'de' MMM", { locale: es })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {nextAppointment.start_time?.slice(0, 5) || '—'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay citas futuras</p>
            )}
          </CardContent>
        </Card>

        {/* Card 4: Alertas médicas */}
        <Card className={hasMedicalAlerts ? 'border-amber-300 bg-amber-50/40' : ''}>
          <CardHeader className="pb-2">
            <CardTitle
              className={`text-xs font-medium flex items-center gap-1.5 ${
                hasMedicalAlerts ? 'text-amber-700' : 'text-muted-foreground'
              }`}
            >
              <AlertCircle className="h-3.5 w-3.5" />
              Alertas médicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasMedicalAlerts ? (
              <div className="space-y-0.5 text-xs">
                {allergies && (
                  <p>
                    <span className="font-semibold text-amber-800">Alergias:</span>{' '}
                    <span className="text-amber-900">{allergies}</span>
                  </p>
                )}
                {medications && (
                  <p>
                    <span className="font-semibold text-amber-800">Medicación:</span>{' '}
                    <span className="text-amber-900">{medications}</span>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin registros</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═════ Próximas citas (lista) ═════ */}
      {upcomingAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Próximas {upcomingAppointments.length} cita{upcomingAppointments.length > 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y">
              {upcomingAppointments.map((apt) => (
                <div key={apt.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {format(parseISO(apt.date), "EEEE d 'de' MMMM", { locale: es })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {apt.start_time?.slice(0, 5) || '—'}
                      {apt.end_time && ` – ${apt.end_time.slice(0, 5)}`}
                      {apt.session_topic && ` · ${apt.session_topic}`}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {apt.status === 'scheduled' && 'Agendada'}
                    {apt.status === 'confirmed' && 'Confirmada'}
                    {apt.status === 'in_progress' && 'En curso'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═════ Medical history (si hay) ═════ */}
      {patient.medical_history && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Historia médica relevante
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{patient.medical_history}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
