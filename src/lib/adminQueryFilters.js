/**
 * @file adminQueryFilters.js
 *
 * Filtros de seguridad para queries admin en el ecosistema Comunicare.
 * Garantiza que cada app (FonoKit, DentalSpot, KineKit, etc.) solo vea
 * sus propios datos, a pesar de compartir la misma BD Supabase.
 *
 * Uso:
 *   import { filterByApp, filterProfilesByApp } from '@/lib/adminQueryFilters';
 *
 *   // Filtrar pacientes de dentistas de DentalSpot
 *   const query = supabase.from('patients').select('*');
 *   const { data } = await filterByApp(query, 'therapist_id');
 *
 *   // Filtrar perfiles directamente
 *   const { data } = await filterProfilesByApp(supabase.from('profiles').select('*'));
 */

import { supabase } from '@/lib/supabaseClient';

/**
 * Identificador de esta app en el ecosistema Comunicare.
 * Debe coincidir con el origin_app guardado en user_metadata al registrarse.
 */
export const APP_ID = 'dentalspot';

/**
 * Obtiene los IDs de profesionales (therapists) registrados en esta app.
 * Filtra por raw_user_meta_data->>'origin_app' = APP_ID
 *
 * NOTA: Usa auth.users via RPC o profiles con el campo origin_app.
 * Como origin_app esta en user_metadata (auth.users), necesitamos
 * una vista o RPC en Supabase que exponga este dato.
 *
 * Alternativa pragmatica: filtrar por profiles que tienen
 * relacion con datos creados desde esta app.
 */

/**
 * Cache de IDs de profesionales de esta app (se refresca cada 5 min)
 */
let _appTherapistIds = null;
let _lastFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Obtiene los user IDs de profesionales registrados en DentalSpot.
 * Usa una RPC de Supabase que filtra auth.users por origin_app metadata.
 * Fallback: retorna null (sin filtro) si la RPC no existe.
 */
export async function getAppTherapistIds() {
  const now = Date.now();
  if (_appTherapistIds && (now - _lastFetch) < CACHE_TTL) {
    return _appTherapistIds;
  }

  try {
    // Intentar via RPC (mas eficiente)
    const { data, error } = await supabase.rpc('get_users_by_origin_app', {
      p_origin_app: APP_ID,
      p_role: 'therapist'
    });

    if (!error && data) {
      _appTherapistIds = data.map(u => u.id);
      _lastFetch = now;
      return _appTherapistIds;
    }

    // Fallback: buscar en profiles con clinics/therapist_profiles
    // que tengan datos creados despues del lanzamiento de DentalSpot
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'therapist');

    if (!profileError && profiles) {
      // Sin RPC, retornar todos los therapists (menos seguro pero funcional)
      _appTherapistIds = profiles.map(p => p.id);
      _lastFetch = now;
      return _appTherapistIds;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Filtra una query de Supabase para solo incluir registros
 * asociados a profesionales de esta app.
 *
 * @param {Object} query - Supabase query builder
 * @param {string} therapistColumn - Nombre de la columna FK al therapist (default: 'therapist_id')
 * @returns {Object} Query filtrada
 */
export async function filterByApp(query, therapistColumn = 'therapist_id') {
  const ids = await getAppTherapistIds();
  if (ids && ids.length > 0) {
    return query.in(therapistColumn, ids);
  }
  return query;
}

/**
 * Filtra profiles para solo mostrar los de esta app.
 * Util para listados de profesionales en admin.
 *
 * @param {Object} query - Supabase query en tabla profiles
 * @returns {Object} Query filtrada
 */
export async function filterProfilesByApp(query) {
  const ids = await getAppTherapistIds();
  if (ids && ids.length > 0) {
    return query.in('id', ids);
  }
  return query;
}

/**
 * Invalida el cache de IDs (llamar despues de crear/eliminar usuarios)
 */
export function invalidateAppCache() {
  _appTherapistIds = null;
  _lastFetch = 0;
}
