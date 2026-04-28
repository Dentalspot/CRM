import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/utils/logger';

/**
 * Hook que verifica si el usuario tiene documentos legales pendientes
 * de re-aceptación (T&C / Política de Privacidad actualizadas).
 *
 * - Carga via RPC needs_legal_reaccept() los slugs pendientes con su contenido.
 * - Si hay pendientes → modal bloqueante.
 * - Expone accept(slugs) que llama RPC accept_legal_documents.
 */
export const useLegalAcceptance = () => {
  const { user, loadingAuth } = useAuth();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const check = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('needs_legal_reaccept');
      if (error) throw error;
      setPending(data || []);
    } catch (err) {
      logger.warn('[useLegalAcceptance] check error:', err.message);
      // Por seguridad, en caso de error NO bloquear al usuario
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (loadingAuth || !user?.id) return;
    check();
  }, [loadingAuth, user?.id, check]);

  const acceptAll = useCallback(async () => {
    if (pending.length === 0) return;
    setAccepting(true);
    try {
      const slugs = pending.map((d) => d.slug);
      const { error } = await supabase.rpc('accept_legal_documents', { p_slugs: slugs });
      if (error) throw error;
      setPending([]);
      return { ok: true };
    } catch (err) {
      logger.error('[useLegalAcceptance] accept error:', err.message);
      return { ok: false, error: err };
    } finally {
      setAccepting(false);
    }
  }, [pending]);

  return {
    pending,           // [{ slug, version, title, content }]
    needsAcceptance: pending.length > 0,
    loading,
    accepting,
    acceptAll,
    refresh: check,
  };
};
