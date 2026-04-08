/**
 * @file src/hooks/useBatchAvailability.js
 * 
 * Hook que obtiene disponibilidad de MÚLTIPLES terapeutas
 * en una sola llamada RPC (get_batch_next_available_slots).
 * 
 * Uso: const { availabilityMap, loading } = useBatchAvailability(therapistIds);
 * 
 * availabilityMap = {
 *   'uuid-1': [
 *     { date: '2026-02-07', label: 'Hoy', slots: ['09:00', '09:30', '10:00'] },
 *     { date: '2026-02-08', label: 'Mañana', slots: ['11:00', '14:00'] }
 *   ],
 *   'uuid-2': [ ... ]
 * }
 */

import { useState, useEffect, useRef } from 'react';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

const useBatchAvailability = (therapistIds = []) => {
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [loading, setLoading] = useState(false);
  const prevIdsRef = useRef('');

  useEffect(() => {
    // Evitar re-fetch si los IDs no cambiaron
    const idsKey = [...therapistIds].sort().join(',');
    if (idsKey === prevIdsRef.current) return;
    prevIdsRef.current = idsKey;

    if (!therapistIds || therapistIds.length === 0) {
      setAvailabilityMap({});
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchBatch = async () => {
      setLoading(true);
      try {
        const today = format(new Date(), 'yyyy-MM-dd');

        const { data, error } = await supabase.rpc('get_batch_next_available_slots', {
          p_therapist_ids: therapistIds,
          p_start_date: today,
          p_max_days_per_therapist: 14,
          p_max_slots_per_day: 3,
          p_max_days_to_show: 2,
        });

        if (cancelled) return;
        if (error) throw error;

        // Agrupar por therapist_id
        const map = {};
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');

        for (const row of (data || [])) {
          const tid = row.therapist_id;
          if (!map[tid]) map[tid] = [];

          // Generar label
          let label;
          if (row.availability_date === todayStr) {
            label = 'Hoy';
          } else if (row.availability_date === tomorrowStr) {
            label = 'Mañana';
          } else {
            const d = new Date(row.availability_date + 'T12:00:00');
            label = format(d, "EEE d MMM", { locale: es });
          }

          // Extraer times del jsonb — parsing defensivo total
          let rawSlots = row.time_slots || [];
          // Si viene como string JSON (edge case Supabase)
          if (typeof rawSlots === 'string') {
            try { rawSlots = JSON.parse(rawSlots); } catch { rawSlots = []; }
          }
          if (!Array.isArray(rawSlots)) rawSlots = [];

          const slots = rawSlots.map(s => {
            if (typeof s === 'string') return s;
            if (s && typeof s === 'object' && s.time) return String(s.time);
            return null;
          }).filter(Boolean);

          map[tid].push({ date: row.availability_date, label, slots });
        }

        setAvailabilityMap(map);
      } catch (err) {
        logger.error('Error in batch availability:', err);
        if (!cancelled) setAvailabilityMap({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBatch();
    return () => { cancelled = true; };
  }, [therapistIds]);

  return { availabilityMap, loading };
};

export default useBatchAvailability;