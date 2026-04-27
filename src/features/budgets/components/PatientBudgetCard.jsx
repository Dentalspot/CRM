import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';
import logger from '@/lib/utils/logger';

import { acceptBudget } from '../hooks/useBudgets';
import { useBudgetItems } from '../hooks/useBudgetItems';
import { usePayments } from '../hooks/usePayments';

const STATUS_LABELS = {
  enviado: { label: 'Por aceptar', color: 'bg-blue-100 text-blue-700' },
  aceptado: { label: 'Aceptado', color: 'bg-emerald-100 text-emerald-700' },
  en_progreso: { label: 'En progreso', color: 'bg-amber-100 text-amber-800' },
  pagado: { label: 'Pagado', color: 'bg-green-100 text-green-700' },
};

const METHOD_LABELS = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta_debito: 'Tarjeta Débito',
  tarjeta_credito: 'Tarjeta Crédito',
};

const formatCLP = (n) => new Intl.NumberFormat('es-CL').format(Math.round(n || 0));

const PatientBudgetCard = ({ budget, onChanged }) => {
  const [expanded, setExpanded] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const { toast } = useToast();

  const { items, loading: loadingItems } = useBudgetItems(budget.budget_id, expanded);
  const { payments, loading: loadingPayments } = usePayments(expanded ? budget.budget_id : null);

  const statusInfo = STATUS_LABELS[budget.status] || STATUS_LABELS.enviado;
  const canAccept = budget.status === 'enviado';

  const handleAccept = async () => {
    if (!window.confirm('¿Aceptar este presupuesto? Confirmas que estás de acuerdo con la cotización.')) return;
    setAccepting(true);
    try {
      await acceptBudget(budget.budget_id);
      toast({ title: 'Presupuesto aceptado', description: 'Gracias por tu confirmación.' });
      if (onChanged) onChanged();
    } catch (err) {
      logger.error('[PatientBudgetCard] accept error:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setAccepting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-base">
                Presupuesto #{budget.budget_number}
              </span>
              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
            </div>
            <p className="text-sm text-foreground">{budget.title}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
              <span>Total: <strong className="text-foreground">${formatCLP(budget.total)}</strong></span>
              <span>Pagado: <strong className="text-foreground">${formatCLP(budget.total_paid)}</strong></span>
              <span>
                Saldo:{' '}
                <strong className={budget.balance_due > 0 ? 'text-amber-700' : 'text-green-700'}>
                  ${formatCLP(budget.balance_due)}
                </strong>
              </span>
            </div>
          </div>

          {canAccept && (
            <Button size="sm" onClick={handleAccept} disabled={accepting}>
              {accepting
                ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                : <CheckCircle2 className="h-4 w-4 mr-1" />}
              Aceptar
            </Button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          className="mt-3 text-xs text-primary hover:underline flex items-center gap-1"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? 'Ocultar detalle' : 'Ver detalle'}
        </button>

        {expanded && (
          <div className="mt-3 pl-3 border-l-2 border-muted space-y-4">
            {/* Items */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Servicios cotizados
              </h4>
              {loadingItems ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : items.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Sin items.</p>
              ) : (
                <div className="space-y-1">
                  {items.map((it) => (
                    <div key={it.id} className="flex justify-between text-sm bg-white border rounded-md px-2 py-1.5">
                      <span className="truncate">
                        {it.description}
                        {it.quantity > 1 && <span className="text-muted-foreground"> × {it.quantity}</span>}
                      </span>
                      <span className="font-mono shrink-0">${formatCLP(it.subtotal)}</span>
                    </div>
                  ))}
                  {budget.discount_percentage > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground pt-1">
                      <span>Descuento {budget.discount_percentage}%</span>
                      <span className="font-mono">−${formatCLP(budget.subtotal - budget.total)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payments */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Historial de pagos
              </h4>
              {loadingPayments ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : payments.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Aún no hay pagos registrados.</p>
              ) : (
                <div className="space-y-1">
                  {payments.map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-sm bg-white border rounded-md px-2 py-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-semibold">${formatCLP(p.amount)}</span>
                          <span className="text-xs text-muted-foreground">
                            {METHOD_LABELS[p.payment_method] || p.payment_method}
                          </span>
                        </div>
                        {p.concept && <p className="text-xs text-muted-foreground truncate">{p.concept}</p>}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {format(new Date(p.payment_date), 'dd MMM yyyy', { locale: es })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientBudgetCard;
