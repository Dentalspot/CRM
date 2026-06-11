/**
 * @file src/features/patient-dashboard/pages/MyTreatmentPage.jsx
 *
 * Spec 030 Bloque 3 — vista paciente "Mi tratamiento".
 *
 * Solange entra a su dashboard, ve:
 *   - Barra de progreso del plan (% completado)
 *   - Lista de intervenciones (hecho vs pendiente)
 *   - Resumen económico (pagado vs por pagar)
 *   - Indicaciones del dentista de las últimas sesiones (FUT-2)
 *
 * Sin notas técnicas — solo lo que el paciente debe saber.
 * El split definitivo público/privado viene en Bloque 4.
 */

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Loader2,
  CheckCircle2,
  Circle,
  Wallet,
  CalendarDays,
  Lightbulb,
  ClipboardList,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import {
  getMyTreatmentOverview,
  getMyBudgetDetail,
} from '../api/patientTreatmentApi';

const formatDateChile = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

const MyTreatmentPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [selectedBudgetId, setSelectedBudgetId] = useState(null);
  const [items, setItems] = useState([]);
  const [balance, setBalance] = useState(null);

  // Initial fetch
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    getMyTreatmentOverview(user.id)
      .then((data) => {
        if (cancelled) return;
        setOverview(data);
        if (data.selectedBudget) {
          setSelectedBudgetId(data.selectedBudget.id);
          setItems(data.items);
          setBalance(data.balance);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Cuando el paciente cambia de budget (si tiene varios)
  useEffect(() => {
    if (!selectedBudgetId || !overview) return;
    if (overview.selectedBudget?.id === selectedBudgetId) return;
    let cancelled = false;
    getMyBudgetDetail(selectedBudgetId).then((data) => {
      if (cancelled) return;
      setItems(data.items);
      setBalance(data.balance);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedBudgetId, overview]);

  // Cálculos derivados
  const completedItems = items.filter((i) => i.status === 'completed');
  const pendingItems = items.filter((i) => i.status === 'pending');
  const completedSubtotal = completedItems.reduce(
    (acc, i) => acc + i.unit_price * i.quantity,
    0
  );
  const totalSubtotal = items.reduce(
    (acc, i) => acc + i.unit_price * i.quantity,
    0
  );
  const progressPercent =
    totalSubtotal > 0
      ? Math.min(100, Math.round((completedSubtotal / totalSubtotal) * 100))
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Caso A: paciente sin budgets
  if (!overview || overview.budgets.length === 0) {
    return (
      <>
        <Helmet>
          <title>Mi tratamiento | DentalSpot</title>
        </Helmet>
        <div className="container mx-auto max-w-3xl p-4 sm:p-6 space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">Mi tratamiento</h1>
          <Card>
            <CardContent className="py-10 text-center space-y-2">
              <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                Todavía no tenés un plan de tratamiento activo.
              </p>
              <p className="text-xs text-muted-foreground">
                Cuando tu dentista lo cree, vas a verlo acá con el detalle de
                cada intervención.
              </p>
            </CardContent>
          </Card>

          {/* Indicaciones recientes igual (puede no tener budget pero sí tener sesiones) */}
          {overview?.indications?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Indicaciones de tus últimas sesiones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {overview.indications.map((ind) => (
                  <div
                    key={ind.id}
                    className="border-l-2 border-amber-300 pl-3 py-1"
                  >
                    <p className="text-xs text-muted-foreground">
                      {formatDateChile(ind.entry_date)}
                    </p>
                    <p className="text-sm text-gray-800 mt-0.5">
                      {ind.next_steps}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </>
    );
  }

  // Caso B: paciente con budget activo
  return (
    <>
      <Helmet>
        <title>Mi tratamiento | DentalSpot</title>
      </Helmet>

      <div className="container mx-auto max-w-3xl p-4 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mi tratamiento</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Tu plan, lo que se hizo y lo que queda por hacer.
            </p>
          </div>

          {/* Selector de budget si hay multiples */}
          {overview.budgets.length > 1 && (
            <Select value={selectedBudgetId} onValueChange={setSelectedBudgetId}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {overview.budgets.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Card barra de progreso */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {overview.selectedBudget?.title || 'Plan de tratamiento'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">
                {progressPercent}% completado
              </span>
              <span className="text-xs text-muted-foreground">
                {completedItems.length} de {items.length} intervenciones
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Valor ejecutado: {formatCurrency(completedSubtotal)} de{' '}
              {formatCurrency(totalSubtotal)}
            </div>
          </CardContent>
        </Card>

        {/* Card balance economico */}
        {balance && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4 text-teal-600" />
                Resumen económico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-muted-foreground">Total plan</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {formatCurrency(balance.total)}
                  </p>
                </div>
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-xs text-green-700">Pagado</p>
                  <p className="text-sm font-semibold text-green-800 mt-1">
                    {formatCurrency(balance.total_paid)}
                  </p>
                </div>
                <div
                  className={cn(
                    'rounded-lg p-3',
                    balance.balance_due > 0 ? 'bg-amber-50' : 'bg-emerald-50'
                  )}
                >
                  <p
                    className={cn(
                      'text-xs',
                      balance.balance_due > 0 ? 'text-amber-700' : 'text-emerald-700'
                    )}
                  >
                    {balance.balance_due > 0 ? 'Por pagar' : 'Sin saldo'}
                  </p>
                  <p
                    className={cn(
                      'text-sm font-semibold mt-1',
                      balance.balance_due > 0
                        ? 'text-amber-800'
                        : 'text-emerald-800'
                    )}
                  >
                    {formatCurrency(Math.max(0, balance.balance_due))}
                  </p>
                </div>
              </div>
              {balance.payment_count > 0 && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  {balance.payment_count} pago{balance.payment_count > 1 ? 's' : ''} registrado{balance.payment_count > 1 ? 's' : ''}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Card lista de intervenciones */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-gray-600" />
              Intervenciones del plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No hay intervenciones cargadas todavía.
              </p>
            ) : (
              <ul className="space-y-1">
                {/* Completed primero */}
                {completedItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2 p-2 rounded hover:bg-gray-50"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{item.description}</p>
                      {item.completed_at && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Hecho el {formatDateChile(item.completed_at)}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 font-medium flex-shrink-0">
                      {formatCurrency(item.unit_price * item.quantity)}
                    </span>
                  </li>
                ))}
                {/* Separator si ambos lados tienen contenido */}
                {completedItems.length > 0 && pendingItems.length > 0 && (
                  <li className="border-t my-2" />
                )}
                {/* Pending después */}
                {pendingItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2 p-2 rounded hover:bg-gray-50"
                  >
                    <Circle className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Pendiente
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatCurrency(item.unit_price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Card indicaciones del dentista */}
        {overview.indications.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Indicaciones de tus últimas sesiones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview.indications.map((ind) => (
                <div
                  key={ind.id}
                  className="border-l-2 border-amber-300 pl-3 py-1"
                >
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {formatDateChile(ind.entry_date)}
                  </p>
                  <p className="text-sm text-gray-800 mt-0.5">{ind.next_steps}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default MyTreatmentPage;
