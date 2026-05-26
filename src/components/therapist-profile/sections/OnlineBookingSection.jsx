import React, { useState, useEffect, useCallback } from 'react';
import ProfileSectionCard from '@/components/therapist-profile/ProfileSectionCard';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TimePicker from '@/components/ui/time-picker';
import { Loader2, CalendarCheck, Info, Link2, Copy, Check, Save, MessageSquare, Clock, PlusCircle, XCircle } from 'lucide-react';
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
  // Instrucciones para el paciente (ej. "Llegá 5 min antes")
  const [instructions, setInstructions] = useState('');
  const [savingInstructions, setSavingInstructions] = useState(false);
  // Franjas horarias para reservas online
  const [useGeneral, setUseGeneral] = useState(true);
  const [windows, setWindows] = useState([]); // [{ id?, day_of_week, start_time, end_time }]
  const [savingWindows, setSavingWindows] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('therapist_details')
        .select('accepts_online_booking, slug, booking_instructions, online_booking_use_general, profiles:user_id(full_name)')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      setEnabled(data?.accepts_online_booking === true);
      setSlug(data?.slug || null);
      setInstructions(data?.booking_instructions || '');
      setUseGeneral(data?.online_booking_use_general !== false);
      setFullName(data?.profiles?.full_name || profile?.full_name || '');

      // Cargar franjas de reserva online
      const { data: winData } = await supabase
        .from('online_booking_windows')
        .select('id, day_of_week, start_time, end_time')
        .eq('therapist_id', user.id)
        .order('day_of_week')
        .order('start_time');
      setWindows((winData || []).map((w) => ({
        id: w.id,
        day_of_week: w.day_of_week,
        start_time: (w.start_time || '').slice(0, 5),
        end_time: (w.end_time || '').slice(0, 5),
      })));
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
    // Asegurar el nombre real (puede no haber cargado aún en el state).
    let name = fullName;
    if (!name) {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      name = data?.full_name || '';
    }
    const base = slugify(name) || `dentista-${user.id.slice(0, 8)}`;
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
          ? 'Comparte tu enlace para que los pacientes reserven.'
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

  const handleSaveInstructions = async () => {
    setSavingInstructions(true);
    try {
      const { data, error } = await supabase
        .from('therapist_details')
        .update({ booking_instructions: instructions.trim() || null })
        .eq('user_id', user.id)
        .select('user_id');
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No se pudo guardar.');
      toast({ title: '✅ Instrucciones guardadas', description: 'Se mostrarán al paciente antes de reservar.' });
    } catch (error) {
      logger.error('[OnlineBookingSection] save instructions failed:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudo guardar.' });
    } finally {
      setSavingInstructions(false);
    }
  };

  // --- Franjas de reserva online ---
  const DAYS = [
    { id: 1, name: 'Lunes' }, { id: 2, name: 'Martes' }, { id: 3, name: 'Miércoles' },
    { id: 4, name: 'Jueves' }, { id: 5, name: 'Viernes' }, { id: 6, name: 'Sábado' }, { id: 0, name: 'Domingo' },
  ];

  const addWindow = () => {
    setWindows((prev) => [...prev, { day_of_week: 4, start_time: '14:00', end_time: '18:00', is_new: true }]);
  };

  const updateWindow = (index, field, value) => {
    setWindows((prev) => prev.map((w, i) => (i === index ? { ...w, [field]: value } : w)));
  };

  const removeWindow = (index) => {
    setWindows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveWindows = async () => {
    setSavingWindows(true);
    try {
      // Validación de franjas si NO usa la disponibilidad general
      if (!useGeneral) {
        const invalid = windows.filter((w) => !w.start_time || !w.end_time || w.start_time >= w.end_time);
        if (invalid.length > 0) throw new Error('Revisá las franjas: la hora de fin debe ser posterior a la de inicio.');
        if (windows.length === 0) throw new Error('Agregá al menos una franja, o marcá "usar mi disponibilidad general".');
      }

      // 1) Guardar la preferencia (casilla)
      const { error: prefErr } = await supabase
        .from('therapist_details')
        .update({ online_booking_use_general: useGeneral })
        .eq('user_id', user.id);
      if (prefErr) throw prefErr;

      // 2) Reemplazar las franjas (delete + insert), solo relevante si !useGeneral
      const { error: delErr } = await supabase
        .from('online_booking_windows')
        .delete()
        .eq('therapist_id', user.id);
      if (delErr) throw delErr;

      if (!useGeneral && windows.length > 0) {
        const rows = windows.map((w) => ({
          therapist_id: user.id,
          day_of_week: w.day_of_week,
          start_time: w.start_time,
          end_time: w.end_time,
        }));
        const { error: insErr } = await supabase.from('online_booking_windows').insert(rows);
        if (insErr) throw insErr;
      }

      toast({ title: '✅ Horarios de reserva guardados' });
      load();
    } catch (error) {
      logger.error('[OnlineBookingSection] save windows failed:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudo guardar.' });
    } finally {
      setSavingWindows(false);
    }
  };

  const publicUrl = slug ? `${window.location.origin}/${slug}` : '';

  const handleCopy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast({ title: '¡Enlace copiado!', description: 'Ya puedes compartirlo con tus pacientes.' });
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
                    : 'Desactivado — los pacientes no pueden reservar online (puedes agendar manualmente).'}
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
                Comparte este enlace en tu Instagram, WhatsApp o tarjeta. Tus pacientes
                podrán reservar directamente.
              </p>
            </div>
          )}

          {/* Instrucciones para el paciente (se muestran antes de confirmar reserva) */}
          {enabled && (
            <div className="space-y-2">
              <Label htmlFor="booking-instructions" className="text-sm font-medium flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-primary" /> Instrucciones para el paciente
                <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="booking-instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Ej: Llega 5 minutos antes de tu cita. Trae tus exámenes previos si los tienes."
                className="resize-none h-20"
                maxLength={300}
                disabled={savingInstructions}
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveInstructions}
                  disabled={savingInstructions}
                  className="gap-1.5"
                >
                  {savingInstructions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar instrucciones
                </Button>
              </div>
            </div>
          )}

          {/* Horarios que se muestran en la reserva online */}
          {enabled && (
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" /> Horarios para reservas online
              </Label>

              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={useGeneral}
                  onCheckedChange={(c) => setUseGeneral(!!c)}
                  className="mt-0.5"
                />
                <span className="text-gray-700">
                  Usar mi disponibilidad general de agenda
                  <span className="block text-xs text-muted-foreground">
                    Los pacientes verán los mismos horarios que tienes configurados en tus clínicas.
                  </span>
                </span>
              </label>

              {/* Editor de franjas — solo si NO usa la disponibilidad general */}
              {!useGeneral && (
                <div className="space-y-2 pl-6">
                  <p className="text-xs text-muted-foreground">
                    Define los días y horas en que aceptas reservas online (ej. solo jueves y viernes en la tarde).
                  </p>
                  {windows.length === 0 && (
                    <p className="text-sm text-muted-foreground italic py-1">Aún no agregaste franjas.</p>
                  )}
                  {windows.map((w, index) => (
                    <div key={w.id || `new-${index}`} className="grid grid-cols-[1fr,auto,auto,auto] gap-2 items-center">
                      <Select value={String(w.day_of_week)} onValueChange={(v) => updateWindow(index, 'day_of_week', parseInt(v))}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DAYS.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <TimePicker value={w.start_time} onChange={(v) => updateWindow(index, 'start_time', v)} />
                      <TimePicker value={w.end_time} onChange={(v) => updateWindow(index, 'end_time', v)} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeWindow(index)} className="text-destructive hover:bg-destructive/10 h-9 w-9">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addWindow} className="gap-1.5">
                    <PlusCircle className="h-4 w-4" /> Agregar franja
                  </Button>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveWindows}
                  disabled={savingWindows}
                  className="gap-1.5"
                >
                  {savingWindows ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar horarios
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-md p-3">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p>
              Las reservas entran como <strong>pendientes de confirmar</strong> en tu agenda.
              Tú decides si las aceptas o las rechazas. Los horarios disponibles se toman
              de tu disponibilidad configurada por clínica.
            </p>
          </div>
        </div>
      )}
    </ProfileSectionCard>
  );
};

export default OnlineBookingSection;
