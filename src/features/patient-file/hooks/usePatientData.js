import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { calculateAge } from '@/lib/utils/calculations';
import { formatRut, formatPhone } from '@/lib/utils/formatters';
import logger from '@/lib/utils/logger';
import { normalizeRut, normalizePhone } from '@/lib/utils/normalizers';

const usePatientData = ({ patient, templates = [], onSave }) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const profile = patient?.profile || patient || {};

  // PROFILE DATA (datos personales)
  const [profileData, setProfileData] = useState({
    full_name: profile.full_name || patient?.full_name || '',
    birthdate: profile.birthdate || '',
    gender: profile.gender || '',
    email: profile.email || patient?.email || '',
    phone: profile.phone || patient?.phone || '',
    rut: profile.rut || patient?.rut || '',
  });

  // PATIENT DATA (datos clínicos)
  const [patientData, setPatientData] = useState({
    patient_type: patient?.patient_type || 'privado',
    responsible_name: patient?.responsible_name || '',
    responsible_rut: patient?.responsible_rut || '',
    diagnosis: patient?.diagnosis || '',
    medical_history: patient?.medical_history || '',
    allergies: patient?.allergies || '',
    other_info: patient?.other_info || '',
    anamnesis_template: patient?.anamnesis_template || '',
    evaluation_template: patient?.evaluation_template || ''
  });

  // Display values
  const [displayPhone, setDisplayPhone] = useState(formatPhone(profileData.phone));
  const [displayRut, setDisplayRut] = useState(formatRut(profileData.rut));
  const [displayResponsibleRut, setDisplayResponsibleRut] = useState(formatRut(patientData.responsible_rut));

  const [saving, setSaving] = useState(false);

  // Diagnosis system
  const [diagnosisCodes, setDiagnosisCodes] = useState([]);
  const [patientDiagnoses, setPatientDiagnoses] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState('all');
  const [loadingDiagnoses, setLoadingDiagnoses] = useState(true);
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  const [showDiagnosisList, setShowDiagnosisList] = useState(false);
  const [addingDiagnosis, setAddingDiagnosis] = useState(false);

  // Template modal
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [existingReports, setExistingReports] = useState([]);

  // =====================================================
  // LOAD DATA
  // =====================================================

  const loadDiagnosisData = async () => {
    setLoadingDiagnoses(true);
    try {
      const { data: codes } = await supabase
        .from('diagnosis_codes')
        .select('*, diagnosis_systems(id, code, name)')
        .eq('is_active', true)
        .order('code');

      setDiagnosisCodes(codes || []);
    } catch (error) {
      logger.error('Error loading diagnosis data:', error);
    } finally {
      setLoadingDiagnoses(false);
    }
  };

  const loadPatientDiagnoses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('patient_diagnoses')
        .select(`
          *,
          diagnosis_codes (
            code,
            name
          ),
          diagnosis_systems (
            code,
            name
          )
        `)
        .eq('patient_id', patient.id)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error) {
        const mappedData = data.map(pd => ({
          ...pd,
          diagnosis_code: pd.diagnosis_codes?.code || 'N/A',
          diagnosis_system: pd.diagnosis_systems?.code || 'N/A'
        }));
        setPatientDiagnoses(mappedData || []);
      }
    } catch (error) {
      logger.error('Error loading patient diagnoses:', error);
    }
  }, [patient?.id]);

  const loadExistingReports = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('clinical_reports')
        .select('*')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false });

      setExistingReports(data || []);
    } catch (error) {
      logger.error('Error loading reports:', error);
    }
  }, [patient?.id]);

  useEffect(() => {
    loadDiagnosisData();
    if (patient?.id) {
      loadPatientDiagnoses();
      loadExistingReports();
    }
  }, [patient?.id, loadPatientDiagnoses, loadExistingReports]);

  useEffect(() => {
    setDisplayPhone(formatPhone(profileData.phone));
    setDisplayRut(formatRut(profileData.rut));
  }, [profileData.phone, profileData.rut]);

  useEffect(() => {
    setDisplayResponsibleRut(formatRut(patientData.responsible_rut));
  }, [patientData.responsible_rut]);

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleProfileChange = (key, value) => {
    setProfileData(prev => ({ ...prev, [key]: value }));
  };

  const handlePatientChange = (key, value) => {
    setPatientData(prev => ({ ...prev, [key]: value }));
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setDisplayPhone(formatted);
    handleProfileChange('phone', normalizePhone(e.target.value));
  };

  const handleRutChange = (e) => {
    const formatted = formatRut(e.target.value);
    setDisplayRut(formatted);
    handleProfileChange('rut', normalizeRut(e.target.value));
  };

  const handleResponsibleRutChange = (e) => {
    const formatted = formatRut(e.target.value);
    setDisplayResponsibleRut(formatted);
    handlePatientChange('responsible_rut', normalizeRut(e.target.value));
  };

  // =====================================================
  // DIAGNOSIS HANDLERS
  // =====================================================

  const handleAddDiagnosis = async (diagnosisCode) => {
    if (!patient?.id || !user?.id) return;

    setAddingDiagnosis(true);
    try {
      const existing = patientDiagnoses.find(pd => pd.code_id === diagnosisCode.id);

      if (existing) {
        toast({ title: "Este diagnóstico ya está asignado" });
        setAddingDiagnosis(false);
        return;
      }

      const isPrimary = patientDiagnoses.length === 0;

      const { error } = await supabase
        .from('patient_diagnoses')
        .insert({
          patient_id: patient.id,
          therapist_id: user.id,
          system_id: diagnosisCode.system_id,
          code_id: diagnosisCode.id,
          diagnosis_name: diagnosisCode.name,
          clinical_description: diagnosisCode.description,
          is_primary: isPrimary,
          is_active: true,
          diagnosed_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({ title: "✅ Diagnóstico agregado" });
      loadPatientDiagnoses();
      setDiagnosisSearch('');
      setShowDiagnosisList(false);
    } catch (error) {
      logger.error('Error adding diagnosis:', error);
      toast({ variant: "destructive", title: "Error al agregar diagnóstico", description: error.message });
    } finally {
      setAddingDiagnosis(false);
    }
  };

  const handleRemoveDiagnosis = async (diagnosisId) => {
    try {
      const { error } = await supabase
        .from('patient_diagnoses')
        .update({ is_active: false })
        .eq('id', diagnosisId);

      if (error) throw error;

      toast({ title: "✅ Diagnóstico removido" });
      loadPatientDiagnoses();
    } catch (error) {
      toast({ variant: "destructive", title: "Error al remover diagnóstico" });
    }
  };

  const handleSetPrimary = async (diagnosisId) => {
    try {
      await supabase
        .from('patient_diagnoses')
        .update({ is_primary: false })
        .eq('patient_id', patient.id);

      const { error } = await supabase
        .from('patient_diagnoses')
        .update({ is_primary: true })
        .eq('id', diagnosisId);

      if (error) throw error;

      toast({ title: "✅ Diagnóstico principal actualizado" });
      loadPatientDiagnoses();
    } catch (error) {
      toast({ variant: "destructive", title: "Error al actualizar" });
    }
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (patient?.profile_id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: profileData.full_name,
            birthdate: profileData.birthdate || null,
            gender: profileData.gender || null,
            email: profileData.email,
            phone: profileData.phone || null,
            rut: profileData.rut || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', patient.profile_id);

        if (profileError) {
          logger.error('Error updating profile:', profileError);
        }
      }

      const { error: patientError } = await supabase
        .from('patients')
        .update({
          patient_type: patientData.patient_type,
          responsible_name: patientData.responsible_name || null,
          responsible_rut: patientData.responsible_rut || null,
          diagnosis: patientData.diagnosis || null,
          medical_history: patientData.medical_history || null,
          allergies: patientData.allergies || null,
          other_info: patientData.other_info || null,
          anamnesis_template: patientData.anamnesis_template || null,
          evaluation_template: patientData.evaluation_template || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', patient.id);

      if (patientError) throw patientError;

      toast({ title: "✅ Datos guardados correctamente" });
      if (onSave) onSave();
    } catch (error) {
      logger.error("Error saving:", error);
      toast({ variant: "destructive", title: "Error al guardar", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // TEMPLATE HANDLERS
  // =====================================================

  const handleOpenTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const existingReport = existingReports.find(r => r.template_id === templateId);
      setSelectedTemplate({ template, existingReport });
      setFormModalOpen(true);
    }
  };

  // =====================================================
  // FILTERED DATA
  // =====================================================

  const filteredCodes = diagnosisCodes.filter(code => {
    const systemCode = code.diagnosis_systems?.code?.toUpperCase() || '';
    const matchesSystem = selectedSystem === 'all' || systemCode === selectedSystem;
    const matchesSearch = !diagnosisSearch ||
      code.code.toLowerCase().includes(diagnosisSearch.toLowerCase()) ||
      code.name.toLowerCase().includes(diagnosisSearch.toLowerCase());

    return matchesSystem && matchesSearch;
  });

  const anamnesisTemplates = templates.filter(t => t.category === 'anamnesis');
  const evaluationTemplates = templates.filter(t => t.category === 'evaluacion');

  const getExistingReport = (templateId) => {
    return existingReports.find(r => r.template_id === templateId);
  };

  const age = calculateAge(profileData.birthdate);

  return {
    // Profile
    profileData, handleProfileChange,
    displayPhone, handlePhoneChange,
    displayRut, handleRutChange,
    // Patient
    patientData, handlePatientChange,
    displayResponsibleRut, handleResponsibleRutChange,
    // Diagnosis
    patientDiagnoses, filteredCodes,
    selectedSystem, setSelectedSystem,
    diagnosisSearch, setDiagnosisSearch,
    showDiagnosisList, setShowDiagnosisList,
    loadingDiagnoses, addingDiagnosis,
    handleAddDiagnosis, handleRemoveDiagnosis, handleSetPrimary,
    // Templates
    anamnesisTemplates, evaluationTemplates,
    getExistingReport, handleOpenTemplate,
    isFormModalOpen, setFormModalOpen,
    selectedTemplate, setSelectedTemplate,
    // Reports
    existingReports, loadExistingReports,
    // Submit
    saving, handleSubmit,
    // Computed
    age,
    // Auth
    user,
  };
};

export default usePatientData;
