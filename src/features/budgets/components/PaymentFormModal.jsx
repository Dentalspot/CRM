import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import logger from '@/lib/utils/logger';

import { createPayment } from '../hooks/usePayments';

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta_debito', label: 'Tarjeta Débito' },
  { value: 'tarjeta_credito', label: 'Tarjeta Crédito' },
  { value: 'mercadopago', label: 'Mercado Pago' },
];

const formatCLP = (n) => new Intl.NumberFormat('es-CL').format(Math.round(n || 0));
const todayISO = () => new Date().toISOString().slice(0, 10);

const PaymentFormModal = ({
  open,
  onOpenChange,
  budget,        // { budget_id, total, total_paid, balance_due, currency }
  patientId,
  onCreated,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('efectivo');
  const [paymentDate, setPaymentDate] = useState(todayISO());
  const [concept, setConcept] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Spec 030 followup: pago combinado en 2 métodos
  const [splitPayment, setSplitPayment] = useState(false);
  const [amount2, setAmount2] = useState('');
  const [method2, setMethod2] = useState('transferencia');

  const balance = Number(budget?.balance_due || 0);
  const numericAmount1 = Number(amount) || 0;
  const numericAmount2 = splitPayment ? Number(amount2) || 0 : 0;
  const totalAmount = numericAmount1 + numericAmount2;
  const remainingBalance = balance - totalAmount;

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setAmount('');
      setMethod('efectivo');
      setPaymentDate(todayISO());
      setConcept('');
      setNotes('');
      setSplitPayment(false);
      setAmount2('');
      setMethod2('transferencia');
    }
  }, [open]);

  // Validación
  const isInvalid = useMemo(() => {
    if (numericAmount1 <= 0 || !method || !paymentDate) return true;
    if (splitPayment) {
      if (numericAmount2 <= 0 || !method2) return true;
      if (method === method2) return true; // métodos distintos obligatorio
    }
    return false;
  }, [numericAmount1, numericAmount2, method, method2, paymentDate, splitPayment]);

  // Feedback dinámico del saldo
  const balanceFeedback = useMemo(() => {
    if (numericAmount1 <= 0 && numericAmount2 <= 0) return null;
    if (remainingBalance > 0) {
      return {
        type: 'partial',
        message: `Después de este pago el saldo queda en $${formatCLP(remainingBalance)} pendiente`,
      };
    }
    if (remainingBalance === 0) {
      return {
        type: 'full',
        message: 'Saldo cancelado por completo',
      };
    }
    return {
      type: 'over',
      message: `Sobrepago de $${formatCLP(Math.abs(remainingBalance))}`,
    };
  }, [numericAmount1, numericAmount2, remainingBalance]);

  // ─── Botones de monto rápido ───
  const applyQuickAmount = (value) => {
    setSplitPayment(false);
    setAmount2('');
    setAmount(String(value));
  };

  const handleSubmit = async () => {
    if (isInvalid) {
      const desc = splitPayment && method === method2
        ? 'Los dos métodos deben ser distintos. Si es el mismo, sumá los montos en una sola fila.'
        : 'Completa monto, método y fecha.';
      toast({ variant: 'destructive', title: 'Datos incompletos', description: desc });
      return;
    }

    // Confirmación si excede el saldo
    if (totalAmount > balance) {
      const ok = window.confirm(
        `El total ($${formatCLP(totalAmount)}) excede el saldo pendiente ($${formatCLP(balance)}). ¿Continuar de todas formas?`
      );
      if (!ok) return;
    }

    setSubmitting(true);
    try {
      // Pago 1
      await createPayment({
        budget_id: budget.budget_id,
        patient_id: patientId,
        therapist_id: budget.therapist_id || user.id,
        amount: numericAmount1,
        payment_method: method,
        payment_date: paymentDate,
        concept: concept.trim() || null,
        notes: notes.trim() || null,
      });

      // Pago 2 (si split)
      if (splitPayment) {
        await createPayment({
          budget_id: budget.budget_id,
          patient_id: patientId,
          therapist_id: budget.therapist_id || user.id,
          amount: numericAmount2,
          payment_method: method2,
          payment_date: paymentDate,
          concept: concept.trim() || null,
          notes: notes.trim() || null,
        });
      }

      toast({
        title: splitPayment
          ? `2 pagos registrados · Total $${formatCLP(totalAmount)}`
          : `Pago registrado · $${formatCLP(numericAmount1)}`,
      });
      onOpenChange(false);
      if (onCreated) onCreated();
    } catch (err) {
      logger.error('[PaymentFormModal] error:', err);
      toast({ variant: 'destructive', title: 'Error al registrar pago', description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            Presupuesto #{budget?.budget_number} — {budget?.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Saldo de referencia */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-mono">${formatCLP(budget?.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pagado:</span>
              <span className="font-mono">${formatCLP(budget?.total_paid)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-1 mt-1">
              <span>Saldo pendiente:</span>
              <span className="font-mono text-amber-700">${formatCLP(balance)}</span>
            </div>
          </div>

          {/* Botones de monto rápido */}
          {balance > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Acción rápida:</span>
              <button
                type="button"
                onClick={() => applyQuickAmount(balance)}
                className="text-xs px-2.5 py-1 rounded-md border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium transition-colors"
              >
                Saldo completo · ${formatCLP(balance)}
              </button>
              <button
                type="button"
                onClick={() => applyQuickAmount(Math.round(balance / 2))}
                className="text-xs px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
              >
                Mitad · ${formatCLP(balance / 2)}
              </button>
              <button
                type="button"
                onClick={() => applyQuickAmount('')}
                className="text-xs px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
              >
                Personalizado
              </button>
            </div>
          )}

          {/* Pago 1: monto + método */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pay-amount">Monto (CLP) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pay-amount"
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="pay-method">Método *</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger id="pay-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Toggle pago combinado */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="split-payment"
              checked={splitPayment}
              onCheckedChange={setSplitPayment}
            />
            <Label htmlFor="split-payment" className="text-sm cursor-pointer text-gray-700">
              Combinar con un segundo método de pago
            </Label>
          </div>

          {/* Pago 2 (solo si split) */}
          {splitPayment && (
            <div className="grid grid-cols-2 gap-3 rounded-md border border-dashed border-teal-300 bg-teal-50/40 p-3">
              <div>
                <Label htmlFor="pay-amount-2" className="text-xs">Monto 2 (CLP) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pay-amount-2"
                    type="number"
                    min="1"
                    value={amount2}
                    onChange={(e) => setAmount2(e.target.value)}
                    className="pl-8"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="pay-method-2" className="text-xs">Método 2 *</Label>
                <Select value={method2} onValueChange={setMethod2}>
                  <SelectTrigger id="pay-method-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.filter(m => m.value !== method).map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Feedback dinámico del saldo */}
          {balanceFeedback && (
            <div
              className={cn(
                'flex items-center gap-2 text-sm rounded-md px-3 py-2',
                balanceFeedback.type === 'full' && 'bg-green-50 text-green-800 border border-green-200',
                balanceFeedback.type === 'partial' && 'bg-slate-50 text-slate-700 border border-slate-200',
                balanceFeedback.type === 'over' && 'bg-amber-50 text-amber-800 border border-amber-200'
              )}
            >
              {balanceFeedback.type === 'full' && <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
              {balanceFeedback.type === 'over' && <AlertCircle className="h-4 w-4 flex-shrink-0" />}
              <span>{balanceFeedback.message}</span>
              {splitPayment && (
                <span className="ml-auto text-xs opacity-70">
                  Total: ${formatCLP(totalAmount)}
                </span>
              )}
            </div>
          )}

          {/* Fecha */}
          <div>
            <Label htmlFor="pay-date">Fecha *</Label>
            <Input
              id="pay-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              max={todayISO()}
            />
          </div>

          {/* Concepto */}
          <div>
            <Label htmlFor="pay-concept">Concepto (opcional)</Label>
            <Input
              id="pay-concept"
              placeholder="Ej: Abono inicial"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
            />
          </div>

          {/* Notas */}
          <div>
            <Label htmlFor="pay-notes">Notas (opcional)</Label>
            <Textarea
              id="pay-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || isInvalid}>
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <DollarSign className="h-4 w-4 mr-2" />}
            {splitPayment ? 'Registrar 2 pagos' : 'Registrar pago'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentFormModal;
