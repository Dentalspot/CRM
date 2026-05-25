import React, { useState, useEffect, useCallback } from 'react';
import ProfileSectionCard from '@/components/therapist-profile/ProfileSectionCard';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarCheck, Info, Link2, Copy, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { slugify, randomString } from '@/lib/utils/strings';
import logger from '@/lib/utils/logger';

/**
 * @file src/components/therapist-profile/sections/OnlineBookingSection.jsx
 *
 * Toggle "Aceptar reservas online" (self-booking Fase 1) + enlace público
 * copiable. Controla therapist_details.accepts_online_booking (default false).
 *
 * Al activar, si el dentista no tiene `slug` se genera uno (a partir del
 * nombre) para que su perfil público sea accesible y compartible. El enlace
 * apunta a {origin}/{slug} — localhost en dev, dentalspot.cl en prod.
 *
 * Decisión founder: aprobación manual, toggle por dentista, enlace copiable.
 */
const OnlineBookingSection = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [slug, setSlug] = useState(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('therapist_details')
        .select('accepts_online_booking, slug, profiles:user_id(full_name)')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      setEnabled(data?.accepts_online_booking === true);
      setSlug(data?.slug || null);
      setFullName(data?.profiles?.full_name || profile?.full_name || '');
    } catch (error) {
      logger.error('[OnlineBookingSection] load failed:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.full_name]);

  useEffect(() => {
    load();
  }, [load]);

  // Genera y persiste un slug único si el dentista no tiene. Reintenta con
  // sufijo aleatorio ante colisión (unique constraint).
  const ensureSlug = async () => {
    if (slug) return slug;
    const base = slugify(fullName) || `dentista-${user.id.slice(0, 8)}`;
    let candidate = base;
    for (let attempt = 0; attempt < 4; attempt++) {
      const { error } = await supabase
        .from('therapist_details')
        .update({ slug: candidate })
        .eq('user_id', user.id);
      if (!error) {
        setSlug(candidate);
        return candidate;
      }
      // 23505 = unique_violation → reintentar con sufijo
      if (error.code === '23505' || /duplicate|unique/i.test(error.message || '')) {
        candidate = `${base}-${randomString(4).toLowerCase()}`;
        continue;
      }
      throw error;
    }
    throw new Error('No se pudo generar un enlace único. Intentá de nuevo.');
  };

  const handleToggle = async (next) => {
    setSaving(true);
    const prev = enabled;
    setEnabled(next);
    try {
      if (next) {
        // Al activar: asegurar slug + setear el flag
        await ensureSlug();
      }
      const { data, error } = await supabase
        .from('therapist_details')
        .update({ accepts_online_booking: next })
        .eq('user_id', user.id)
        .select('user_id');
      if (error) throw error;
      // UI Honesty (Constitution V): validar que tocó una fila
      if (!data || data.length === 0) {
        const { error: insertErr } = await supabase
          .from('therapist_details')
          .insert({ user_id: user.id, accepts_online_booking: next });
        if (insertErr) throw insertErr;
      }
      toast({
        title: next ? '✅ Reservas online activadas' : 'Reservas online desactivadas',
        description: next
          ? 'Compartí tu enlace para que los pacientes reserven.'
          : 'Tu perfil público ya no muestra el calendario de reserva.',
      });
    } catch (error) {
      logger.error('[OnlineBookingSection] toggle failed:', error);
      setEnabled(prev);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudo actualizar.' });
    } finally {
      setSaving(false);
    }
  };

  const publicUrl = slug ? `${window.location.origin}/${slug}` : '';

  const handleCopy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast({ title: '¡Enlace copiado!', description: 'Ya podés compartirlo con tus pacientes.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: 'destructive', title: 'No se pudo copiar', description: 'Copialo manualmente.' });
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

          {/* Enlace público copiable — visible cuando está activo y hay slug */}
          {enabled && publicUrl && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Link2 className="h-4 w-4 text-primary" /> Tu enlace de reservas
              </Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Click para copiar"
                  className="flex-1 flex items-center gap-2 text-left text-sm font-mono bg-slate-50 border border-slate-200 rounded-md px-3 py-2 hover:bg-slate-100 transition-colors truncate"
                >
                  <span className="truncate text-slate-700">{publicUrl}</span>
                </button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0 gap-1.5"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Compartí este enlace en tu Instagram, WhatsApp o tarjeta. Tus pacientes
                podrán reservar directamente.
              </p>
            </div>
          )}

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
