/**
 * @file src/components/clinic/InviteAssistantModal.jsx
 *
 * Modal para invitar a un ASISTENTE ADMINISTRATIVO a la clínica.
 *
 * Diferencias vs InviteTherapistModal.jsx:
 * - Invoca el edge function `clinic-invitations` con action='create' + role='assistant'
 *   (flow email-based con token + expiración 7 días)
 * - El invitado recibe email con link, se registra si no tiene cuenta,
 *   queda como `role='assistant'` en `organization_members` al aceptar
 * - NO inserta directo en clinic_therapists (ese es el flow legacy de dentistas)
 *
 * Validaciones backend (spec 023 FR-004, FR-005, FR-006):
 * - Email ya profesional (therapist/clinic) → error amable
 * - Invitación duplicada pendiente → rechaza
 * - Rate limit: max 10 pending por clínica → rechaza
 *
 * Fallback delivery email (research §R-07): si Resend falla, el response
 * incluye `invite_url`. Mostramos al admin con botón "Copiar link" para
 * que lo envíe manualmente (WhatsApp/email). Garantiza que la invitación
 * nunca queda atascada por falla de email provider.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Mail, Send, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

const InviteAssistantModal = ({ isOpen, onClose, clinicId, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', message: '' });

  // Estado de fallback si email delivery falló: mostramos link para copy
  const [fallbackLink, setFallbackLink] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const resetState = () => {
    setFormData({ email: '', message: '' });
    setFallbackLink(null);
    setLinkCopied(false);
  };

  const handleClose = () => {
    if (loading) return;
    resetState();
    onClose();
  };

  const handleCopyLink = async () => {
    if (!fallbackLink) return;
    try {
      await navigator.clipboard.writeText(fallbackLink);
      setLinkCopied(true);
      toast({ title: 'Link copiado', description: 'Pegalo en WhatsApp o email para enviarlo manualmente.' });
      setTimeout(() => setLinkCopied(false), 2500);
    } catch (err) {
      logger.warn('clipboard.writeText failed:', err);
      // Fallback prompt: select-all en el input readonly abajo
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) return;

    setLoading(true);
    setFallbackLink(null);
    setLinkCopied(false);

    try {
      const { data, error } = await supabase.functions.invoke('clinic-invitations', {
        body: {
          action: 'create',
          clinic_id: clinicId,
          email: formData.email.trim().toLowerCase(),
          message: formData.message.trim() || null,
          role: 'assistant',
        },
      });

      if (error) throw error;

      if (!data || data.success === false) {
        // Error de negocio (email ya profesional, duplicate, rate limit, etc.)
        toast({
          variant: 'destructive',
          title: 'No se pudo crear la invitación',
          description: data?.message || 'Error desconocido. Intentá de nuevo.',
        });
        setLoading(false);
        return;
      }

      // Success — la invitación se creó
      if (data.emailSent) {
        // Email entregó, flow limpio. Cerramos modal + onSuccess
        toast({
          title: '✉️ Invitación enviada',
          description: `Se envió un email a ${formData.email.trim()} con el link de activación (expira en 7 días).`,
        });
        if (onSuccess) onSuccess();
        handleClose();
      } else {
        // Email falló pero invitación existe → mostramos fallback link
        setFallbackLink(data.invite_url);
        toast({
          variant: 'destructive',
          title: 'Email no se pudo enviar',
          description: 'La invitación está creada pero no pudimos mandar el email. Copiá el link abajo y envialo manualmente.',
        });
      }
    } catch (err) {
      logger.error('InviteAssistantModal error:', err);
      toast({
        variant: 'destructive',
        title: 'Error al enviar invitación',
        description: err.message || 'Ocurrió un problema. Intentá nuevamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invitar Asistente Administrativo</DialogTitle>
          <DialogDescription>
            El asistente podrá gestionar agenda y listado de pacientes, pero no acceder a fichas clínicas detalladas (Ley 20.584).
          </DialogDescription>
        </DialogHeader>

        {/* Fallback link (si email delivery falló) */}
        {fallbackLink && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">Invitación creada, email no se pudo enviar</p>
                <p className="text-xs text-amber-700 mt-1">
                  Copiá el link y enviálo por WhatsApp o email al invitado. El link expira en 7 días.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input readOnly value={fallbackLink} className="text-xs font-mono bg-white" onFocus={(e) => e.target.select()} />
              <Button
                type="button"
                size="sm"
                onClick={handleCopyLink}
                className={linkCopied ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {linkCopied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={handleClose} className="w-full">
              Cerrar
            </Button>
          </div>
        )}

        {/* Form (oculto cuando hay fallback link) */}
        {!fallbackLink && (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="assistant-email">Email del invitado *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="assistant-email"
                  type="email"
                  placeholder="asistente@ejemplo.com"
                  className="pl-9"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Si el invitado ya tiene cuenta de paciente, podrá usar la misma credencial. Si no tiene cuenta, se registrará desde el link.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assistant-message">Mensaje Personalizado (opcional)</Label>
              <Textarea
                id="assistant-message"
                placeholder="Hola, te sumo al equipo para que ayudes con la agenda..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={3}
                disabled={loading}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !formData.email.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Invitación
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InviteAssistantModal;
