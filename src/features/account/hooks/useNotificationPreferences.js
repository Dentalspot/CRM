import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/utils/logger';

const DEFAULT_PREFS = {
  email_appointments: true,
  email_reminders: true,
  email_messages: true,
  email_system: true,
  email_marketing: false,
  email_budgets: true, // notificaciones de presupuestos y pagos (in-app y email)
  sms_appointments: false,
  sms_reminders: false,
  push_appointments: true,
  push_reminders: true,
  push_messages: true,
};

/**
 * Hook para leer y actualizar las preferencias de notificación del usuario.
 * Reusa la tabla user_notification_preferences existente.
 *
 * Nota: email_budgets se maneja como columna extra. Si no existe en la tabla,
 * se usa solo en memoria por ahora (la migración la añadirá si es necesario).
 */
export const useNotificationPreferences = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchPrefs = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setPrefs({ ...DEFAULT_PREFS, ...data });
      }
    } catch (err) {
      logger.warn('[useNotificationPreferences] fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchPrefs(); }, [fetchPrefs]);

  const updatePref = useCallback(async (key, value) => {
    if (!user?.id) return { ok: false };
    setSaving(true);
    const optimistic = { ...prefs, [key]: value };
    setPrefs(optimistic);
    try {
      const payload = { user_id: user.id, [key]: value };
      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) throw error;
      return { ok: true };
    } catch (err) {
      logger.error('[useNotificationPreferences] update error:', err);
      // rollback
      setPrefs(prefs);
      return { ok: false, error: err };
    } finally {
      setSaving(false);
    }
  }, [user?.id, prefs]);

  return { prefs, loading, saving, updatePref, refresh: fetchPrefs };
};
