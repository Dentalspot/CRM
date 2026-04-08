/**
 * @file clinicalHistory.edge.js
 * @description Client-side SDK for Clinical Records (HIPAA Compliance).
 * 
 * MODULE RESPONSIBILITY:
 * - Interface with 'clinical-history' Edge Function.
 * - Manage sensitive patient data with strict access controls.
 * - Handle encryption/decryption requests (Server-side execution).
 * 
 * SECURITY/AUDIT APPROACH:
 * - Encryption: Sensitive fields encrypted at rest (Server-side).
 * - Access Logging: EVERY read/write is logged in 'audit_log_entries'.
 * - Soft Delete: Records are never physically deleted immediately.
 * 
 * HOW TO EXTEND:
 * - Add new clinical document types or sharing protocols.
 */

import { supabase } from '@/lib/supabaseClient';

const FUNCTION_NAME = 'clinical-history';

const formatResponse = (data, error) => ({
  success: !error,
  data: data || null,
  error: error?.message || null,
  code: error?.code || (error ? 'CLINICAL_ERROR' : 'SUCCESS'),
  auditId: data?.auditId || null,
  timestamp: new Date().toISOString()
});

/**
 * Security & Compliance Checklist:
 * [x] Access Logging (Audit ID returned in response)
 * [x] Encryption (Handled transparently by server)
 * [x] Data Validation (Schema enforcement)
 * [x] HIPAA constraints (RLS & Policy checks on server)
 */

export const clinicalHistoryApi = {

  createClinicalRecord: async (recordData) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'createClinicalRecord', ...recordData }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  updateClinicalRecord: async ({ recordId, updates, reason }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'updateClinicalRecord', recordId, updates, reason }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  deleteClinicalRecord: async ({ recordId, reason }) => {
    // Soft delete logic on server
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'deleteClinicalRecord', recordId, reason }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  shareClinicalRecord: async ({ recordId, targetUserId, duration }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'shareClinicalRecord', recordId, targetUserId, duration }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  revokeClinicalRecordAccess: async ({ recordId, targetUserId }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'revokeClinicalRecordAccess', recordId, targetUserId }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  getClinicalRecordHistory: async ({ recordId }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'getClinicalRecordHistory', recordId }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  validateClinicalData: async (dataSchema) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'validateClinicalData', data: dataSchema }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  encryptClinicalData: async (rawData) => {
    // NOTE: This usually happens automatically on create/update. 
    // Exposed for specific client-side needs if necessary (e.g. preview).
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'encryptClinicalData', data: rawData }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  decryptClinicalData: async (encryptedDataId) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'decryptClinicalData', id: encryptedDataId }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  generateClinicalReport: async ({ patientId, dateRange, filters }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'generateClinicalReport', patientId, dateRange, filters }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  auditClinicalAccess: async ({ recordId, accessType }) => {
    // Manually trigger an audit log for read events if needed
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'auditClinicalAccess', recordId, accessType }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  getClinicalAuditLog: async ({ recordId, page = 1 }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'getClinicalAuditLog', recordId, page }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  }
};