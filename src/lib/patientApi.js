import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';
import { apiHandler } from '@/lib/api/apiHandler';

/**
 * Fetch patient profile with related data
 * FIXED: Removed avatar_url from profiles select (doesn't exist in table)
 * Avatar comes from therapist_branding via JOIN
 */
export const fetchPatientProfile = apiHandler.mutation('fetchPatientProfile', async (patientId) => {
  const { data, error } = await supabase
    .from('patients')
    .select(`*, profile:profiles (id, full_name, email, phone, birthdate, rut, gender, region_id, city_id)`)
    .eq('id', patientId)
    .single();

  if (error) throw error;
  return data;
});

/**
 * Fetch patient private notes
 */
export const fetchPatientPrivateNotes = apiHandler('fetchPatientPrivateNotes', async (patientId, therapistId) => {
  const { data, error } = await supabase
    .from('patient_private_notes')
    .select('content')
    .eq('patient_id', patientId)
    .eq('therapist_id', therapistId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.content || '';
}, '');

/**
 * Save patient private notes
 */
export const savePrivateNotes = apiHandler.mutation('savePrivateNotes', async (patientId, therapistId, content) => {
  // Heredar organization_id del paciente
  const { data: pat } = await supabase
    .from('patients').select('organization_id').eq('id', patientId).maybeSingle();

  const { data, error } = await supabase
    .from('patient_private_notes')
    .upsert({
      patient_id: patientId,
      therapist_id: therapistId,
      organization_id: pat?.organization_id || null,
      content: content,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'patient_id,therapist_id'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
});

/**
 * Fetch patient with all related data for clinical file
 * FIXED: Removed avatar_url from profiles, uses therapist_branding instead
 * FIXED: Removed invalid join therapist:profiles!therapist_id. Fetching manually.
 */
/**
 * Fetch patient with profile + therapist.
 * profile via FK, therapist via separate fast query (no FK defined).
 */
export const fetchPatientWithDetails = apiHandler.mutation('fetchPatientWithDetails', async (patientId) => {
  const { data, error } = await supabase
    .from('patients')
    .select(`*, profile:profiles!patients_profile_id_fkey (id, full_name, email, phone, birthdate, rut, gender, region_id, city_id)`)
    .eq('id', patientId)
    .single();

  if (error) throw error;

  if (data?.therapist_id) {
    const { data: therapist } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', data.therapist_id)
      .single();
    data.therapist = therapist || null;
  } else {
    data.therapist = null;
  }

  return data;
});

/**
 * Fetch patient diagnoses
 */
export const fetchPatientDiagnoses = apiHandler('fetchPatientDiagnoses', async (patientId) => {
  const { data, error } = await supabase
    .from('patient_diagnoses')
    .select(`*, code:diagnosis_codes (code, name)`)
    .eq('patient_id', patientId)
    .eq('is_active', true);

  if (error) throw error;
  return data || [];
}, []);

/**
 * Fetch patient goals
 * FIXED: Added explicit foreign key for patient_development_areas embedding
 */
export const fetchPatientGoals = apiHandler('fetchPatientGoals', async (patientId) => {
  const { data, error } = await supabase
    .from('patient_goals')
    .select(`*, area:patient_development_areas!patient_goals_area_id_fkey (name, description)`)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}, []);

/**
 * Fetch patient assigned plans
 */
export const fetchPatientAssignedPlans = apiHandler('fetchPatientAssignedPlans', async (patientId) => {
  const { data, error } = await supabase
    .from('patient_assigned_plans')
    .select(`*, plan:treatment_plans (id, name, description, duration_weeks, number_of_sessions)`)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}, []);

/**
 * Fetch clinical history for patient
 */
export const fetchClinicalHistory = apiHandler('fetchClinicalHistory', async (patientId, limit = 50) => {
  const { data, error } = await supabase
    .from('clinical_history')
    .select(`*, therapist:profiles (id, full_name)`)
    .eq('patient_id', patientId)
    .order('entry_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}, []);

/**
 * Fetch patient evaluations
 * FIXED: Added explicit foreign key for profiles embedding (therapist)
 */
export const fetchPatientEvaluations = apiHandler('fetchPatientEvaluations', async (patientId) => {
  const { data, error } = await supabase
    .from('patient_evaluations')
    .select(`*, therapist:profiles!patient_evaluations_therapist_id_fkey (id, full_name)`)
    .eq('patient_id', patientId)
    .order('evaluation_date', { ascending: false });

  if (error) throw error;
  return data || [];
}, []);

/**
 * Fetch patient activity logs
 * FIXED: Added explicit foreign key for profiles embedding (therapist)
 */
export const fetchPatientActivityLogs = apiHandler('fetchPatientActivityLogs', async (patientId, limit = 100) => {
  const { data, error } = await supabase
    .from('patient_activity_logs')
    .select(`*, activity:patient_activities (name, description), therapist:profiles!patient_activity_logs_therapist_id_fkey (id, full_name)`)
    .eq('patient_id', patientId)
    .order('log_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}, []);

/**
 * Create or update patient evaluation
 */
export const savePatientEvaluation = apiHandler.mutation('savePatientEvaluation', async (patientId, therapistId, evaluationData) => {
  const { data, error } = await supabase
    .from('patient_evaluations')
    .insert({
      patient_id: patientId,
      therapist_id: therapistId,
      evaluation_date: new Date().toISOString(),
      ...evaluationData
    })
    .select()
    .single();

  if (error) throw error;
  return data;
});

/**
 * Add activity log entry
 */
export const addActivityLog = apiHandler.mutation('addActivityLog', async (patientId, therapistId, activityData) => {
  const { data, error } = await supabase
    .from('patient_activity_logs')
    .insert({
      patient_id: patientId,
      therapist_id: therapistId,
      log_date: new Date().toISOString(),
      ...activityData
    })
    .select()
    .single();

  if (error) throw error;
  return data;
});

/**
 * Fetch patient documents
 */
export const fetchPatientDocuments = apiHandler('fetchPatientDocuments', async (patientId) => {
  const { data, error } = await supabase
    .from('patient_documents')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}, []);

/**
 * Fetch therapist profile with branding
 * FIXED: Removed avatar_url from profiles, uses therapist_branding instead
 */
export const fetchTherapistProfile = async (therapistId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        therapist_details!therapist_details_user_id_fkey (
          *
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
      .single();

    if (error) throw error;

    // Flatten branding data
    const branding = Array.isArray(data.therapist_branding)
      ? data.therapist_branding[0]
      : data.therapist_branding;

    return {
      ...data,
      avatar_url: branding?.avatar_url || null,
      branding: branding || {}
    };
  } catch (error) {
    logger.error('Error fetching therapist profile:', error);
    throw error;
  }
};

// ============================================================================
// NEW EXPORTS REQUIRED FOR PATIENT MANAGEMENT
// ============================================================================

export const searchPatientsForAgenda = async (therapistId, searchTerm) => {
  const { data, error } = await supabase.rpc('search_patients_quick', {
    p_therapist_id: therapistId,
    p_search_term: searchTerm
  });
  if (error) throw error;
  return data;
};

export const createAndAssociatePatient = async (therapistId, patientData) => {
  const { data, error } = await supabase.functions.invoke('create-patient', {
    body: { therapistId, ...patientData }
  });
  
  if (error) throw error;
  return data;
};

export const generateTempPasswordFromPhone = (phone) => {
  if (!phone || phone.length < 6) return '123456';
  return phone.slice(-6);
};

export const validatePhoneForPassword = (phone) => {
  return phone && phone.length >= 6;
};

export const uploadPatientDocument = async (patientId, therapistId, file, description) => {
  // Heredar organization_id del paciente
  const { data: pat } = await supabase
    .from('patients').select('organization_id').eq('id', patientId).maybeSingle();

  const fileName = `${Date.now()}_${file.name}`;
  const filePath = `${patientId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('patient-documents')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data, error: dbError } = await supabase
    .from('patient_documents')
    .insert({
      patient_id: patientId,
      therapist_id: therapistId,
      organization_id: pat?.organization_id || null,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      description
    })
    .select()
    .single();
    
  if (dbError) throw dbError;
  return data;
};

export const getPatientDocuments = async (patientId) => {
  return fetchPatientDocuments(patientId);
};

export const deletePatientDocument = async (documentId, filePath) => {
  const { error: storageError } = await supabase.storage
    .from('patient-documents')
    .remove([filePath]);
    
  if (storageError) logger.error('Storage delete error:', storageError);
  
  const { error: dbError } = await supabase
    .from('patient_documents')
    .delete()
    .eq('id', documentId);
    
  if (dbError) throw dbError;
};

export const downloadPatientDocument = async (filePath) => {
  const { data, error } = await supabase.storage
    .from('patient-documents')
    .createSignedUrl(filePath, 3600);
    
  if (error) throw error;
  return data.signedUrl;
};

export const getTherapistPatients = async (therapistId, searchTerm) => {
  // RLS filtra automáticamente por care_team + org membership.
  // No se filtra por therapist_id en el frontend — la seguridad la da RLS.
  let query = supabase
    .from('patients')
    .select(`
      *,
      profile:profiles (id, full_name, email, phone, rut, birthdate)
    `)
    .eq('status', 'active');

  if (searchTerm) {
    // RPC legacy: sigue usando therapist_id internamente.
    // Se mantendrá hasta que el RPC se adapte al modelo nuevo.
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_therapist_patients_with_details', {
      p_therapist_id: therapistId,
      p_search_term: searchTerm || null
    });
    if (rpcError) throw rpcError;
    return rpcData;
  }

  const { data, error } = await query;
  if (error) throw error;

  return data.map(p => ({
    ...p,
    full_name: p.profile?.full_name,
    email: p.profile?.email,
    phone: p.profile?.phone,
    rut: p.profile?.rut,
    birthdate: p.profile?.birthdate
  }));
};

/**
 * Get therapist stats in a single DB roundtrip.
 * Uses RPC get_therapist_stats instead of 3 separate count queries.
 */
export const getTherapistStats = apiHandler('getTherapistStats', async (therapistId) => {
  const { data, error } = await supabase.rpc('get_therapist_stats', {
    p_therapist_id: therapistId
  });

  if (error) throw error;
  return data;
}, { totalPatients: 0, scheduledAppointments: 0, totalDocuments: 0 });

export const updatePatient = async (patientId, updates) => {
  const { data, error } = await supabase
    .from('patients')
    .update(updates)
    .eq('id', patientId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const archivePatient = async (patientId) => {
  return updatePatient(patientId, { status: 'archived', is_blacklisted: true });
};

export const associatePatient = async (therapistId, email) => {
  const { data, error } = await supabase.rpc('link_patient_by_email', {
    p_therapist_id: therapistId,
    p_patient_email: email
  });
  
  if (error) throw error;
  if (!data.success) throw new Error(data.message);
  return data;
};

/**
 * Get complete patient file in a single DB roundtrip.
 * Uses RPC get_patient_file_complete instead of 8 separate queries.
 */
export const getPatientFile = apiHandler('getPatientFile', async (patientId) => {
  const { data, error } = await supabase.rpc('get_patient_file_complete', {
    p_patient_id: patientId
  });

  if (error) throw error;
  return data;
}, null);

export const getDocumentTemplates = async (therapistId) => {
  const { data, error } = await supabase
    .from('patient_document_templates')
    .select('*')
    .or(`therapist_id.eq.${therapistId},is_global.eq.true`);
    
  if (error) throw error;
  return data || [];
};