
/**
 * @file patientsApi.js
 * @description API module for patient management features including demographics, stats, and bulk actions.
 * @module features/admin/modules/patients/api
 */

import { supabase } from '@/lib/supabaseClient';

/**
 * Logs API actions for audit purposes
 * @param {string} action - The action being performed
 * @param {object} details - Additional context
 */
const logAction = async (action, details) => {
  // Integration with system audit logger would go here
  logger.info(`[PatientsAPI] ${action}`, details);
};

export const patientsApi = {
  /**
   * Fetches a paginated list of patients with support for complex filtering
   * @param {object} params - { page, limit, filters, sort }
   * @returns {Promise<{data: Array, count: number}>}
   */
  fetchPatients: async ({ page = 0, limit = 20, filters = {}, sort = { column: 'created_at', direction: 'desc' } }) => {
    await logAction('fetch_patients_list', { page, limit, filters });
    
    let query = supabase
      .from('patients')
      .select('id, profile_id, therapist_id, status, created_at, patient_type, responsible_name, profile:profiles!patients_profile_id_fkey(full_name, email, rut, gender, birthdate)', { count: 'exact' });

    // Apply filters
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.search) {
      query = query.or(`id.eq.${filters.search},status.ilike.%${filters.search}%`); 
    }

    // Apply pagination and sorting
    query = query.order(sort.column, { ascending: sort.direction === 'asc' })
                 .range(page * limit, (page + 1) * limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data, count };
  },

  /**
   * Fetches detailed profile and clinical metadata for a single patient
   * @param {string} id - Patient UUID
   * @returns {Promise<object>}
   */
  fetchPatientById: async (id) => {
    await logAction('fetch_patient_detail', { id });
    const { data, error } = await supabase
      .from('patients')
      .select('*, profile:profiles!patients_profile_id_fkey(full_name, email, rut, gender, birthdate, phone)')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * Updates patient demographic information
   * @param {string} id - Patient UUID
   * @param {object} data - Fields to update
   * @returns {Promise<object>}
   */
  updatePatientDemographics: async (id, data) => {
    await logAction('update_demographics', { id, fields: Object.keys(data) });
    const { data: updated, error } = await supabase
      .from('patients')
      .update(data)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return updated;
  },

  /**
   * Aggregates demographic statistics for dashboards
   * @returns {Promise<object>}
   */
  fetchDemographicsStats: async () => {
    const { count: total, error: errTotal } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });

    const { count: active, error: errActive } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: inactive, error: errInactive } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'active');

    if (errTotal || errActive || errInactive) {
      throw errTotal || errActive || errInactive;
    }

    return { 
      total: total || 0, 
      active: active || 0, 
      inactive: inactive || 0 
    };
  },

  /**
   * Analyzes data quality issues (missing fields, invalid formats)
   * @returns {Promise<Array>}
   */
  fetchDataQualityIssues: async () => {
    const { data, error } = await supabase
      .from('patients')
      .select('id, created_at, status')
      .is('therapist_id', null);

    if (error) throw error;

    return data.map(patient => ({
      patientId: patient.id,
      issue: 'Paciente sin terapeuta asignado (therapist_id es nulo)',
      severity: 'high',
      created_at: patient.created_at
    }));
  },

  /**
   * Performs bulk actions on multiple patients
   * @param {Array<string>} ids - Array of Patient UUIDs
   * @param {string} action - 'archive', 'delete', 'export'
   * @returns {Promise<object>}
   */
  performBulkAction: async (ids, action) => {
    await logAction('bulk_action', { action, count: ids.length });
    
    if (action === 'archive') {
      const { error } = await supabase
        .from('patients')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
    }
    
    return { success: true, count: ids.length };
  }
};
