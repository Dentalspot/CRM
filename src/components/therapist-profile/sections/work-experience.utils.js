// src/components/therapist-profile/sections/work-experience.utils.js
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

/**
 * Convierte datos de la BD a formato del componente
 */
export const fromDbRow = (data) => {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return [{
      id: null,
      role: '',
      institution: '',
      start_date: '',
      end_date: '',
      location: '',
      description: '',
      is_public: false
    }];
  }

  if (Array.isArray(data)) {
    return data.map(exp => ({
      id: exp.id,
      role: exp.role || '',
      institution: exp.institution || '',
      start_date: exp.start_date || '',
      end_date: exp.end_date || '',
      location: exp.location || '',
      description: exp.description || '',
      is_public: exp.is_public || false
    }));
  }

  return [{
    id: data.id,
    role: data.role || '',
    institution: data.institution || '',
    start_date: data.start_date || '',
    end_date: data.end_date || '',
    location: data.location || '',
    description: data.description || '',
    is_public: data.is_public || false
  }];
};

/**
 * Obtiene todas las experiencias laborales de un terapeuta
 */
export const fetchWorkExperiences = async (therapistId) => {
  if (!therapistId) {
    throw new Error('Se requiere ID de terapeuta');
  }

  const { data, error } = await supabase
    .from('therapist_experience')
    .select('*')
    .eq('therapist_id', therapistId)
    .order('start_date', { ascending: false });

  if (error) {
    logger.error('Error fetching work experiences:', error);
    throw new Error(`Error al cargar experiencias: ${error.message}`);
  }

  return data || [];
};

/**
 * Guarda o actualiza múltiples experiencias laborales
 */
export const saveWorkExperiences = async (experiences, therapistId) => {
  if (!therapistId) {
    throw new Error('Se requiere ID de terapeuta');
  }

  // Filtrar experiencias vacías
  const validExperiences = experiences.filter(exp =>
    exp.role?.trim() && exp.institution?.trim()
  );

  if (validExperiences.length === 0) {
    // Si no hay experiencias válidas, eliminar todas las existentes
    const { error } = await supabase
      .from('therapist_experience')
      .delete()
      .eq('therapist_id', therapistId);

    if (error) {
      throw new Error(`Error al eliminar experiencias: ${error.message}`);
    }

    return { success: true };
  }

  // Separar experiencias nuevas y existentes
  const newExperiences = validExperiences.filter(exp => !exp.id);
  const existingExperiences = validExperiences.filter(exp => exp.id);

  // Insertar nuevas experiencias
  if (newExperiences.length > 0) {
    const insertData = newExperiences.map(exp => ({
      therapist_id: therapistId,
      role: exp.role,
      institution: exp.institution,
      start_date: exp.start_date || null,
      end_date: exp.end_date || null,
      location: exp.location || null,
      description: exp.description || null,
      is_public: exp.is_public || false
    }));

    const { error: insertError } = await supabase
      .from('therapist_experience')
      .insert(insertData);

    if (insertError) {
      logger.error('Error al insertar experiencias:', insertError);
      throw new Error(`Error al insertar experiencias: ${insertError.message}`);
    }
  }

  // Actualizar experiencias existentes
  for (const exp of existingExperiences) {
    const { error: updateError } = await supabase
      .from('therapist_experience')
      .update({
        role: exp.role,
        institution: exp.institution,
        start_date: exp.start_date || null,
        end_date: exp.end_date || null,
        location: exp.location || null,
        description: exp.description || null,
        is_public: exp.is_public || false,
        updated_at: new Date().toISOString()
      })
      .eq('id', exp.id)
      .eq('therapist_id', therapistId);

    if (updateError) {
      logger.error('Error al actualizar experiencia:', updateError);
      throw new Error(`Error al actualizar experiencia: ${updateError.message}`);
    }
  }

  return { success: true };
};

/**
 * Elimina una experiencia laboral específica
 */
export const deleteWorkExperience = async (experienceId) => {
  if (!experienceId) {
    throw new Error('Se requiere ID de experiencia');
  }

  const { error } = await supabase
    .from('therapist_experience')
    .delete()
    .eq('id', experienceId);

  if (error) {
    logger.error('Error al eliminar experiencia:', error);
    throw new Error(`Error al eliminar experiencia: ${error.message}`);
  }

  return { success: true };
};