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
 * Genera contraseña aleatoria segura de 12 caracteres.
 * Excluye caracteres ambiguos (0/O, 1/l/I) para evitar confusión al copiar/dictar.
 *
 * Reemplaza el patrón legacy de "primeros 6 dígitos del RUT" (P0 seguridad
 * Ley 21.719 art. 2g — datos sensibles requieren protección reforzada).
 * Se entrega al paciente vía email transaccional `send-patient-welcome`.
 *
 * @returns {string} password de 12 chars alfanuméricos sin ambiguos.
 */
export const generateSecurePassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const len = 12;
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  let out = '';
  for (let i = 0; i < len; i++) {
    out += alphabet[arr[i] % alphabet.length];
  }
  return out;
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
 * Fix C: si no se proveyó organization_id, derivarlo desde la primera
 * clínica activa del dentista (vía clinic_therapists).
 *
 * Sin organization_id, los pacientes son invisibles para el equipo de la clínica.
 *
 * @param {string} therapistId
 * @param {string|null} providedOrgId
 * @returns {Promise<string|null>}
 */
const resolveOrganizationId = async (therapistId, providedOrgId) => {
  if (providedOrgId) return providedOrgId;
  try {
    const { data, error } = await supabase
      .from('clinic_therapists')
      .select('clinics:clinic_id(organization_id)')
      .eq('therapist_id', therapistId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    if (error) {
      logger.warn('[patientAccountService] resolveOrganizationId error:', error.message);
      return null;
    }
    return data?.clinics?.organization_id || null;
  } catch (err) {
    logger.warn('[patientAccountService] resolveOrganizationId exception:', err?.message);
    return null;
  }
};

// B12 cleanup (2026-05-13): la helper `ensurePrimaryCareTeam` fue removida.
// El trigger DB `trg_sync_patient_care_team_insert` ya crea automáticamente
// el row en patient_care_team al insertar un paciente (con bypass de RLS via
// SECURITY DEFINER). La implementación JS era redundante y generaba un error
// rojo cosmético en consola cuando la policy RLS del dentista no permitía
// insertar (fix de policy en migration 20260513000001 dejó la JS aún más
// innecesaria). Verificación: 0/25 pacientes activos en prod sin care_team.
// Si en el futuro hace falta agregar dentistas adicionales como tratantes,
// crear un service nuevo específico — NO resucitar el helper en este flow.

/**
 * Crea SOLO el row en `patients` (sin auth user) cuando el dentista no
 * tiene email/RUT del paciente todavía. El paciente queda "sin cuenta"
 * y el dentista puede invitarlo después para que cree su cuenta.
 *
 * @param {Object} params
 * @param {string} params.therapistId
 * @param {string} params.organizationId
 * @param {string} params.fullName - obligatorio
 * @param {string} params.phone - obligatorio
 * @param {string|null} params.email - opcional
 * @param {string|null} params.rut - opcional
 */
export const createPatientWithoutAccount = async ({
  therapistId,
  organizationId,
  fullName,
  phone,
  email,
  rut,
  clinicId = null,
  attentionType = null,
}) => {
  try {
    if (!therapistId) throw new Error('ID de terapeuta es requerido');
    if (!fullName?.trim()) throw new Error('Nombre del paciente es requerido');
    if (!phone?.trim()) throw new Error('Teléfono del paciente es requerido');

    // Derivar org_id si no se proveyó
    organizationId = await resolveOrganizationId(therapistId, organizationId);

    // Guardamos los datos de contacto directamente en `patients` (columnas
    // denormalizadas full_name/email/phone/rut). NO creamos stub en `profiles`
    // porque su RLS exige id = auth.uid(). Cuando el paciente acepte la
    // invitación y registre cuenta, profile_id se vincula y el frontend hace
    // fallback al profile real.
    // B6 fix: persistir clinic_id y attention_type cuando el caller los proveyó.
    // Antes el caller (PatientModal) los recogía en el form pero el service los
    // silenciaba al destructure. attention_type tiene DB default 'consulta_privada'
    // — solo lo overrideamos si vino explícito para no romper ese default.
    const { data: newPatient, error: patientError } = await supabase
      .from('patients')
      .insert({
        profile_id: null,
        therapist_id: therapistId,
        organization_id: organizationId || null,
        clinic_id: clinicId || null,
        ...(attentionType ? { attention_type: attentionType } : {}),
        status: 'active',
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        rut: rut?.trim() || null,
      })
      .select()
      .single();

    if (patientError) throw patientError;

    // patient_care_team row la crea el trigger DB trg_sync_patient_care_team_insert.

    return {
      success: true,
      isNew: true,
      hasAccount: false,
      patientId: newPatient.id,
      profileId: null,
      fullName: fullName.trim(),
      message: `Paciente "${fullName}" creado sin cuenta. Puedes invitarlo después.`,
    };
  } catch (err) {
    logger.error('[createPatientWithoutAccount] error:', err);
    return {
      success: false,
      error: err,
      message: err?.message || 'No se pudo crear el paciente.',
    };
  }
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
export const createPatientAccount = async ({ therapistId, organizationId, email, fullName, rut, phone, clinicId = null, attentionType = null }) => {
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

    // Fix C: derivar organization_id si no se proveyó (ej: dentista sin org seleccionada)
    organizationId = await resolveOrganizationId(therapistId, organizationId);

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
        // Ya existe como paciente de este terapeuta — el trigger DB ya creó
        // su patient_care_team en su momento. No requiere acción adicional.
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
      // B6 fix: persistir clinic_id / attention_type cuando el caller los proveyó.
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({
          profile_id: existingProfile.id,
          therapist_id: therapistId,
          organization_id: organizationId || null,
          clinic_id: clinicId || null,
          ...(attentionType ? { attention_type: attentionType } : {}),
          status: 'active'
        })
        .select()
        .single();

      if (patientError) throw patientError;

      // patient_care_team row la crea el trigger DB trg_sync_patient_care_team_insert.

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

    // Password aleatoria segura. Se entrega al paciente por email
    // (send-patient-welcome) post signUp. NO mas password=RUT (P0 Ley 21.719).
    const tempPassword = generateSecurePassword();
    const cleanRut = rut ? rut.replace(/[.\-\s]/g, '') : null;

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
      // B6 fix: persistir clinic_id / attention_type cuando el caller los proveyó.
      const { data, error } = await supabase
        .from('patients')
        .insert({
          profile_id: patientUserId,
          therapist_id: therapistId,
          organization_id: organizationId || null,
          clinic_id: clinicId || null,
          ...(attentionType ? { attention_type: attentionType } : {}),
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

    // B8 fix: si el INSERT a patients falló después de los retries, NO podemos
    // retornar success=true. Antes el bug era:
    //   1) auth.users y profiles quedaban creados (huérfanos)
    //   2) welcome email se enviaba igual → paciente recibía credenciales válidas
    //      pero al loguear no aparecía vinculado al dentista
    //   3) la función retornaba success=true con patientId=undefined (UI lie)
    // Ahora: log con todo para forensics manual y throw → el caller ve error real.
    // El auth.users huérfano queda en DB (requiere edge function admin con service
    // role para borrarlo — pendiente como followup separado).
    if (patientError || !newPatient?.id) {
      logger.error('[createPatientAccount] patient INSERT failed after retries — orphan auth user created:', {
        patientUserId,
        therapistId,
        organizationId,
        email: email.toLowerCase().trim(),
        patientError: patientError?.message || 'no patient row returned',
      });
      throw new Error(
        patientError?.message ||
        'No se pudo crear el registro del paciente. El usuario quedó parcialmente creado en autenticación — contacta a soporte para limpieza.'
      );
    }

    // patient_care_team row la crea el trigger DB trg_sync_patient_care_team_insert.

    // =========================================
    // 6. ENVIAR EMAIL DE BIENVENIDA CON PASSWORD
    // =========================================
    // Best-effort: si falla el email, NO abortamos el signup (la cuenta ya
    // está creada). Logueamos warning y exponemos en el response para que
    // el dentista pueda informar al paciente manualmente.
    let welcomeEmailSent = true;
    try {
      // Resolver nombre del dentista para el email
      let dentistName = '';
      try {
        const { data: dentistProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', therapistId)
          .maybeSingle();
        dentistName = dentistProfile?.full_name || '';
      } catch (_) { /* non-fatal */ }

      const { error: emailErr } = await supabase.functions.invoke('send-patient-welcome', {
        body: {
          email: email.toLowerCase().trim(),
          full_name: fullName.trim(),
          temp_password: tempPassword,
          dentist_name: dentistName,
        },
      });
      if (emailErr) {
        logger.warn('[createPatientAccount] welcome email failed (non-blocking):', emailErr?.message || emailErr);
        welcomeEmailSent = false;
      }
    } catch (err) {
      logger.warn('[createPatientAccount] welcome email exception (non-blocking):', err?.message || err);
      welcomeEmailSent = false;
    }

    // =========================================
    // 7. RETORNO EXITOSO
    // =========================================

    return {
      success: true,
      isNew: true,
      patientId: newPatient?.id,
      profileId: authData.user.id,
      email: email.toLowerCase().trim(),
      fullName: fullName.trim(),
      welcomeEmailSent,
      // Fallback: si el email falla, el dentista NECESITA poder ver/copiar
      // la password para dársela al paciente manualmente. NO se loguea ni
      // se persiste en DB — solo se devuelve en este response.
      tempPasswordForManualDelivery: welcomeEmailSent ? null : tempPassword,
      message: welcomeEmailSent
        ? `Cuenta creada para ${fullName}. Le enviamos un email con su contraseña temporal.`
        : `Cuenta creada para ${fullName}, pero el email de bienvenida falló. Por favor entrégale manualmente: contraseña ${tempPassword}`,
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
  generateSecurePassword,
};