import React, { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, DollarSign } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/utils/logger';

import { createPayment } from '../hooks/usePayments';

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta_debito', label: 'Tarjeta Débito' },
  { value: 'tarjeta_credito', label: 'Tarjeta Crédito' },
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

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setAmount('');
      setMethod('efectivo');
      setPaymentDate(todayISO());
      setConcept('');
      setNotes('');
    }
  }, [open]);

  const balance = Number(budget?.balance_due || 0);
  const numericAmount = Number(amount) || 0;
  const exceedsBalance = numericAmount > balance;
  const isInvalid = numericAmount <= 0 || !method || !paymentDate;

  const handleSubmit = async () => {
    if (isInvalid) {
      toast({ variant: 'destructive', title: 'Datos incompletos', description: 'Completa monto, método y fecha.' });
      return;
    }
    if (exceedsBalance) {
      const ok = window.confirm(
        `El monto ($${formatCLP(numericAmount)}) excede el saldo pendiente ($${formatCLP(balance)}). ¿Continuar de todas formas?`
      );
      if (!ok) return;
    }

    setSubmitting(true);
    try {
      await createPayment({
        budget_id: budget.budget_id,
        patient_id: patientId,
        therapist_id: budget.therapist_id || user.id,
        amount: numericAmount,
        payment_method: method,
        payment_date: paymentDate,
        concept: concept.trim() || null,
        notes: notes.trim() || null,
      });

      toast({ title: 'Pago registrado', description: `$${formatCLP(numericAmount)} CLP` });
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
      <DialogContent className="max-w-md">
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

          {/* Monto */}
          <div>
            <Label htmlFor="pay-amount">Monto a pagar (CLP) *</Label>
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
            {exceedsBalance && (
              <p className="text-xs text-amber-700 mt-1">
                ⚠ Excede el saldo pendiente.
              </p>
            )}
          </div>

          {/* Método */}
          <div>
            <Label htmlFor="pay-method">Método de pago *</Label>
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
            Registrar pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentFormModal;
