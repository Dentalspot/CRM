/**
 * @file src/features/odontogram/hooks/useOdontogramSuggestions.js
 *
 * Spec 030 followup mejora 1: analiza teethData del odontograma y genera
 * sugerencias automáticas de tratamiento que se renderean en una columna
 * lateral al lado del odontograma.
 *
 * Mapeo condición → tratamiento:
 *   caries      → Obturación
 *   fracture    → Restauración
 *   periapical  → Endodoncia
 *   extraction  → Extracción
 *
 * Las demás condiciones (healthy, restoration, crown, endodontics, implant,
 * sealant, absent) NO generan sugerencias porque representan estados actuales
 * (ya hechos o no requieren tratamiento).
 *
 * Las sugerencias se agrupan por (diente, tratamiento) — si el dentista marca
 * caries en múltiples superficies del mismo diente, una sola "Obturación
 * diente 36". El precio se autocompleta desde therapist_services si existe.
 */

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';

// Condiciones que generan sugerencia + nombre del tratamiento odontológico
const TREATMENT_FROM_CONDITION = {
  caries: 'Obturación',
  fracture: 'Restauración',
  periapical: 'Endodoncia',
  extraction: 'Extracción',
};

/**
 * Extrae el conjunto único de (tooth, treatment) desde teethData.
 *
 * teethData shape: { [toothNumber]: { mesial: 'caries', distal: 'healthy', ... } }
 */
function extractTreatmentKeys(teethData) {
  const seen = new Map(); // key = `${tooth}|${treatment}` → { tooth, treatment, conditions: Set }
  if (!teethData || typeof teethData !== 'object') return [];

  for (const [toothStr, surfaces] of Object.entries(teethData)) {
    if (!surfaces || typeof surfaces !== 'object') continue;
    for (const [, condition] of Object.entries(surfaces)) {
      const treatment = TREATMENT_FROM_CONDITION[condition];
      if (!treatment) continue;
      const tooth = String(toothStr);
      const key = `${tooth}|${treatment}`;
      if (!seen.has(key)) {
        seen.set(key, { tooth, treatment, conditions: new Set() });
      }
      seen.get(key).conditions.add(condition);
    }
  }

  return Array.from(seen.values()).map((s) => ({
    ...s,
    conditions: Array.from(s.conditions),
  }));
}

/**
 * Carga el catálogo de servicios del dentista una sola vez. El lookup de
 * precio se hace en memoria (match case-insensitive contra el nombre del
 * tratamiento sugerido).
 */
function useTherapistServiceCatalog(therapistId) {
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    if (!therapistId) {
      setCatalog([]);
      return;
    }
    let cancelled = false;
    supabase
      .from('therapist_services')
      .select('id, service_name, price_clp')
      .eq('therapist_id', therapistId)
      .eq('is_active', true)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          logger.warn('[useOdontogramSuggestions] catalog fetch failed', {
            message: error.message,
          });
          setCatalog([]);
          return;
        }
        setCatalog(data || []);
      });
    return () => {
      cancelled = true;
    };
  }, [therapistId]);

  return catalog;
}

/**
 * Hook principal.
 *
 * @param {Object} teethData - data actual del odontograma { tooth: { surface: condition } }
 * @param {string|null} therapistId - para lookup de precios en catálogo
 * @returns {{
 *   suggestions: Array<{
 *     key: string,
 *     tooth: string,
 *     treatment: string,
 *     conditions: string[],
 *     unit_price: number,
 *     service_id: string|null,
 *     description: string
 *   }>,
 *   dismissedKeys: Set<string>,
 *   dismissSuggestion: (key: string) => void,
 *   resetDismissed: () => void,
 * }}
 */
export default function useOdontogramSuggestions(teethData, therapistId) {
  const catalog = useTherapistServiceCatalog(therapistId);
  const [dismissedKeys, setDismissedKeys] = useState(new Set());

  const suggestions = useMemo(() => {
    const raw = extractTreatmentKeys(teethData);

    return raw
      .filter((r) => !dismissedKeys.has(`${r.tooth}|${r.treatment}`))
      .map((r) => {
        // Lookup precio del catálogo: match case-insensitive del nombre del
        // tratamiento contra service_name. Tomamos el primer match.
        const lowerTreatment = r.treatment.toLowerCase();
        const match = catalog.find((s) =>
          (s.service_name || '').toLowerCase().includes(lowerTreatment)
        );

        return {
          key: `${r.tooth}|${r.treatment}`,
          tooth: r.tooth,
          treatment: r.treatment,
          conditions: r.conditions,
          service_id: match?.id || null,
          unit_price: match ? Number(match.price_clp) || 0 : 0,
          description: `${r.treatment} diente ${r.tooth}`,
        };
      })
      .sort((a, b) => Number(a.tooth) - Number(b.tooth));
  }, [teethData, catalog, dismissedKeys]);

  const dismissSuggestion = (key) => {
    setDismissedKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  const resetDismissed = () => setDismissedKeys(new Set());

  return { suggestions, dismissedKeys, dismissSuggestion, resetDismissed };
}
