// src/lib/services/patientAccountService.js

import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js';

// Isolated client for patient signup — does NOT share session with main client
const supabaseIsolated = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
);

/**
 * Genera contraseña temporal: primeros 6 dígitos del RUT
 * @param {string} rut - RUT con o sin formato
 * @returns {string|null}
 */
export const generateTempPassword = (rut) => {
  if (!rut) return null;
  const cleanRut = rut.replace(/[.\-\s]/g, '');
  return cleanRut.substring(0, 6);
};

/**
 * Valida que el RUT tenga al menos 6 dígitos
 * @param {string} rut 
 * @returns {boolean}
 */
export const validateRutForPassword = (rut) => {
  if (!rut) return false;
  const cleanRut = rut.replace(/[.\-\s]/g, '');
  return cleanRut.length >= 6 && /^\d{6}/.test(cleanRut);
};

/**
 * Valida formato de email
 * @param {string} email 
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Crea cuenta de paciente automáticamente al agendar cita
 * 
 * @param {Object} params
 * @param {string} params.therapistId - UUID del terapeuta
 * @param {string} params.email - Email del paciente
 * @param {string} params.fullName - Nombre completo
 * @param {string} params.rut - RUT del paciente (obligatorio para nuevos)
 * @param {string} params.phone - Teléfono (opcional)
 * @returns {Promise<Object>}
 */
export const createPatientAccount = async ({ therapistId, email, fullName, rut, phone }) => {
  try {
    // =========================================
    // 1. VALIDACIONES
    // =========================================

    if (!therapistId) {
      throw new Error("ID de terapeuta es requerido");
    }

    if (!email || !isValidEmail(email)) {
      throw new Error("Email inválido");
    }

    if (!fullName?.trim()) {
      throw new Error("Nombre del paciente es requerido");
    }

    // =========================================
    // 2. VERIFICAR SI YA EXISTE EL USUARIO
    // =========================================

    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', email.toLowerCase().trim());

    // Si existe el perfil, verificar si ya es paciente del terapeuta
    if (existingProfiles && existingProfiles.length > 0) {
      const existingProfile = existingProfiles[0];

      // Verificar si ya está vinculado como paciente
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('profile_id', existingProfile.id)
        .eq('therapist_id', therapistId)
        .maybeSingle();

      if (existingPatient) {
        // Ya existe como paciente de este terapeuta
        return {
          success: true,
          isNew: false,
          alreadyLinked: true,
          patientId: existingPatient.id,
          profileId: existingProfile.id,
          message: "El paciente ya está registrado"
        };
      }

      // Existe usuario pero no es paciente de este terapeuta - vincularlo
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({
          profile_id: existingProfile.id,
          therapist_id: therapistId,
          status: 'active'
        })
        .select()
        .single();

      if (patientError) throw patientError;

      return {
        success: true,
        isNew: false,
        patientId: newPatient.id,
        profileId: existingProfile.id,
        message: "Paciente vinculado correctamente"
      };
    }

    // =========================================
    // 3. CREAR NUEVO USUARIO (No existe)
    // =========================================

    // Validar RUT para generar contraseña
    if (!rut || !validateRutForPassword(rut)) {
      throw new Error("RUT inválido. Debe tener al menos 6 dígitos para generar la contraseña temporal");
    }

    const tempPassword = generateTempPassword(rut);
    const cleanRut = rut.replace(/[.\-\s]/g, '');

    // Use isolated client so therapist session is NOT affected
    const { data: authData, error: authError } = await supabaseIsolated.auth.signUp({
      email: email.toLowerCase().trim(),
      password: tempPassword,
      options: {
        data: {
          full_name: fullName.trim(),
          role: 'patient',
          rut: cleanRut
        },
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (authError) {
      // Usuario ya existe en Auth pero no en profiles (caso raro)
      if (authError.message?.includes('already registered')) {
        throw new Error("Este email ya está registrado. El paciente debe iniciar sesión con su cuenta existente.");
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error("No se pudo crear la cuenta");
    }

    // =========================================
    // 4. ESPERAR A QUE EL PERFIL EXISTA (retry con backoff)
    // =========================================

    const patientUserId = authData.user.id;
    let profileExists = false;

    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      const { data: profileCheck } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', patientUserId)
        .maybeSingle();

      if (profileCheck) {
        profileExists = true;
        break;
      }
    }

    if (!profileExists) {
      logger.warn('Profile not created by trigger after 7.5s, inserting manually');
      await supabase.from('profiles').insert({
        id: patientUserId,
        email: email.toLowerCase().trim(),
        full_name: fullName.trim(),
        phone: phone || null,
        rut: cleanRut,
        role: 'patient',
      });
    }

    // Actualizar perfil con datos adicionales
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone: phone || null,
        rut: cleanRut,
        role: 'patient',
        updated_at: new Date().toISOString()
      })
      .eq('id', patientUserId);

    if (profileError) {
      logger.warn('Error updating profile (non-fatal):', profileError);
    }

    // =========================================
    // 5. CREAR REGISTRO DE PACIENTE (con retry)
    // =========================================

    let newPatient = null;
    let patientError = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase
        .from('patients')
        .insert({
          profile_id: patientUserId,
          therapist_id: therapistId,
          status: 'active'
        })
        .select()
        .single();

      if (!error) {
        newPatient = data;
        break;
      }

      patientError = error;
      // If duplicate, find existing
      if (error.code === '23505') {
        const { data: existing } = await supabase
          .from('patients')
          .select('id')
          .eq('profile_id', patientUserId)
          .eq('therapist_id', therapistId)
          .maybeSingle();
        if (existing) {
          newPatient = existing;
          patientError = null;
          break;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (patientError) {
      logger.error('Error creating patient record after retries:', patientError);
    }

    // =========================================
    // 6. RETORNO EXITOSO
    // =========================================

    return {
      success: true,
      isNew: true,
      patientId: newPatient?.id,
      profileId: authData.user.id,
      email: email.toLowerCase().trim(),
      fullName: fullName.trim(),
      tempPasswordHint: 'Primeros 6 dígitos del RUT',
      message: `Cuenta creada para ${fullName}. Se enviará un email de confirmación.`
    };

  } catch (error) {
    logger.error("Error en createPatientAccount:", error);
    return {
      success: false,
      error: error,
      message: error.message || "Error al crear la cuenta del paciente"
    };
  }
};

/**
 * Función simplificada para usar al agendar cita
 * Retorna el patient_id necesario para crear la cita
 */
export const getOrCreatePatientForAppointment = async ({
  therapistId,
  email,
  fullName,
  rut,
  phone
}) => {
  // Primero buscar si ya existe
  const { data: existingPatient } = await supabase
    .from('patients')
    .select(`
      id,
      profile_id,
      profiles!inner(email, full_name)
    `)
    .eq('therapist_id', therapistId)
    .eq('profiles.email', email.toLowerCase().trim())
    .maybeSingle();

  if (existingPatient) {
    return {
      success: true,
      isNew: false,
      patientId: existingPatient.id,
      profileId: existingPatient.profile_id
    };
  }

  // No existe, crear cuenta nueva
  return await createPatientAccount({
    therapistId,
    email,
    fullName,
    rut,
    phone
  });
};

export default {
  createPatientAccount,
  getOrCreatePatientForAppointment,
  generateTempPassword,
  validateRutForPassword
};