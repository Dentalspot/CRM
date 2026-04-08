import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { useToast } from '@/components/ui/use-toast';

export const usePatientAdmin = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all patients with profile and therapist info
  const fetchAllPatients = useCallback(async ({ page = 0, pageSize = 20, searchTerm = '', status = 'all' } = {}) => {
    setLoading(true);
    try {
      let query = supabase
        .from('patients')
        .select('*, profile:profiles!patients_profile_id_fkey(full_name, email, rut)', { count: 'exact' });

      if (searchTerm) {
        // Search in linked profile
        // Note: Supabase complex filtering across relations can be tricky. 
        // For simplicity in this mock, we fetch and filter or rely on simple filters if configured.
        // A real robust search usually requires a dedicated RPC or view.
      }

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, count, error: err } = await query
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('created_at', { ascending: false });

      if (err) throw err;

      // Fetch therapist names (FK points to users, not profiles)
      if (data?.length) {
        const therapistIds = [...new Set(data.map(p => p.therapist_id).filter(Boolean))];
        if (therapistIds.length) {
          const { data: therapists } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', therapistIds);

          const therapistMap = {};
          (therapists || []).forEach(t => { therapistMap[t.id] = t; });
          data.forEach(p => { p.therapist = therapistMap[p.therapist_id] || null; });
        }
      }

      return { data, count };
    } catch (err) {
      logger.error('Error fetching patients:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: "No se pudieron cargar los pacientes.",
        variant: "destructive"
      });
      return { data: [], count: 0 };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch detailed clinical file for a patient
  const fetchClinicalFiles = useCallback(async (patientId) => {
    setLoading(true);
    try {
      // Fetching clinical history
      const { data: history, error: err1 } = await supabase
        .from('clinical_history')
        .select('*')
        .eq('patient_id', patientId)
        .order('entry_date', { ascending: false });

      if (err1) throw err1;

      // Fetching reports
      const { data: reports, error: err2 } = await supabase
        .from('clinical_reports')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (err2) throw err2;

      return { history, reports };
    } catch (err) {
      logger.error('Error fetching clinical files:', err);
      setError(err.message);
      return { history: [], reports: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPatientDemographics = useCallback(async (patientId) => {
    // Placeholder for demographics fetch
    // Often simply fetching the patient record again or a specific view
    return await fetchAllPatients({ searchTerm: patientId }); 
  }, [fetchAllPatients]);

  const updateConsent = useCallback(async (patientId, consentData) => {
    setLoading(true);
    try {
      // Assuming 'alerts' or a jsonb field stores consent metadata for now, 
      // or a dedicated table 'patient_consents' if it existed.
      const { error: err } = await supabase
        .from('patients')
        .update({ 
          alerts: consentData // Mocking consent storage in alerts jsonb
        })
        .eq('id', patientId);

      if (err) throw err;
      
      toast({ title: "Éxito", description: "Consentimiento actualizado." });
      return true;
    } catch (err) {
      logger.error(err);
      toast({ title: "Error", description: "No se pudo actualizar el consentimiento.", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Aggregate stats for dashboard
  const fetchComplianceStats = useCallback(async () => {
    // Mock aggregation. In production, use RPC or specific count queries.
    return {
      compliant: 150,
      warning: 25,
      nonCompliant: 5,
      deletionRequests: 2
    };
  }, []);

  return {
    loading,
    error,
    fetchAllPatients,
    fetchClinicalFiles,
    fetchPatientDemographics,
    updateConsent,
    fetchComplianceStats
  };
};