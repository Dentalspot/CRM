import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta_debito', label: 'Tarjeta de débito' },
  { value: 'tarjeta_credito', label: 'Tarjeta de crédito' },
];

const RegisterPaymentDialog = ({ isOpen, onOpenChange, appointment, organizationId, onRegistered }) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const patientName = appointment?.patient?.profile?.full_name || 'Paciente';
  const appointmentDate = appointment?.date
    ? format(new Date(appointment.date + 'T12:00:00'), "d 'de' MMMM", { locale: es })
    : '';

  const handleSubmit = async () => {
    const numAmount = parseInt(amount, 10);
    if (!numAmount || numAmount <= 0) {
      toast({ variant: 'destructive', title: 'Monto inválido', description: 'Ingresa un monto mayor a 0.' });
      return;
    }
    if (!method) {
      toast({ variant: 'destructive', title: 'Método requerido', description: 'Selecciona un método de pago.' });
      return;
    }

    setSubmitting(true);
    try {
      // Verificar que no exista pago duplicado
      const { data: existing } = await supabase
        .from('patient_payments')
        .select('id')
        .eq('appointment_id', appointment.id)
        .maybeSingle();

      if (existing) {
        toast({ variant: 'destructive', title: 'Pago ya registrado', description: 'Esta cita ya tiene un pago asociado.' });
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from('patient_payments').insert({
        patient_id: appointment.patient?.id,
        therapist_id: appointment.therapist_id,
        organization_id: organizationId,
        appointment_id: appointment.id,
        amount: numAmount,
        payment_method: method,
        concept: 'Sesión dental',
        payment_date: new Date().toISOString(),
        status: 'paid',
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({ title: 'Pago registrado correctamente' });
      onOpenChange(false);
      onRegistered?.();
      setAmount('');
      setMethod('');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error al registrar pago', description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-slate-50 rounded-lg p-3 border">
            <p className="text-sm font-medium">{patientName}</p>
            <p className="text-xs text-muted-foreground">Cita del {appointmentDate}</p>
          </div>

          <div className="space-y-2">
            <Label>Monto (CLP) *</Label>
            <Input
              type="number"
              min="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Ej: 35000"
            />
          </div>

          <div className="space-y-2">
            <Label>Método de pago *</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue placeholder="Seleccionar método" /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Registrar pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterPaymentDialog;
