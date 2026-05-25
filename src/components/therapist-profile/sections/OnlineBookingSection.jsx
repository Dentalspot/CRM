import React, { useState, useEffect, useCallback } from 'react';
import ProfileSectionCard from '@/components/therapist-profile/ProfileSectionCard';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, CalendarCheck, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/utils/logger';

/**
 * @file src/components/therapist-profile/sections/OnlineBookingSection.jsx
 *
 * Toggle "Aceptar reservas online" (self-booking Fase 1).
 * Controla therapist_details.accepts_online_booking (default false, opt-in).
 *
 * Cuando está ON, el perfil público del dentista muestra el calendario de
 * reserva y los pacientes pueden agendar solos. Las reservas entran como
 * 'scheduled' con booking_source='online_self_booking' y el dentista las
 * aprueba (→ confirmed) o cancela desde su agenda.
 *
 * Decisión founder: aprobación manual, toggle por dentista.
 */
const OnlineBookingSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('therapist_details')
        .select('accepts_online_booking')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      setEnabled(data?.accepts_online_booking === true);
    } catch (error) {
      logger.error('[OnlineBookingSection] load failed:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (next) => {
    setSaving(true);
    // Optimista
    const prev = enabled;
    setEnabled(next);
    try {
      // upsert por si la fila therapist_details aún no existe
      const { data, error } = await supabase
        .from('therapist_details')
        .update({ accepts_online_booking: next })
        .eq('user_id', user.id)
        .select('user_id');
      if (error) throw error;
      // UI Honesty (Constitution V): validar que el update tocó una fila
      if (!data || data.length === 0) {
        // No existía la fila → crearla
        const { error: insertErr } = await supabase
          .from('therapist_details')
          .insert({ user_id: user.id, accepts_online_booking: next });
        if (insertErr) throw insertErr;
      }
      toast({
        title: next ? '✅ Reservas online activadas' : 'Reservas online desactivadas',
        description: next
          ? 'Los pacientes ya pueden reservar desde tu perfil público.'
          : 'Tu perfil público ya no muestra el calendario de reserva.',
      });
    } catch (error) {
      logger.error('[OnlineBookingSection] toggle failed:', error);
      setEnabled(prev); // revertir
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la configuración.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileSectionCard
      id="online-booking"
      title="Reservas Online"
      description="Permite que los pacientes reserven citas directamente desde tu perfil público."
    >
      {loading ? (
        <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-background/50">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                <CalendarCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="accepts-online-booking" className="text-base font-medium cursor-pointer">
                  Aceptar reservas online
                </Label>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {enabled
                    ? 'Activado — tu calendario de reserva es visible en tu perfil público.'
                    : 'Desactivado — los pacientes no pueden reservar online (podés agendar manualmente).'}
                </p>
              </div>
            </div>
            <Switch
              id="accepts-online-booking"
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={saving}
            />
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-md p-3">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p>
              Las reservas entran como <strong>pendientes de confirmar</strong> en tu agenda.
              Vos decidís si las aceptás o las rechazás. Los horarios disponibles se toman
              de tu disponibilidad configurada por clínica.
            </p>
          </div>
        </div>
      )}
    </ProfileSectionCard>
  );
};

export default OnlineBookingSection;
