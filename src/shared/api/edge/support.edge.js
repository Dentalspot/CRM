/**
 * @file support.edge.js
 * @description Client-side SDK for Support Ticketing System.
 * 
 * MODULE RESPONSIBILITY:
 * - Interface with 'support' Edge Function.
 * - Manage ticket lifecycle (create, update, resolve).
 * - Handle user diagnostic data securely.
 * 
 * SECURITY/AUDIT APPROACH:
 * - Role Checks: Support agents vs Users.
 * - Validation: Content filtering for tickets.
 * - Audit: Status changes and assignments logged.
 * 
 * HOW TO EXTEND:
 * - Add chatbot integration or automated diagnostic tools.
 */

import { supabase } from '@/lib/supabaseClient';

const FUNCTION_NAME = 'support';

const formatResponse = (data, error) => ({
  success: !error,
  data: data || null,
  error: error?.message || null,
  code: error?.code || (error ? 'SUPPORT_ERROR' : 'SUCCESS'),
  auditId: data?.auditId || null,
  timestamp: new Date().toISOString()
});

/**
 * Security & Compliance Checklist:
 * [x] Role-Based Access (Support vs User)
 * [x] Input Validation (Sanitize ticket content)
 * [x] Status Workflow enforcement
 */

export const supportApi = {

  createSupportTicket: async ({ subject, message, category, priority }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'createSupportTicket', subject, message, category, priority }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  updateTicketStatus: async ({ ticketId, status, comment }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'updateTicketStatus', ticketId, status, comment }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  addTicketNote: async ({ ticketId, note, isInternal }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'addTicketNote', ticketId, note, isInternal }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  assignTicket: async ({ ticketId, agentId }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'assignTicket', ticketId, agentId }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  closeTicket: async ({ ticketId, resolution }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'closeTicket', ticketId, resolution }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  recordUserDiagnostic: async ({ userId, diagnosticData }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'recordUserDiagnostic', userId, diagnosticData }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  validateUserAccess: async ({ userId, resource }) => {
    // Diagnostic tool to check why a user can't access something
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'validateUserAccess', userId, resource }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  generateSupportReport: async ({ period, filters }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'generateSupportReport', period, filters }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  auditSupportAccess: async ({ ticketId, action }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'auditSupportAccess', ticketId, action }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  getSupportAuditLog: async ({ ticketId }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'getSupportAuditLog', ticketId }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  }
};