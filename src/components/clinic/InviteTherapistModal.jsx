import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Mail, Send } from 'lucide-react';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';
import useActivePlanLimits from '@/hooks/useActivePlanLimits';
import UpgradeModal from '@/components/modals/UpgradeModal';

const InviteTherapistModal = ({ isOpen, onClose, clinicId, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { canCreate, currentPlan } = useActivePlanLimits();
  const [formData, setFormData] = useState({
    email: '',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email) return;

    setLoading(true);
    try {
      const targetEmail = formData.email.trim().toLowerCase();

      // Spec 022 Phase E — Enforcement UX: bloquear si plan alcanzó límite de dentistas
      const allowed = await canCreate('dentist');
      if (!allowed) {
        setLoading(false);
        setShowUpgradeModal(true);
        return;
      }

      // Verificar que NO haya invitación pendiente o vinculo activo previo
      const { data: existingInv } = await supabase
        .from('clinic_invitations')
        .select('id, status')
        .eq('clinic_id', clinicId)
        .eq('email', targetEmail)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingInv) {
        throw new Error('Ya hay una invitación pendiente para este correo.');
      }

      // Crear invitación (con token + envío email) via edge function
      const { data: result, error: invErr } = await supabase.functions.invoke('clinic-invitations', {
        body: {
          action: 'create',
          clinic_id: clinicId,
          email: targetEmail,
          message: formData.message?.trim() || null,
          role: 'therapist',
        },
      });

      if (invErr || !result?.success) {
        throw new Error(result?.message || invErr?.message || 'No se pudo crear la invitación.');
      }

      // Crear notification in-app si el invitado YA tiene cuenta en la plataforma
      try {
        const { data: profileMatch } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('email', targetEmail)
          .maybeSingle();

        if (profileMatch?.id) {
          const { data: clinicData } = await supabase
            .from('clinics')
            .select('name')
            .eq('id', clinicId)
            .maybeSingle();

          await supabase.rpc('create_in_app_notification', {
            p_user_id: profileMatch.id,
            p_type: 'clinic_invitation',
            p_title: 'Te invitaron a una clínica',
            p_message: `${clinicData?.name || 'Una clínica'} quiere que formes parte de su equipo. Acepta o rechaza desde "Mis Invitaciones".`,
            p_action_url: '/dashboard/profile?tab=invitations',
            p_data: { clinic_id: clinicId, clinic_name: clinicData?.name },
          });
        }
      } catch (notifErr) {
        // Non-blocking: si la notif falla, la invitación email ya se envió
        logger.warn('In-app notification failed (non-blocking):', notifErr?.message);
      }

      toast({
        title: 'Invitación enviada',
        description: `Se envió un correo a ${targetEmail}. Recibirá la invitación en su dashboard si ya tiene cuenta.`,
      });

      setFormData({ email: '', message: '' });
      if (onSuccess) onSuccess();
      onClose();

    } catch (error) {
      logger.error("Invitation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invitar Terapeuta</DialogTitle>
          <DialogDescription>
            Envía una invitación por correo electrónico para unirse a tu clínica.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Correo Electrónico *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="invite-email"
                type="email"
                placeholder="colega@ejemplo.com"
                className="pl-9"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-message">Mensaje Personalizado (Opcional)</Label>
            <Textarea
              id="invite-message"
              placeholder="Hola, me gustaría que te unieras a mi equipo en..."
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.email}>
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
      </DialogContent>
    </Dialog>

    {/* Modal de upgrade cuando alcanza límite de dentistas */}
    <UpgradeModal
      isOpen={showUpgradeModal}
      onClose={() => setShowUpgradeModal(false)}
      featureName="más dentistas en tu clínica"
      requiredPlan="clinic"
      currentPlan={currentPlan}
    />
    </>
  );
};

export default InviteTherapistModal;