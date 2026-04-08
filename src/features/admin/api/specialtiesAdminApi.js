import { supabase } from '@/lib/supabaseClient';

export const specialtiesAdminApi = {
  // --- Basic Fetching ---
  getTherapists: async (page = 0, limit = 50, search = '') => {
    let query = supabase
      .from('profiles')
      .select(`
        id, 
        full_name, 
        email, 
        role,
        therapist_details!therapist_details_user_id_fkey (
          professional_title,
          university,
          years_experience
        )
      `)
      .eq('role', 'therapist')
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (search) {
      query = query.ilike('full_name', `%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data, count };
  },

  getAllSpecialties: async () => {
    const { data, error } = await supabase
      .from('specialties')
      .select('*')
      .order('name');
    if (error) throw error;
    return data;
  },

  getTherapistEducation: async (therapistId) => {
    const { data, error } = await supabase
      .from('therapist_education')
      .select('*')
      .eq('therapist_id', therapistId);
    if (error) throw error;
    return data;
  },

  getAssignedSpecialties: async (therapistId) => {
    const { data, error } = await supabase
      .from('therapist_specialties')
      .select(`
        specialty_id,
        specialties (id, name)
      `)
      .eq('therapist_id', therapistId);
    if (error) throw error;
    return data.map(item => item.specialties);
  },

  // --- Logic & RPCs ---
  getSuggestionsForTherapist: async (therapistId) => {
    const { data, error } = await supabase
      .rpc('suggest_missing_specialties', { p_therapist_id: therapistId });
    if (error) throw error;
    return data;
  },

  assignSpecialty: async (therapistId, specialtyId) => {
    const { data, error } = await supabase
      .from('therapist_specialties')
      .insert({ therapist_id: therapistId, specialty_id: specialtyId })
      .select();
    if (error) throw error;
    return data;
  },

  // --- Keywords CRUD ---
  getKeywords: async (specialtyId = null) => {
    let query = supabase
      .from('specialty_keywords')
      .select(`
        id, 
        keyword, 
        weight, 
        specialty_id,
        specialties (name)
      `)
      .order('specialty_id');

    if (specialtyId) {
      query = query.eq('specialty_id', specialtyId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  createKeyword: async (keywordData) => {
    const { data, error } = await supabase
      .from('specialty_keywords')
      .insert(keywordData)
      .select();
    if (error) throw error;
    return data;
  },

  updateKeyword: async (id, updates) => {
    const { data, error } = await supabase
      .from('specialty_keywords')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data;
  },

  deleteKeyword: async (id) => {
    const { error } = await supabase
      .from('specialty_keywords')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // --- Suggested Courses CRUD ---
  getSuggestedCourses: async () => {
    const { data, error } = await supabase
      .from('suggested_courses')
      .select(`
        *,
        specialties (name)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  createSuggestedCourse: async (courseData) => {
    const { data, error } = await supabase
      .from('suggested_courses')
      .insert(courseData)
      .select();
    if (error) throw error;
    return data;
  },

  updateSuggestedCourse: async (id, updates) => {
    const { data, error } = await supabase
      .from('suggested_courses')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data;
  },

  deleteSuggestedCourse: async (id) => {
    const { error } = await supabase
      .from('suggested_courses')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // --- Metrics ---
  getBadgeDistribution: async () => {
    // Requires view v_reputation_badges
    const { data, error } = await supabase
      .from('v_reputation_badges')
      .select('badge_level, final_score');
    if (error) throw error;
    return data;
  }
};