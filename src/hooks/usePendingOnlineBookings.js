import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import logger from '@/lib/utils/logger';

/**
 * @file src/hooks/usePendingOnlineBookings.js
 *
 * Cuenta las reservas ONLINE pendientes de confirmar del dentista logueado.
 * Una reserva online pendiente = booking_source 'online_self_booking' +
 * status 'scheduled' (aún no confirmada/cancelada por el dentista) + fecha
 * futura (hoy en adelante).
 *
 * Se usa para:
 *  - Badge (N) junto a "Agenda" en el sidebar
 *  - Banner "N reservas online sin confirmar" en Mi Agenda
 *
 * Suscribe a Realtime sobre appointments del dentista para refrescar el
 * contador cuando llega una reserva nueva o el dentista confirma una.
 */
export const usePendingOnlineBookings = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPending = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('appointments')
        .select('id, date, start_time, notes, patient:patients!appointments_patient_id_fkey(full_name)')
        .eq('therapist_id', user.id)
        .eq('booking_source', 'online_self_booking')
        .eq('status', 'scheduled')
        .gte('date', today)
        .order('date')
        .order('start_time');
      if (error) throw error;
      setBookings(data || []);
      setCount((data || []).length);
    } catch (err) {
      logger.warn('[usePendingOnlineBookings] error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  // Realtime: refrescar ante cambios en las citas del dentista
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`pending-online-bookings:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments', filter: `therapist_id=eq.${user.id}` },
        () => fetchPending()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, fetchPending]);

  return { count, bookings, loading, refresh: fetchPending };
};

export default usePendingOnlineBookings;
