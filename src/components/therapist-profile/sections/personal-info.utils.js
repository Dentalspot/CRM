import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

export const fromDbRow = (dbRow) => {
  const defaultData = {
    full_name: '',
    email: '',
    phone: '',
    rut: '',
    birthdate: '',
    gender: '',
    region_id: '',
    city_id: '',
    main_address: '',
    public_email: '',
    professional_title: '',
    headline: '',
    about_me: '',
    registration_supersalud: '',
    registration_secreduc: '',
    university: '',
    graduation_year: '',
    years_experience: '',
    languages: [],
    social_instagram_url: '',
    social_facebook_url: '',
    social_linkedin_url: '',
    social_twitter_url: '',
    is_public: false,
    avatar_url: '',
    landing_page_slug: '',
    landing_page_published: false,
  };

  if (!dbRow) return defaultData;

  // Limpiar valores heredados de FonoKit que no aplican a dentistas
  const FONOKIT_DEFAULTS = [
    'fonoaudiólogo', 'fonoaudióloga', 'fonoaudiología', 'fonoaudiolog',
    'trastornos de la comunicación',
  ];
  const isFonokitValue = (val) => {
    if (!val) return false;
    const lower = val.toLowerCase();
    return FONOKIT_DEFAULTS.some(term => lower.includes(term));
  };

  return {
    full_name: dbRow.full_name || '',
    email: dbRow.email || '',
    phone: dbRow.phone || '',
    rut: dbRow.rut || '',
    birthdate: dbRow.birthdate || '',
    gender: dbRow.gender || '',
    region_id: dbRow.region_id || '',
    city_id: dbRow.city_id || '',
    main_address: dbRow.main_address || '',
    public_email: dbRow.public_email || '',
    professional_title: isFonokitValue(dbRow.professional_title) ? '' : (dbRow.professional_title || ''),
    headline: isFonokitValue(dbRow.headline_statement) ? '' : (dbRow.headline_statement || ''),
    about_me: isFonokitValue(dbRow.about_me) ? '' : (dbRow.about_me || ''),
    registration_supersalud: dbRow.registration_supersalud || '',
    registration_secreduc: dbRow.registration_secreduc || '',
    university: dbRow.university || '',
    graduation_year: dbRow.graduation_year || '',
    years_experience: dbRow.years_experience || '',
    languages: dbRow.languages || [],
    social_instagram_url: dbRow.social_instagram_url || '',
    social_facebook_url: dbRow.social_facebook_url || '',
    social_linkedin_url: dbRow.social_linkedin_url || '',
    social_twitter_url: dbRow.social_twitter_url || '',
    is_public: dbRow.is_public ?? false,
    avatar_url: dbRow.avatar_url || '',
    landing_page_slug: dbRow.landing_page_slug || '',
    landing_page_published: dbRow.landing_page_published ?? false,
  };
};

export const fetchTherapistDetails = async (userId) => {
  // Try view first, fallback to direct tables
  const { data: viewData, error: viewError } = await supabase
    .from('v_therapist_full_profile')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (!viewError && viewData) return viewData;

  // Fallback: direct query
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (profileError && profileError.code !== 'PGRST116') {
    logger.error('Error fetching therapist details:', profileError);
    throw new Error('No se pudo cargar el perfil del terapeuta.');
  }

  return profile;
};

export const saveTherapistProfile = async (userId, formData) => {

  // Helper to sanitize integer inputs
  const sanitizeInt = (val) => {
    if (val === '' || val === null || val === undefined) return null;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? null : parsed;
  };

  // Helper to sanitize date inputs
  const sanitizeDate = (val) => {
    if (val === '' || val === null || val === undefined) return null;
    return val;
  };

  // 1. Llamar a la RPC para actualizar profiles y therapist_details básicos
  const { data: rpcResult, error: rpcError } = await supabase.rpc('upsert_user_profile', {
    p_user_id: userId,
    p_full_name: formData.full_name || null,
    p_email: formData.email || null,
    p_display_name: null,
    p_bio: formData.about_me || null,
    p_street: formData.main_address || null,
    p_city_id: sanitizeInt(formData.city_id),
    p_region_id: sanitizeInt(formData.region_id),
    p_birthdate: sanitizeDate(formData.birthdate),
    p_gender: formData.gender || null,
    p_is_public: formData.is_public ?? false,
    p_professional_title: formData.professional_title || null,
    p_headline_statement: formData.headline || null,
  });

  if (rpcError) {
    logger.error('Error saving profile via RPC:', rpcError);
    throw new Error('No se pudo guardar la información del perfil.');
  }

  // Verificar si la RPC retornó error
  if (rpcResult && rpcResult.success === false) {
    logger.error('RPC returned error:', rpcResult.message);
    throw new Error(rpcResult.message || 'Error al guardar el perfil.');
  }

  // 2. Actualizar phone y rut en profiles (la RPC no los incluye)
  const { error: profilesError } = await supabase
    .from('profiles')
    .update({
      phone: formData.phone || null,
      rut: formData.rut || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profilesError) {
    logger.error('Error updating profiles (phone/rut):', profilesError);
    throw new Error('No se pudo guardar el teléfono y RUT.');
  }

  // 3. Actualizar therapist_details con campos adicionales
  const { error: detailsError } = await supabase
    .from('therapist_details')
    .upsert(
      {
        user_id: userId,
        registration_supersalud: formData.registration_supersalud || null,
        registration_secreduc: formData.registration_secreduc || null,
        university: formData.university || null,
        graduation_year: sanitizeInt(formData.graduation_year),
        years_experience: sanitizeInt(formData.years_experience),
        languages: formData.languages || [],
        social_instagram_url: formData.social_instagram_url || null,
        social_facebook_url: formData.social_facebook_url || null,
        social_linkedin_url: formData.social_linkedin_url || null,
        social_twitter_url: formData.social_twitter_url || null,
        public_email: formData.public_email || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (detailsError) {
    logger.error('Error updating therapist_details:', detailsError);
    throw new Error('No se pudieron guardar los detalles adicionales del terapeuta.');
  }
};