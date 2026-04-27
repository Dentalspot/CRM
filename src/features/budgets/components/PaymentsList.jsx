import React from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';
import logger from '@/lib/utils/logger';

import { usePayments, deletePayment } from '../hooks/usePayments';

const METHOD_LABELS = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta_debito: 'Tarjeta Débito',
  tarjeta_credito: 'Tarjeta Crédito',
};

const formatCLP = (n) => new Intl.NumberFormat('es-CL').format(Math.round(n || 0));

const PaymentsList = ({ budgetId, onChange }) => {
  const { payments, loading, refresh } = usePayments(budgetId);
  const { toast } = useToast();

  const handleDelete = async (paymentId) => {
    if (!window.confirm('¿Eliminar este pago? El saldo se recalculará automáticamente.')) return;
    try {
      await deletePayment(paymentId);
      toast({ title: 'Pago eliminado' });
      refresh();
      if (onChange) onChange();
    } catch (err) {
      logger.error('[PaymentsList] delete error:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic py-2">
        Aún no hay pagos registrados.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {payments.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between bg-white border rounded-md px-3 py-2 text-sm"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-semibold">${formatCLP(p.amount)}</span>
              <span className="text-xs text-muted-foreground">
                {METHOD_LABELS[p.payment_method] || p.payment_method}
              </span>
              <span className="text-xs text-muted-foreground">
                · {format(new Date(p.payment_date), 'dd MMM yyyy', { locale: es })}
              </span>
            </div>
            {(p.concept || p.notes) && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {p.concept}{p.concept && p.notes ? ' — ' : ''}{p.notes}
              </p>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={() => handleDelete(p.id)}
            title="Eliminar pago"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default PaymentsList;
