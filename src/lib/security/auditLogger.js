import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

/**
 * Audit Logger Service
 * Handles logging of security events, data changes, and system actions.
 * Maps application events to the 'audit_logs' table.
 */

// Helper to validate UUID format
const isUUID = (str) => {
  if (!str) return false;
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(str);
};

// Helper to ensure we have a valid UUID for the record_id (NOT NULL) constraint
// If the provided ID is not a UUID (e.g. integer ID), we generate a random one
// and expect the original ID to be stored in the data payload.
const getSafeRecordId = (id) => {
  if (id && isUUID(id)) return id;
  return crypto.randomUUID();
};

/**
 * Logs a generic user action
 * @param {string} action - Action name/type
 * @param {object} details - Additional context
 * @param {string} userId - User performing the action
 * @param {string} status - Outcome status (success/failure)
 */
export const logAction = async (action, details = {}, userId = null, status = 'success') => {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      action: action,
      user_id: userId,
      table_name: 'system_action', // Generic resource type
      record_id: getSafeRecordId(null),
      new_data: { details, status },
      timestamp: new Date().toISOString()
    });

    if (error) logger.error('Failed to log action:', error);
  } catch (err) {
    logger.error('Audit logger error:', err);
  }
};

/**
 * Logs a data change event (Update/Insert/Delete)
 * @param {string} resource - Table or resource name
 * @param {string} id - Record ID
 * @param {object} before - Data before change (null for insert)
 * @param {object} after - Data after change (null for delete)
 * @param {string} userId - User performing the change
 */
export const logDataChange = async (resource, id, before, after, userId) => {
  try {
    let actionType = 'UPDATE';
    if (!before) actionType = 'INSERT';
    if (!after) actionType = 'DELETE';

    const recordId = getSafeRecordId(id);
    
    // If ID wasn't a UUID, ensure it's preserved in the data payload
    const metaData = (!isUUID(id) && id) ? { original_record_id: id } : {};

    const { error } = await supabase.from('audit_logs').insert({
      action: actionType,
      user_id: userId,
      table_name: resource,
      record_id: recordId,
      old_data: before ? { ...before, ...metaData } : null,
      new_data: after ? { ...after, ...metaData } : null,
      timestamp: new Date().toISOString()
    });

    if (error) logger.error('Failed to log data change:', error);
  } catch (err) {
    logger.error('Audit logger error:', err);
  }
};

/**
 * Logs access to a specific resource
 * @param {string} resource - Resource type (e.g., 'patient_file')
 * @param {string} id - Resource ID
 * @param {string} userId - User accessing the resource
 */
export const logAccess = async (resource, id, userId) => {
  try {
    const recordId = getSafeRecordId(id);
    const metaData = (!isUUID(id) && id) ? { original_id: id } : {};

    const { error } = await supabase.from('audit_logs').insert({
      action: 'ACCESS',
      user_id: userId,
      table_name: resource,
      record_id: recordId,
      new_data: { status: 'success', ...metaData },
      timestamp: new Date().toISOString()
    });

    if (error) logger.error('Failed to log access:', error);
  } catch (err) {
    logger.error('Audit logger error:', err);
  }
};

/**
 * Logs a system or application error
 * @param {Error|string} error - Error object or message
 * @param {object} details - Additional context
 * @param {string} userId - User associated with error (if any)
 */
export const logError = async (errorObj, details = {}, userId = null) => {
  try {
    const errorMessage = errorObj instanceof Error ? errorObj.message : String(errorObj);
    const errorStack = errorObj instanceof Error ? errorObj.stack : null;

    const { error } = await supabase.from('audit_logs').insert({
      action: 'ERROR',
      user_id: userId,
      table_name: 'system_error',
      record_id: getSafeRecordId(null),
      new_data: { 
        message: errorMessage, 
        stack: errorStack, 
        ...details,
        status: 'error' 
      },
      timestamp: new Date().toISOString()
    });

    if (error) logger.error('Failed to log error:', error);
  } catch (err) {
    logger.error('Audit logger error:', err);
  }
};

/**
 * Retrieves audit logs with filtering
 * @param {object} options - Filter options
 * @returns {Promise<Array>} List of logs
 */
export const getAuditLog = async ({ userId, resource, action, limit = 50, page = 0 } = {}) => {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (resource) {
      query = query.eq('table_name', resource);
    }
    if (action) {
      query = query.eq('action', action);
    }

    const from = page * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;
    
    return { logs: data, total: count };
  } catch (err) {
    logger.error('Failed to retrieve audit logs:', err);
    return { logs: [], total: 0 };
  }
};

export default {
  logAction,
  logDataChange,
  logAccess,
  logError,
  getAuditLog
};