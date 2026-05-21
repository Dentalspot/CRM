import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ShieldOff, Loader2, AlertTriangle } from 'lucide-react';
import logger from '@/lib/utils/logger';

/**
 * Botón para ejercer derecho ARCO Ley 21.719 art. 13 (supresión vía
 * anonimización). Llama a la RPC anonymize_patient (SECURITY DEFINER) y
 * redirige al listado tras éxito.
 *
 * Visible para:
 *   - Dentista tratante (la RPC valida server-side; el botón se muestra
 *     siempre y deja que la RPC retorne 42501 si no autoriza).
 *   - Admin.
 *
 * Por seguridad NO se muestra como acción primaria — se renderiza como
 * link discreto al pie de página de la ficha + AlertDialog requiriendo
 * razón (sin razón el submit queda deshabilitado).
 */
const AnonymizePatientButton = ({
  patientId,
  patientName,
  redirectTo = '/dashboard/patients',
  onAnonymized,
  variant = 'link',
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const requiredConfirm = 'ANONIMIZAR';
  const canSubmit = reason.trim().length >= 10 && confirmText === requiredConfirm && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('anonymize_patient', {
        p_patient_id: patientId,
        p_reason: reason.trim(),
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || 'No se pudo anonimizar');

      toast({
        title: '✓ Paciente anonimizado',
        description: 'Datos personales eliminados conforme a Ley 21.719. Audit log registrado.',
      });
      setOpen(false);
      onAnonymized?.(data);
      if (redirectTo) navigate(redirectTo);
    } catch (err) {
      logger.error('[anonymize] error:', err);
      toast({
        variant: 'destructive',
        title: 'No se pudo anonimizar',
        description: err.message || 'Verifica tus permisos o contacta a soporte.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className="text-destructive hover:text-destructive/80 gap-1.5 px-2"
        >
          <ShieldOff className="h-3.5 w-3.5" />
          Anonimizar (ARCO)
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Anonimizar paciente · Ley 21.719
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              <p>
                Estás por anonimizar a <strong>{patientName || 'este paciente'}</strong> en
                ejercicio del derecho de supresión (Ley 21.719 art. 13).
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-900 text-xs">
                <p className="font-semibold mb-1">Esta acción es irreversible:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Se borran nombre, RUT, contacto, historial médico y notas.</li>
                  <li>Se conservan citas y tratamientos pasados (sin PII) por integridad estadística.</li>
                  <li>Queda registrada en auditoría con tu identidad y la razón indicada.</li>
                </ul>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <Label htmlFor="anonymize-reason" className="text-xs">
              Razón / fundamento (mínimo 10 caracteres)
            </Label>
            <Textarea
              id="anonymize-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Solicitud ARCO recibida vía email el 06/05/2026. Adjunto: ticket #1234."
              rows={3}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="anonymize-confirm" className="text-xs">
              Para confirmar, escribe <code className="bg-muted px-1 rounded text-[10px]">{requiredConfirm}</code>
            </Label>
            <input
              id="anonymize-confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-background text-sm font-mono"
              autoComplete="off"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            disabled={!canSubmit}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Anonimizando…</>
            ) : (
              'Confirmar anonimización'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AnonymizePatientButton;
