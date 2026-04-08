/**
 * @file adminPermissions.edge.js
 * @description Client-side SDK for Administrative Permissions Edge Function.
 * Handles validation, granting, revocation, and auditing of admin privileges.
 * 
 * MODULE RESPONSIBILITY:
 * - Interface with 'admin-permissions' Edge Function.
 * - Validate request parameters before network transmission.
 * - Enforce standardized response structure.
 * 
 * SECURITY/AUDIT APPROACH:
 * - JWT: Passed automatically via Supabase client (Auth header).
 * - RLS: Enforced by the Edge Function context.
 * - Auditing: All 'write' actions request an audit log entry via the backend.
 * - Validation: strict input typing before invocation.
 * 
 * HOW TO EXTEND:
 * - Add new action methods below.
 * - Update the 'admin-permissions' Edge Function to handle the new 'action' type.
 */

import { supabase } from '@/lib/supabaseClient';

const FUNCTION_NAME = 'admin-permissions';

/**
 * Standardized response helper
 */
const formatResponse = (data, error) => ({
  success: !error,
  data: data || null,
  error: error?.message || null,
  code: error?.code || (error ? 'INTERNAL_ERROR' : 'SUCCESS'),
  auditId: data?.auditId || null,
  timestamp: new Date().toISOString()
});

/**
 * Security & Compliance Checklist:
 * [x] JWT Validation (Handled by Supabase Auth Context)
 * [x] Input Sanitization (Basic type checks)
 * [x] Error Handling (Standardized format)
 * [x] Audit Trail (Backend responsibility, client requests it)
 */

export const adminPermissions = {

  /**
   * Validate if a user has a specific admin permission.
   * @param {object} params - { userId, module, action }
   * @returns {Promise<object>} Standardized response
   */
  validateAdminPermission: async ({ userId, module, action }) => {
    // SECURITY: Input validation
    if (!userId || !module || !action) {
      return formatResponse(null, { message: 'Missing required parameters: userId, module, action', code: 'VALIDATION_ERROR' });
    }

    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'validateAdminPermission', userId, module, action }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, { message: err.message, code: 'NETWORK_ERROR' });
    }
  },

  /**
   * Grant a new permission to a user.
   * @param {object} params - { targetUserId, module, accessLevel, grantedBy }
   */
  grantAdminPermission: async ({ targetUserId, module, accessLevel, grantedBy }) => {
    if (!targetUserId || !module || !accessLevel) {
      return formatResponse(null, { message: 'Invalid permission grant parameters', code: 'VALIDATION_ERROR' });
    }

    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'grantAdminPermission', targetUserId, module, accessLevel, grantedBy }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  /**
   * Revoke an existing permission.
   */
  revokeAdminPermission: async ({ targetUserId, permissionId, reason }) => {
    if (!targetUserId || !permissionId) {
      return formatResponse(null, { message: 'Missing targetUserId or permissionId', code: 'VALIDATION_ERROR' });
    }

    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'revokeAdminPermission', targetUserId, permissionId, reason }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  /**
   * Get all permissions for a specific user.
   */
  getUserPermissions: async ({ userId }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'getUserPermissions', userId }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  /**
   * Validate a bulk set of permissions (e.g. for role assignment).
   */
  validateBulkPermissions: async ({ userId, permissionsList }) => {
    if (!Array.isArray(permissionsList)) {
      return formatResponse(null, { message: 'permissionsList must be an array', code: 'VALIDATION_ERROR' });
    }

    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'validateBulkPermissions', userId, permissionsList }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  /**
   * Manually record a permission change (if not handled automatically by grant/revoke).
   */
  auditPermissionChange: async ({ actorId, targetId, changeType, details }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'auditPermissionChange', actorId, targetId, changeType, details }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  },

  /**
   * Retrieve audit logs for permission changes.
   */
  getPermissionAuditLog: async ({ filters, page = 1, limit = 20 }) => {
    try {
      const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
        body: { action: 'getPermissionAuditLog', filters, page, limit }
      });
      return formatResponse(data, error);
    } catch (err) {
      return formatResponse(null, err);
    }
  }
};