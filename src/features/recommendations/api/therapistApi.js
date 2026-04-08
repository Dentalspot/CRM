import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

/**
 * Fetch public therapist profiles for search/recommendations
 * FIXED: Removed avatar_url from profiles select, uses therapist_branding instead
 */
export const fetchPublicTherapists = async (filters = {}) => {
  try {
    let query = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        region_id,
        city_id,
        therapist_details!therapist_details_user_id_fkey (
          user_id,
          public_email,
          is_public,
          years_experience,
          specialization_areas,
          languages,
          professional_title,
          university,
          graduation_year,
          slug,
          city_id
        ),
        therapist_branding (
          avatar_url,
          logo_url,
          primary_color,
          secondary_color
        )
      `)
      .eq('role', 'therapist');

    // Apply filters
    if (filters.specialty) {
      query = query.contains('therapist_details.specialization_areas', [filters.specialty]);
    }

    if (filters.region_id) {
      query = query.eq('region_id', filters.region_id);
    }

    if (filters.city_id) {
      query = query.eq('city_id', filters.city_id);
    }

    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,therapist_details.professional_title.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.limit(50);

    if (error) throw error;

    // Flatten nested data
    return (data || []).map(therapist => {
      const details = Array.isArray(therapist.therapist_details)
        ? therapist.therapist_details[0]
        : therapist.therapist_details;

      const branding = Array.isArray(therapist.therapist_branding)
        ? therapist.therapist_branding[0]
        : therapist.therapist_branding;

      return {
        ...therapist,
        therapist_details: details || {},
        therapist_branding: branding || {},
        avatar_url: branding?.avatar_url || null
      };
    });
  } catch (error) {
    logger.error('Error fetching public therapists:', error);
    return [];
  }
};

/**
 * Fetch single therapist profile for detail view
 * FIXED: Removed avatar_url from profiles select
 * FIXED: Use maybeSingle() to avoid PGRST116 error on 0 results
 */
export const fetchTherapistDetail = async (therapistId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        region_id,
        city_id,
        created_at,
        therapist_details!therapist_details_user_id_fkey (
          user_id,
          social_instagram_url,
          social_facebook_url,
          social_linkedin_url,
          social_twitter_url,
          about_me,
          headline_statement,
          main_address,
          public_email,
          is_public,
          years_experience,
          specialization_areas,
          languages,
          professional_title,
          university,
          graduation_year,
          slug,
          city_id
        ),
        therapist_branding (
          avatar_url,
          logo_url,
          primary_color,
          secondary_color,
          accent_color,
          text_color,
          background_color,
          font_family,
          font_size_base
        ),
        therapist_education (
          id,
          title,
          institution,
          graduation_year,
          description,
          is_public
        ),
        therapist_experience (
          id,
          role,
          institution,
          start_date,
          end_date,
          description,
          is_public
        )
      `)
      .eq('id', therapistId)
      .maybeSingle(); // Changed from .single() to .maybeSingle()

    if (error) throw error;
    if (!data) return null; // Handle not found gracefully

    // Flatten nested data
    const details = Array.isArray(data.therapist_details)
      ? data.therapist_details[0]
      : data.therapist_details;

    const branding = Array.isArray(data.therapist_branding)
      ? data.therapist_branding[0]
      : data.therapist_branding;

    return {
      ...data,
      therapist_details: details || {},
      therapist_branding: branding || {},
      avatar_url: branding?.avatar_url || null,
      therapist_education: data.therapist_education || [],
      therapist_experience: data.therapist_experience || []
    };
  } catch (error) {
    logger.error('Error fetching therapist detail:', error);
    throw error;
  }
};

/**
 * Fetch therapist reviews/ratings
 */
export const fetchTherapistReviews = async (therapistId) => {
  try {
    const { data, error } = await supabase
      .from('patient_reviews')
      .select(`
        id,
        rating,
        review,
        created_at,
        patient:profiles (
          id,
          full_name
        )
      `)
      .eq('therapist_id', therapistId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching therapist reviews:', error);
    return [];
  }
};

/**
 * Fetch therapist availability
 */
export const fetchTherapistAvailability = async (therapistId) => {
  try {
    const { data, error } = await supabase
      .from('therapist_availabilities')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching availability:', error);
    return [];
  }
};

/**
 * Fetch therapist services
 */
export const fetchTherapistServices = async (therapistId) => {
  try {
    const { data, error } = await supabase
      .from('therapist_services')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching services:', error);
    return [];
  }
};

// ============================================================================
// NEW EXPORTS
// ============================================================================

export const getTherapistById = async (id) => {
  return fetchTherapistDetail(id);
};

// Mapping: symptom labels → specialization_areas keywords in therapist_details
const SYMPTOM_TO_SPECIALIZATIONS = {
  'Tartamudez / Bloqueos al hablar': ['tartamudez', 'fluidez', 'habla'],
  'Dificultad para pronunciar ciertos sonidos (Dislalia)': ['dislalia', 'articulación', 'habla', 'fonética'],
  'Retraso en el desarrollo del lenguaje': ['lenguaje infantil', 'lenguaje', 'desarrollo', 'infantil'],
  'Dificultad para comprender o producir lenguaje (Afasia)': ['afasia', 'neurología', 'adultos', 'lenguaje'],
  'Problemas de voz (Ronquera, pérdida de voz)': ['voz', 'disfonía', 'otorrinolaringología'],
  'Dificultad al tragar (Disfagia)': ['disfagia', 'deglución', 'motricidad orofacial'],
  'Dificultad de atención auditiva': ['audiología', 'procesamiento auditivo', 'audición'],
  'Dificultades en lectura/escritura': ['lectoescritura', 'aprendizaje', 'lectura', 'escritura'],
};

export const getRecommendations = async (symptoms) => {
  // Build keyword set from selected symptoms
  const keywords = new Set();
  symptoms.forEach(symptomLabel => {
    const mapped = SYMPTOM_TO_SPECIALIZATIONS[symptomLabel];
    if (mapped) mapped.forEach(k => keywords.add(k.toLowerCase()));
  });

  if (keywords.size === 0) {
    return fetchPublicTherapists();
  }

  // Fetch all public therapists and score by keyword overlap
  const allTherapists = await fetchPublicTherapists();

  const scored = allTherapists
    .map(t => {
      const areas = (t.therapist_details?.specialization_areas || [])
        .map(a => a.toLowerCase());
      const matchCount = areas.filter(a =>
        [...keywords].some(k => a.includes(k))
      ).length;
      return { ...t, matchScore: matchCount };
    })
    .filter(t => t.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);

  return scored;
};