import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';

/**
 * Create a referral (derivación) as PENDING via RPC.
 * The RPC handles: clinical_history insert + notification creation (SECURITY DEFINER).
 */
export const createReferral = async ({
  patientId,
  therapistId,
  referralType,
  referralReason,
  selectedProfessional,
  sourceEntryId,
  sourceAppointmentId,
}) => {
  const professionalName = selectedProfessional?.full_name || null;

  const { data, error } = await supabase.rpc('create_referral', {
    p_patient_id: patientId,
    p_therapist_id: therapistId,
    p_referral_type: referralType,
    p_referral_reason: referralReason,
    p_referred_professional_id: selectedProfessional?.therapist_id || null,
    p_referred_professional_name: professionalName,
    p_source_entry_id: sourceEntryId || null,
    p_source_appointment_id: sourceAppointmentId || null,
  });

  if (error) {
    logger.error('Error creating referral:', error);
    throw error;
  }

  logger.info('Referral created successfully, entry id:', data);
  return { id: data };
};

/**
 * Accept a pending referral — associates patient with new therapist + clones clinical file.
 */
export const acceptReferral = async (referralEntryId, patientProfileId) => {
  const { data, error } = await supabase.rpc('accept_referral', {
    p_referral_id: referralEntryId,
    p_patient_profile_id: patientProfileId,
  });

  if (error) {
    logger.error('Error accepting referral:', error);
    throw error;
  }
  return data;
};

/**
 * Reject a pending referral.
 */
export const rejectReferral = async (referralEntryId, patientProfileId) => {
  const { data, error } = await supabase.rpc('reject_referral', {
    p_referral_id: referralEntryId,
    p_patient_profile_id: patientProfileId,
  });

  if (error) {
    logger.error('Error rejecting referral:', error);
    throw error;
  }
  return data;
};
