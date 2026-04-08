
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { useToast } from '@/components/ui/use-toast';

const useTherapistProfile = (userId) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Using explicit relationship name for therapist_details to resolve ambiguity (PGRST201)
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          therapist_details:therapist_details!therapist_details_user_id_fkey(*),
          therapist_education(*),
          therapist_experience(*),
          therapist_specialties(specialties(id, name)),
          therapist_conditions(*),
          clinics(*),
          therapist_services(*),
          therapist_availabilities(*),
          therapist_landing_pages(*),
          therapist_branding(*)
        `)
        .eq('id', userId)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          logger.warn("No profile found for user, but that's okay for new users. Fetching basic profile.");
          const { data: userOnlyData, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          if (userError) throw userError;
          setProfile({
            ...userOnlyData,
            therapist_details: {},
            therapist_education: [],
            therapist_experience: [],
            therapist_specialties: [],
            therapist_conditions: [],
            clinics: [],
            therapist_services: [],
            therapist_availabilities: [],
            therapist_landing_pages: [],
            therapist_branding: {},
          });
        } else {
          throw profileError;
        }
      } else {
         // Handle 1:1 relationships that might return object or array depending on PostgREST detection
         const details = Array.isArray(data.therapist_details) 
            ? (data.therapist_details[0] || {}) 
            : (data.therapist_details || {});
            
         const specialties = data.therapist_specialties?.map(ts => ({ id: ts.specialties.id, name: ts.specialties.name })) || [];
         
         const landingPage = Array.isArray(data.therapist_landing_pages)
            ? (data.therapist_landing_pages[0] || null)
            : (data.therapist_landing_pages || null);
            
         const branding = Array.isArray(data.therapist_branding)
            ? (data.therapist_branding[0] || {})
            : (data.therapist_branding || {});
         
         const flattenedProfile = {
            ...data,
            ...details,
            therapist_education: data.therapist_education || [],
            therapist_experience: data.therapist_experience || [],
            therapist_specialties: specialties,
            therapist_conditions: data.therapist_conditions || [],
            clinics: data.clinics || [],
            therapist_services: data.therapist_services || [],
            therapist_availabilities: data.therapist_availabilities || [],
            landing_page: landingPage,
            branding: branding,
            // NOTE: Explicitly mapping fields to correct sources
            avatar_url: branding.avatar_url, // Correct source: therapist_branding
            hero_image_url: landingPage?.hero_image_url, // Correct source: therapist_landing_pages
            hero_subtitle: landingPage?.hero_subtitle, // Correct source: therapist_landing_pages
         };
         
         // Remove nested objects/arrays that we've flattened or don't need in raw form
         delete flattenedProfile.therapist_details;
         delete flattenedProfile.therapist_landing_pages;
         delete flattenedProfile.therapist_branding;
         
         setProfile(flattenedProfile);
      }

    } catch (err) {
      setError(err.message);
      logger.error("❌ Error fetching therapist profile:", err);
      toast({
        variant: "destructive",
        title: "Error al cargar el perfil",
        description: "No se pudo obtener la información completa del perfil.",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const saveData = useCallback(async (saveFunction, successMessage, errorMessage, data) => {
    if (!userId) {
      toast({ variant: "destructive", title: "Error", description: "ID de usuario no encontrado." });
      return;
    }

    setIsSaving(true);
    try {
      await saveFunction(data);
      toast({ title: "¡Éxito!", description: successMessage });
      await fetchProfile();
    } catch (err) {
      setError(err.message);
      logger.error(`❌ ${errorMessage}:`, err);
      toast({ variant: "destructive", title: "Error al guardar", description: `${errorMessage}. ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  }, [userId, toast, fetchProfile]);

  const updatePersonalInfo = async (updates) => {
    const profileData = {
      full_name: updates.full_name,
      display_name: updates.display_name,
      rut: updates.rut,
      phone: updates.phone,
      is_public: updates.is_public,
      bio: updates.about_me,
      birthdate: updates.birthdate || null,
      gender: updates.gender,
      region_id: updates.region_id ? parseInt(updates.region_id) : null,
      city_id: updates.city_id ? parseInt(updates.city_id) : null,
      // NOTE: street is not in profiles schema, mapping to main_address in therapist_details instead if needed, but here we just ignore it for profiles update
    };
    const { error: profileError } = await supabase.from('profiles').update(profileData).eq('id', userId);
    if (profileError) throw profileError;

    const detailsData = {
      user_id: userId,
      professional_title: updates.professional_title,
      headline_statement: updates.headline_statement,
      about_me: updates.about_me,
      registration_supersalud: updates.registration_supersalud,
      registration_secreduc: updates.registration_secreduc,
      // rut: updates.rut, // NOTE: rut is in profiles, not therapist_details
      // phone: updates.phone, // NOTE: phone is in profiles, not therapist_details
      public_email: updates.public_email,
      main_address: updates.main_address,
      languages: Array.isArray(updates.languages) && updates.languages.length > 0 ? updates.languages : ['Español'],
      is_public: updates.is_public,
      social_instagram_url: updates.social_instagram_url,
      social_facebook_url: updates.social_facebook_url,
      social_twitter_url: updates.social_twitter_url,
      social_linkedin_url: updates.social_linkedin_url,
      university: updates.university,
      graduation_year: updates.graduation_year ? parseInt(updates.graduation_year) : null,
      years_experience: updates.years_experience ? parseInt(updates.years_experience) : null,
    };
    const { error: detailsError } = await supabase.from('therapist_details').upsert(detailsData, { onConflict: 'user_id' });
    if (detailsError) throw detailsError;
  };

  const saveSpecialtiesAndConditions = async ({ specialties, conditions }) => {
    const { error } = await supabase.from('therapist_details').update({ specialization_areas: specialties }).eq('user_id', userId);
    if (error) throw error;
  };

  const saveEducation = async (educationData) => {
    await supabase.from('therapist_education').delete().eq('therapist_id', userId);
    const dataToInsert = educationData.map(edu => ({
        therapist_id: userId,
        title: edu.title,
        institution: edu.institution,
        graduation_year: edu.year ? parseInt(edu.year) : null, // NOTE: Mapping frontend 'year' to 'graduation_year'
    }));
    const { error } = await supabase.from('therapist_education').insert(dataToInsert);
    if (error) throw error;
  };

  const saveExperience = async (experienceData) => {
    await supabase.from('therapist_experience').delete().eq('therapist_id', userId);
    const dataToInsert = experienceData.map(exp => ({
        therapist_id: userId,
        role: exp.role,
        institution: exp.institution,
        location: exp.location,
        // NOTE: Ensure start_date and end_date are handled if provided by frontend, though current usage might only send role/institution
    }));
    const { error } = await supabase.from('therapist_experience').insert(dataToInsert);
    if (error) throw error;
  };

  const saveClinics = async (clinicsData) => {
    await supabase.from('clinics').delete().eq('therapist_id', userId);
    const dataToInsert = clinicsData.map(clinic => ({
      therapist_id: userId,
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone,
      email: clinic.email,
      description: clinic.description,
    }));
    const { error } = await supabase.from('clinics').insert(dataToInsert);
    if (error) throw error;
  };

  const saveServices = async (servicesData) => {
    await supabase.from('therapist_services').delete().eq('therapist_id', userId);
    const dataToInsert = servicesData.map(service => ({
        therapist_id: userId,
        service_name: service.name,
        price_clp: service.fee ? parseFloat(service.fee) : null,
        duration_minutes: service.duration ? parseInt(service.duration.replace(' minutos', '')) : null,
        is_public: true,
    }));
    const { error } = await supabase.from('therapist_services').insert(dataToInsert);
    if (error) throw error;
  };

  const saveAvailability = async (availabilityData) => {
     await supabase.from('therapist_availabilities').delete().eq('therapist_id', userId);
     const dayMapping = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 0 };
     const dataToInsert = availabilityData.map(slot => ({
        therapist_id: userId,
        day_of_week: dayMapping[slot.day],
        start_time: slot.startTime,
        end_time: slot.endTime,
     }));
     const { error } = await supabase.from('therapist_availabilities').insert(dataToInsert);
     if (error) throw error;
  };

  const saveBranding = async (brandingData) => {
    const { error } = await supabase.from('therapist_branding').upsert({
      therapist_id: userId,
      ...brandingData,
      updated_at: new Date()
    }, { onConflict: 'therapist_id' });
    if (error) throw error;
  };

  const saveLandingPage = async (landingData) => {
     // Ensure we don't send branding fields here
     const { font_family, primary_color, secondary_color, ...cleanLandingData } = landingData;
     
     const { error } = await supabase.from('therapist_landing_pages').upsert({
      therapist_id: userId,
      ...cleanLandingData,
      updated_at: new Date()
    }, { onConflict: 'therapist_id' });
    if (error) throw error;
  };

  return {
    profile,
    loading,
    isSaving,
    error,
    refreshProfile: fetchProfile,
    updatePersonalInfo: (data) => saveData(updatePersonalInfo, "Información personal actualizada.", "Error al guardar información personal", data),
    saveSpecialtiesAndConditions: (data) => saveData(saveSpecialtiesAndConditions, "Especialidades guardadas.", "Error al guardar especialidades", data),
    saveEducation: (data) => saveData(saveEducation, "Formación académica guardada.", "Error al guardar formación", data),
    saveExperience: (data) => saveData(saveExperience, "Experiencia laboral guardada.", "Error al guardar experiencia", data),
    saveClinics: (data) => saveData(saveClinics, "Clínicas guardadas.", "Error al guardar clínicas", data),
    saveServices: (data) => saveData(saveServices, "Servicios y aranceles guardados.", "Error al guardar servicios", data),
    saveAvailability: (data) => saveData(saveAvailability, "Disponibilidad guardada.", "Error al guardar disponibilidad", data),
    saveBranding: (data) => saveData(saveBranding, "Personalización guardada.", "Error al guardar personalización", data),
    saveLandingPage: (data) => saveData(saveLandingPage, "Landing page actualizada.", "Error al guardar landing page", data),
  };
};

export default useTherapistProfile;
