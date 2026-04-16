import { supabase } from '@/lib/supabaseClient';

/**
 * Campos administrativos que el assistant puede editar.
 * Cualquier campo fuera de esta lista se ignora.
 */
const ALLOWED_UPDATE_FIELDS = [
  'full_name', 'rut', 'phone', 'email', 'address',
  'patient_type', 'emergency_contact_name', 'emergency_contact_phone',
];

/**
 * Crea un paciente administrativamente (sin therapist_id, sin care_team, sin clinical_record).
 * Solo datos de contacto + organization_id.
 */
export const createPatientAsAssistant = async ({ organizationId, fullName, rut, phone, email, patientType }) => {
  if (!organizationId) {
    throw new Error('Se requiere organización para crear un paciente.');
  }
  if (!fullName?.trim()) {
    throw new Error('El nombre del paciente es obligatorio.');
  }

  // Verificar duplicado por RUT dentro de la org
  if (rut?.trim()) {
    const { data: existing } = await supabase
      .from('patients')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('rut', rut.trim())
      .maybeSingle();

    if (existing) {
      throw new Error('Ya existe un paciente con ese RUT en esta organización.');
    }
  }

  const { data, error } = await supabase
    .from('patients')
    .insert({
      organization_id: organizationId,
      full_name: fullName.trim(),
      rut: rut?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim().toLowerCase() || null,
      patient_type: patientType || 'privado',
      status: 'active',
    })
    .select('id, full_name')
    .single();

  if (error) throw error;
  return data;
};

/**
 * Actualiza solo campos administrativos de un paciente.
 * Aplica allowlist estricta: campos fuera de la lista se ignoran.
 */
export const updatePatientAdmin = async (patientId, updates) => {
  if (!patientId) throw new Error('ID de paciente requerido.');

  const sanitized = { updated_at: new Date().toISOString() };
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (key in updates) {
      sanitized[key] = updates[key];
    }
  }

  // Si no hay campos válidos (solo updated_at), no hacer nada
  if (Object.keys(sanitized).length <= 1) {
    throw new Error('No hay campos válidos para actualizar.');
  }

  const { data, error } = await supabase
    .from('patients')
    .update(sanitized)
    .eq('id', patientId)
    .select('id, full_name')
    .single();

  if (error) throw error;
  return data;
};
