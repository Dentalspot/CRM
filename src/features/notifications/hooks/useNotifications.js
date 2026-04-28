import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import logger from '@/lib/utils/logger';

/**
 * Hook que carga notifications no expiradas del usuario actual,
 * suscribe a Realtime para nuevas, y dispara toast cuando llega una.
 *
 * @param {object} opts
 * @param {number} opts.limit - cuántas mostrar en el dropdown (default 5)
 * @param {boolean} opts.toastOnNew - mostrar toast cuando llegan nuevas (default true)
 */
export const useNotifications = (opts = {}) => {
  const { limit = 5, toastOnNew = true } = opts;
  const { user } = useAuth();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const initialLoadRef = useRef(false);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const nowIso = new Date().toISOString();

      // Lista (limitada)
      const { data: list, error: listErr } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (listErr) throw listErr;

      // Contador unread (independiente del limit)
      const { count, error: countErr } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`);
      if (countErr) throw countErr;

      setNotifications(list || []);
      setUnreadCount(count || 0);
    } catch (err) {
      logger.warn('[useNotifications] error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, limit]);

  // Carga inicial
  useEffect(() => {
    if (!user?.id) return;
    fetchAll().then(() => {
      initialLoadRef.current = true;
    });
  }, [user?.id, fetchAll]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new;

          // Refetch para mantener consistencia
          fetchAll();

          // Toast (solo si ya cargó al menos una vez, para evitar disparar al reconnect)
          if (toastOnNew && initialLoadRef.current && !n.read) {
            toast({
              title: n.title,
              description: n.message,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchAll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchAll, toast, toastOnNew]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);
      if (error) throw error;
      // Optimistic update local
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      logger.warn('[useNotifications] markAsRead error:', err.message);
    }
  }, [user?.id]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('read', false);
      if (error) throw error;
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      logger.warn('[useNotifications] markAllAsRead error:', err.message);
    }
  }, [user?.id]);

  return {
    notifications,
    unreadCount,
    loading,
    refresh: fetchAll,
    markAsRead,
    markAllAsRead,
  };
};

/**
 * Variante que carga TODAS las notifications no expiradas (sin limit).
 * Usado en la página dedicada.
 */
export const useAllNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      logger.warn('[useAllNotifications] error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { notifications, loading, refresh: fetchAll };
};
