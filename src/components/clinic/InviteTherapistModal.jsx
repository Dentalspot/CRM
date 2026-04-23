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
      // Find therapist by email
      const { data: therapist, error: findError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('email', formData.email.trim().toLowerCase())
        .maybeSingle();

      if (findError) throw findError;

      if (!therapist) {
        throw new Error('No se encontró un profesional registrado con ese correo. El terapeuta debe tener una cuenta en DentalSpot.');
      }

      if (therapist.role !== 'therapist') {
        throw new Error('El correo no corresponde a una cuenta de terapeuta.');
      }

      // Check if already linked
      const { data: existing } = await supabase
        .from('clinic_therapists')
        .select('id')
        .eq('clinic_id', clinicId)
        .eq('therapist_id', therapist.id)
        .maybeSingle();

      if (existing) {
        throw new Error('Este terapeuta ya está vinculado a tu clínica.');
      }

      // Spec 022 Phase E — Enforcement UX: bloquear si plan alcanzó límite de dentistas
      const allowed = await canCreate('dentist');
      if (!allowed) {
        setLoading(false);
        setShowUpgradeModal(true);
        return;
      }

      // Link therapist to clinic
      const { error: linkError } = await supabase
        .from('clinic_therapists')
        .insert({
          clinic_id: clinicId,
          therapist_id: therapist.id,
          is_active: true,
        });

      if (linkError) throw linkError;

      toast({
        title: "Terapeuta agregado",
        description: `${therapist.full_name || formData.email} se ha vinculado a tu clínica.`,
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

    {/* Spec 022 Phase E — Modal de upgrade cuando alcanza límite de dentistas */}
    <UpgradeModal
      isOpen={showUpgradeModal}
      onClose={() => setShowUpgradeModal(false)}
      featureName="más dentistas en tu clínica"
      requiredPlan="professional"
      currentPlan={currentPlan}
    />
    </>
  );
};

export default InviteTherapistModal;