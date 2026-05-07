
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

export const fetchTherapistFullProfile = async (therapistId) => {
  try {
    // 1. First attempt: Query from v_therapist_full_profile view
    const { data: viewData, error: viewError } = await supabase
      .from('v_therapist_full_profile')
      .select('*')
      .eq('id', therapistId)
      .maybeSingle();

    if (viewError) {
      logger.warn('Warning: Could not fetch from v_therapist_full_profile view, falling back to direct tables', viewError);
    }

    if (viewData) {
      // Map view data back to the structure expected by components
      return {
        id: viewData.id,
        full_name: viewData.full_name,
        email: viewData.email,
        phone: viewData.phone,
        rut: viewData.rut,
        role: 'therapist',
        region_id: viewData.region_id,
        city_id: viewData.city_id,
        avatar_url: viewData.avatar_url,
        headline_statement: viewData.headline_statement,
        therapist_details: {
          user_id: viewData.id,
          social_instagram_url: viewData.social_instagram_url,
          social_facebook_url: viewData.social_facebook_url,
          social_linkedin_url: viewData.social_linkedin_url,
          social_twitter_url: viewData.social_twitter_url,
          about_me: viewData.about_me,
          headline_statement: viewData.headline_statement,
          main_address: viewData.main_address,
          public_email: viewData.public_email,
          is_public: viewData.is_public,
          years_experience: viewData.years_experience,
          specialization_areas: viewData.specialization_areas || [],
          languages: viewData.languages || [],
          professional_title: viewData.professional_title,
          university: viewData.university,
          graduation_year: viewData.graduation_year,
          slug: viewData.slug,
          city_id: viewData.city_id,
          reminder_preferences: null
        },
        therapist_branding: {
          avatar_url: viewData.avatar_url,
          logo_url: viewData.logo_url,
          primary_color: viewData.primary_color,
          secondary_color: viewData.secondary_color,
          accent_color: viewData.accent_color,
          text_color: viewData.text_color,
          background_color: viewData.background_color,
          font_family: viewData.font_family,
          font_size_base: viewData.font_size_base
        }
      };
    }

    // 2. Fallback: Query direct tables if view fails or returns nothing
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        rut,
        role,
        region_id,
        city_id,
        created_at,
        updated_at,
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
          city_id,
          reminder_preferences
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
        )
      `)
      .eq('id', therapistId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Perfil de terapeuta no encontrado');

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
      full_name: data.full_name,
      headline_statement: details?.headline_statement
    };
  } catch (error) {
    logger.error('Error fetching therapist full profile:', error);
    throw error;
  }
};

export const fetchTherapistPatients = async (therapistId) => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        id,
        profile_id,
        therapist_id,
        notes,
        status,
        created_at,
        updated_at,
        profile:profiles!patients_profile_id_fkey (
          id,
          full_name,
          email,
          phone,
          birthdate,
          rut,
          gender
        )
      `)
      .eq('therapist_id', therapistId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching therapist patients:', error);
    return [];
  }
};

export const fetchTherapistAppointments = async (therapistId, startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients!appointments_patient_id_fkey (
          id,
          profile:profiles!patients_profile_id_fkey (
            id,
            full_name,
            email,
            phone
          )
        ),
        service:therapist_services!appointments_service_id_fkey (
          id,
          service_name,
          duration_minutes,
          price_clp
        )
      `)
      .eq('therapist_id', therapistId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching appointments:', error);
    return [];
  }
};

export const fetchTherapistServices = async (therapistId) => {
  try {
    const { data, error } = await supabase
      .from('therapist_services')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching services:', error);
    return [];
  }
};

export const fetchTherapistSpecialties = async (therapistId) => {
  try {
    const { data, error } = await supabase
      .from('therapist_specialties')
      .select(`
        *,
        specialty:specialties (
          id,
          name,
          description
        )
      `)
      .eq('therapist_id', therapistId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching specialties:', error);
    return [];
  }
};

export const updateTherapistProfile = async (therapistId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', therapistId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const updateTherapistDetails = async (therapistId, updates) => {
  const { data, error } = await supabase
    .from('therapist_details')
    .update(updates)
    .eq('user_id', therapistId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const updateTherapistBranding = async (therapistId, updates) => {
  const { data, error } = await supabase
    .from('therapist_branding')
    .update(updates)
    .eq('therapist_id', therapistId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const fetchTherapistPlans = async (therapistId) => {
  const { data, error } = await supabase
    .from('treatment_plans')
    .select('*')
    .eq('therapist_id', therapistId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const fetchTherapistExercises = async (therapistId) => {
  const { data, error } = await supabase
    .from('therapist_exercises')
    .select('*')
    .eq('therapist_id', therapistId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const fetchTherapistMaterials = async (therapistId) => {
  const { data, error } = await supabase
    .from('therapist_materials')
    .select('*')
    .eq('therapist_id', therapistId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const fetchTherapistDocuments = async (therapistId) => {
  const { data, error } = await supabase
    .from('therapist_documents')
    .select('*')
    .eq('therapist_id', therapistId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const fetchTherapistEducation = async (therapistId) => {
  const { data, error } = await supabase
    .from('therapist_education')
    .select('*')
    .eq('therapist_id', therapistId)
    .eq('is_public', true)
    .order('graduation_year', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const fetchTherapistExperience = async (therapistId) => {
  const { data, error } = await supabase
    .from('therapist_experience')
    .select('*')
    .eq('therapist_id', therapistId)
    .eq('is_public', true)
    .order('start_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getTherapistAvailability = async (therapistId, clinicId, startDate, days) => {
  const { data, error } = await supabase.rpc('get_therapist_availability', {
    p_therapist_identifier: therapistId,
    p_clinic_id: clinicId,
    p_start_date: startDate,
    p_days: days
  });
  
  if (error) throw error;
  return data;
};

export const createAppointment = async (appointmentData) => {
  const { data, error } = await supabase
    .from('appointments')
    .insert(appointmentData)
    .select()
    .maybeSingle();
    
  if (error) return { error };
  return { data };
};

export const getTherapistClinics = async (therapistId) => {
  const { data, error } = await supabase.rpc('get_therapist_clinics', {
    p_therapist_id: therapistId
  });
  
  if (error) throw error;
  return data;
};

export const getTherapistAppointments = async (therapistId, startDate, endDate, clinicId, organizationId = null) => {
  let query = supabase
    .from('appointments')
    .select(`
      *,
      patient:patients!appointments_patient_id_fkey (
        id,
        full_name,
        email,
        phone,
        rut,
        profile:profiles!patients_profile_id_fkey (
          id,
          full_name,
          email,
          phone
        )
      ),
      service:therapist_services!appointments_service_id_fkey (id, service_name, duration_minutes, price_clp)
    `)
    .eq('therapist_id', therapistId)
    .gte('date', startDate)
    .lte('date', endDate);

  // Scopear a la org seleccionada en el header (Cristobal multi-org).
  // Sin esto, en Igeldo aparecen las citas de Álamos y viceversa.
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }
  
  const { data, error } = await query.order('date', { ascending: true });
  if (error) throw error;
  return data;
};

export const getTherapistBlockedTimes = async (therapistId, startDate, endDate, clinicId) => {
  let query = supabase
    .from('blocked_times')
    .select('*')
    .eq('therapist_id', therapistId)
    .gte('start_time', startDate)
    .lte('end_time', endDate);
    
  if (clinicId) {
    query = query.eq('clinic_id', clinicId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const updateAppointment = async (appointmentId, updates) => {
  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', appointmentId)
    .select()
    .maybeSingle();
    
  if (error) return { error };
  return { data };
};
