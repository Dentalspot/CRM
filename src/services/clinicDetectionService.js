import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

export const cleanRutEmpresa = (rut) => {
  if (!rut) return '';
  return rut.replace(/[.\-\s]/g, '').toUpperCase();
};

export const formatRutEmpresa = (value) => {
  const clean = value.replace(/[^0-9kK]/g, '');
  if (clean.length <= 1) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${dv}`;
};

export const searchSimilarClinics = async ({ rutEmpresa, name, cityId }) => {
  try {
    const { data, error } = await supabase.rpc('search_similar_clinics', {
      p_rut_empresa: rutEmpresa ? cleanRutEmpresa(rutEmpresa) : null,
      p_name: name || null,
      p_city_id: cityId || null,
    });

    if (error) throw error;

    return {
      exactRutMatch: data?.exact_rut_match || [],
      nameMatches: data?.name_matches || [],
      addressMatches: data?.address_matches || [],
      hasMatch: !!(data?.exact_rut_match?.length || data?.name_matches?.length),
    };
  } catch (err) {
    logger.error('Error searching similar clinics:', err);
    return { exactRutMatch: [], nameMatches: [], addressMatches: [], hasMatch: false };
  }
};

export const requestJoinClinic = async (clinicId, therapistId) => {
  // Check if already a member
  const { data: existing } = await supabase
    .from('clinic_therapists')
    .select('id, is_active')
    .eq('clinic_id', clinicId)
    .eq('therapist_id', therapistId)
    .maybeSingle();

  if (existing?.is_active) {
    return { success: true, alreadyMember: true, message: 'Ya eres miembro de esta clínica.' };
  }

  if (existing && !existing.is_active) {
    const { error } = await supabase
      .from('clinic_therapists')
      .update({ is_active: true, joined_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) throw error;
    return { success: true, reactivated: true, message: 'Te has reincorporado a la clínica.' };
  }

  const { error } = await supabase
    .from('clinic_therapists')
    .insert({
      clinic_id: clinicId,
      therapist_id: therapistId,
      is_active: true,
      joined_at: new Date().toISOString(),
    });

  if (error) throw error;
  return { success: true, message: 'Te has unido a la clínica exitosamente.' };
};
