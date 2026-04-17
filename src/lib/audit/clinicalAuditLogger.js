import { supabase } from '@/lib/supabaseClient';

export async function logClinicalAccess(payload) {
  try {
    const { error } = await supabase
      .from('clinical_audit_log')
      .insert(payload);

    if (error) {
      if (import.meta.env.DEV) {
        console.warn('[clinicalAuditLogger] insert failed', {
          code: error.code,
          message: error.message,
          action: payload?.action,
          resource_type: payload?.resource_type,
        });
      }
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[clinicalAuditLogger] insert threw', { message: err?.message });
    }
    return { ok: false };
  }
}
