import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

/* =======================
   Transformaciones UI <-> DB
   ======================= */

const emptyService = () => ({
  id: null,
  service_name: '',
  duration_minutes: 60,      // number coherente con DB
  price_clp: null,
  price_usd: null,
  service_description: '',
  service_category: '',
  modality: '',
  is_public: false,
  is_active: true,

  // Campos extra del esquema (opcionales)
  insurance_coverage: false,
  insurance_providers: null, // array(text) o null
  max_participants: 1,
  min_age: null,
  max_age: null,
  requirements: null,
});

/** Convierte datos de la BD a formato del componente */
export const fromDbRow = (rows) => {
  if (!rows || rows.length === 0) return [emptyService()];
  return rows.map((r) => ({
    id: r.id ?? null,
    service_name: r.service_name ?? '',
    duration_minutes: typeof r.duration_minutes === 'number' ? r.duration_minutes : 60,
    price_clp: r.price_clp ?? null,
    price_usd: r.price_usd ?? null,
    service_description: r.service_description ?? '',
    service_category: r.service_category ?? '',
    modality: r.modality ?? '',
    is_public: !!r.is_public,
    is_active: r.is_active === undefined ? true : !!r.is_active,

    insurance_coverage: !!r.insurance_coverage,
    insurance_providers: r.insurance_providers ?? null,
    max_participants: r.max_participants ?? 1,
    min_age: r.min_age ?? null,
    max_age: r.max_age ?? null,
    requirements: r.requirements ?? null,
  }));
};

/** Normaliza un item de UI a payload de DB */
const toDbPayload = (s, therapistId) => {
  const payload = {
    therapist_id: therapistId,
    service_name: (s.service_name ?? '').trim() || null,
    duration_minutes:
      s.duration_minutes === '' || s.duration_minutes == null
        ? null
        : Number(s.duration_minutes),
    price_clp:
      s.price_clp === '' || s.price_clp == null ? null : Number(s.price_clp),
    price_usd:
      s.price_usd === '' || s.price_usd == null ? null : Number(s.price_usd),
    service_description: (s.service_description ?? '').trim() || null,
    service_category: (s.service_category ?? '').trim() || null,
    modality: (s.modality ?? '').trim() || null,
    is_public: !!s.is_public,
    is_active: s.is_active === undefined ? true : !!s.is_active,
    insurance_coverage: !!s.insurance_coverage,
    insurance_providers: Array.isArray(s.insurance_providers)
      ? s.insurance_providers
      : s.insurance_providers ?? null,
    max_participants:
      s.max_participants === '' || s.max_participants == null
        ? 1
        : Number(s.max_participants),
    min_age:
      s.min_age === '' || s.min_age == null ? null : Number(s.min_age),
    max_age:
      s.max_age === '' || s.max_age == null ? null : Number(s.max_age),
    requirements: (s.requirements ?? '').trim() || null,
  };

  // ✅ CORRECCIÓN: Solo incluir 'id' si existe Y es válido (no null, no 'new-...')
  if (s.id && !String(s.id).startsWith('new-')) {
    payload.id = s.id;
  }
  // ⚠️ IMPORTANTE: Si no hay id válido, NO agregar el campo 'id' al payload

  return payload;
};

/* ==============
   Lectura (SELECT)
   ============== */

/** Obtiene todos los servicios de un terapeuta (sólo columnas reales del esquema) */
export const fetchServices = async (therapistId) => {
  if (!therapistId) throw new Error('Se requiere ID de terapeuta');

  const { data, error } = await supabase
    .from('therapist_services')
    .select(`
      id,
      therapist_id,
      service_name,
      duration_minutes,
      price_clp,
      price_usd,
      service_description,
      modality,
      service_category,
      is_public,
      is_active,
      insurance_coverage,
      insurance_providers,
      max_participants,
      min_age,
      max_age,
      requirements,
      created_at,
      updated_at
    `)
    .eq('therapist_id', therapistId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching services:', error);
    throw new Error(`Error al cargar servicios: ${error.message}`);
  }

  return data || [];
};

/* ==============
   Escritura (INSERT + UPDATE separados)
   ============== */

/** Guarda o actualiza múltiples servicios */
export const saveServices = async (services, therapistId) => {
  if (!therapistId) throw new Error('Se requiere ID de terapeuta');

  // Filtra entradas con nombre válido
  const valid = (services || []).filter(
    (s) => (s?.service_name ?? '').trim().length > 0
  );

  if (valid.length === 0) {
    return { success: true };
  }

  // Separar nuevos de existentes
  const newServices = [];
  const existingServices = [];

  valid.forEach(s => {
    const payload = toDbPayload(s, therapistId);
    if (s.id && !String(s.id).startsWith('new-')) {
      existingServices.push(payload);
    } else {
      // NO incluir 'id' en servicios nuevos
      const { id, ...payloadWithoutId } = payload;
      newServices.push(payloadWithoutId);
    }
  });

  const results = [];

  // INSERT nuevos servicios
  if (newServices.length > 0) {
    const { data: insertedData, error: insertError } = await supabase
      .from('therapist_services')
      .insert(newServices)
      .select(`
        id,
        therapist_id,
        service_name,
        duration_minutes,
        price_clp,
        price_usd,
        service_description,
        modality,
        service_category,
        is_public,
        is_active,
        insurance_coverage,
        insurance_providers,
        max_participants,
        min_age,
        max_age,
        requirements,
        created_at,
        updated_at
      `);

    if (insertError) {
      logger.error('Error al insertar servicios:', insertError);
      throw new Error(`Error al guardar nuevos servicios: ${insertError.message}`);
    }

    results.push(...(insertedData || []));
  }

  // UPDATE servicios existentes
  if (existingServices.length > 0) {
    for (const service of existingServices) {
      const { id, ...updates } = service;

      const { data: updatedData, error: updateError } = await supabase
        .from('therapist_services')
        .update(updates)
        .eq('id', id)
        .select(`
          id,
          therapist_id,
          service_name,
          duration_minutes,
          price_clp,
          price_usd,
          service_description,
          modality,
          service_category,
          is_public,
          is_active,
          insurance_coverage,
          insurance_providers,
          max_participants,
          min_age,
          max_age,
          requirements,
          created_at,
          updated_at
        `)
        .single();

      if (updateError) {
        logger.error('Error al actualizar servicio:', updateError);
        throw new Error(`Error al actualizar servicio: ${updateError.message}`);
      }

      if (updatedData) {
        results.push(updatedData);
      }
    }
  }

  return results;
};

/* ==============
   Borrado (soft delete)
   ============== */

/** Desactiva (soft delete) un servicio específico */
export const deleteService = async (serviceId) => {
  if (!serviceId) throw new Error('Se requiere ID de servicio');

  const { error } = await supabase
    .from('therapist_services')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', serviceId);

  if (error) {
    logger.error('Error al desactivar servicio:', error);
    throw new Error(`Error al eliminar servicio: ${error.message}`);
  }

  return { success: true };
};