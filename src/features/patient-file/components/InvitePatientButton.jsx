/**
 * @file src/features/patient-file/components/InvitePatientButton.jsx
 *
 * Spec 030 followup: botón "Enviar invitación" en la ficha del paciente.
 *
 * Estados:
 *   - Sin RUT cargado → disabled + tooltip ("Cargá el RUT del paciente primero")
 *   - Ya vinculado (profile_id NOT NULL) → badge verde "Cuenta vinculada"
 *   - Pendiente reciente (invitación enviada hace < 7 días) → "Reenviar invitación · {N} días"
 *   - Listo (RUT + sin vincular) → "Enviar invitación"
 *
 * Click abre modal con:
 *   - Si paciente tiene email → opción "Enviar por email" + "Copiar link"
 *   - Si NO tiene email → solo "Copiar link" (para WhatsApp/SMS manual)
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Send,
  Link2,
  Copy,
  CheckCircle2,
  Mail,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const APP_URL =
  (typeof window !== 'undefined' && window.location.origin) || 'https://dentalspot.cl';

const daysAgo = (iso) => {
  if (!iso) return null;
  try {
    const ms = Date.now() - new Date(iso).getTime();
    return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
  } catch {
    return null;
  }
};

const InvitePatientButton = ({
  patientId,
  patientRut,
  patientEmail,
  patientProfileId,
  organizationId,
  patientFullName,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [pending, setPending] = useState(null); // patient_invitations row activa o null
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasRut = !!(patientRut && patientRut.trim().length >= 2);
  const isLinked = !!patientProfileId;

  // Lookup invitación pendiente al montar
  const refreshPending = useCallback(async () => {
    if (!patientId || isLinked) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('patient_invitations')
      .select('id, token, email, expires_at, sent_at, accepted_at')
      .eq('patient_id', patientId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setPending(data || null);
    setLoading(false);
  }, [patientId, isLinked]);

  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  // Cuando se abre el modal, si no hay invitación pendiente la creamos para
  // tener el token disponible al copiar. Si ya hay, reusa.
  const ensureInvitation = useCallback(async () => {
    if (pending?.token) return pending;

    const { data, error } = await supabase
      .from('patient_invitations')
      .insert({
        patient_id: patientId,
        organization_id: organizationId,
        invited_by: user.id,
        email: patientEmail || null,
      })
      .select('id, token, email, expires_at, sent_at')
      .single();

    if (error || !data) {
      throw error || new Error('No se pudo generar la invitación');
    }
    setPending(data);
    return data;
  }, [pending, patientId, organizationId, user?.id, patientEmail]);

  const handleOpen = async () => {
    setModalOpen(true);
    try {
      await ensureInvitation();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'No se pudo preparar la invitación',
        description: err.message,
      });
      setModalOpen(false);
    }
  };

  const acceptUrl = pending
    ? `${APP_URL}/auth/accept-invitation?token=${encodeURIComponent(pending.token)}`
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(acceptUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Link copiado al portapapeles' });
    } catch {
      toast({ variant: 'destructive', title: 'No se pudo copiar el link' });
    }
  };

  const handleSendEmail = async () => {
    if (!patientEmail) {
      toast({ variant: 'destructive', title: 'Sin email cargado' });
      return;
    }
    setSending(true);
    try {
      const inv = await ensureInvitation();
      const { data, error } = await supabase.functions.invoke('send-patient-invitation', {
        body: { invitation_id: inv.id },
      });
      if (error) throw error;
      if (!data?.ok) {
        throw new Error(data?.error || 'El servidor de email rechazó la solicitud');
      }
      toast({
        title: '✓ Invitación enviada',
        description: `Email enviado a ${patientEmail}`,
      });
      setModalOpen(false);
      refreshPending();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'No se pudo enviar el email',
        description: err.message,
      });
    } finally {
      setSending(false);
    }
  };

  // ─── Render según estado ───

  if (isLinked) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <Badge className="bg-green-100 text-green-700 border-0">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Cuenta vinculada
        </Badge>
        <span className="text-gray-500">El paciente ya tiene su cuenta activa.</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Loader2 className="h-3 w-3 animate-spin" />
        Verificando estado...
      </div>
    );
  }

  if (!hasRut) {
    return (
      <div
        className="inline-flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5"
        title="Necesitamos el RUT para validar la identidad del paciente al activar su cuenta"
      >
        <ShieldAlert className="h-3.5 w-3.5" />
        Cargá el RUT del paciente primero para poder invitarlo.
      </div>
    );
  }

  const pendingDays = pending ? daysAgo(pending.sent_at) : null;

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          size="sm"
          onClick={handleOpen}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          {pending ? <Clock className="h-4 w-4 mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
          {pending ? 'Reenviar invitación' : 'Enviar invitación'}
        </Button>
        {pending && (
          <span className="text-xs text-gray-500">
            Invitación enviada hace{' '}
            {pendingDays === 0 ? 'menos de un día' : `${pendingDays} día${pendingDays === 1 ? '' : 's'}`}
          </span>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invitar a {patientFullName || 'paciente'}</DialogTitle>
            <DialogDescription>
              El paciente recibirá un enlace para activar su cuenta. Para validar
              su identidad, le pediremos el RUT al registrarse.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Resumen */}
            <div className="rounded-lg bg-gray-50 p-3 text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Email:</span>
                <span className="font-medium">
                  {patientEmail || (
                    <span className="text-amber-700 italic">Sin email cargado</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">RUT registrado:</span>
                <span className="font-medium">{patientRut}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                El link vence en 7 días.
              </p>
            </div>

            {/* Acción 1: Enviar por email (si hay email) */}
            {patientEmail && (
              <Button
                type="button"
                onClick={handleSendEmail}
                disabled={sending}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Mail className="h-4 w-4 mr-1.5" />
                )}
                Enviar por email
              </Button>
            )}

            {/* Acción 2: Copiar link (siempre disponible) */}
            <div className="space-y-2">
              {!patientEmail && (
                <p className="text-xs text-gray-600">
                  Sin email cargado. Podés copiar el link y enviarlo por WhatsApp.
                </p>
              )}
              <div className="flex items-center gap-2 rounded-lg border bg-white p-2">
                <Link2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={acceptUrl}
                  readOnly
                  className="flex-1 text-xs bg-transparent outline-none truncate"
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button
                  type="button"
                  variant={copied ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleCopy}
                  className={copied ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InvitePatientButton;
