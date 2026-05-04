import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Users, Calendar, FolderKanban } from 'lucide-react';
import useDebounce from '@/hooks/useDebounce';
import useCurrentOrganization from '@/hooks/useCurrentOrganization';
import { getTherapistPatients, getTherapistStats } from '@/lib/patientApi';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

const usePatientsPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { currentOrganizationId } = useCurrentOrganization();

  // Estados
  const [allPatients, setAllPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);

  const [stats, setStats] = useState({
    totalPatients: 0,
    scheduledAppointments: 0,
    totalDocuments: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Paginación
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('lastAppointmentDate');
  const [sortDirection, setSortDirection] = useState('desc');
  // 'all' | 'unassigned' | <clinicId>
  const [clinicFilter, setClinicFilter] = useState('all');

  // Modales
  const [isModalOpen, setModalOpen] = useState(false);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Merge states
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState([]);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [primaryPatientId, setPrimaryPatientId] = useState(null);
  const [merging, setMerging] = useState(false);

  // PIE states
  const [pieMode, setPieMode] = useState(false);
  const [selectedForPie, setSelectedForPie] = useState([]);
  const [addingToPie, setAddingToPie] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // ============================================
  // DATA LOADING
  // ============================================

  const fetchStats = useCallback(async () => {
    if (!user?.id) return;
    setStatsLoading(true);
    try {
      const statsData = await getTherapistStats(user.id, currentOrganizationId);
      setStats(statsData);
    } catch (err) {
      logger.error('Error cargando estadísticas:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [user?.id, currentOrganizationId]);

  const fetchPatients = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTherapistPatients(user.id, null, currentOrganizationId);
      setAllPatients(data);
    } catch (err) {
      logger.error('Error cargando pacientes:', err);
      setError('No se pudieron cargar los pacientes.');
      toast({ variant: "destructive", title: "Error", description: "Fallo al cargar la lista de pacientes." });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast, currentOrganizationId]);

  useEffect(() => {
    fetchStats();
    fetchPatients();
  }, [fetchStats, fetchPatients]);

  // ============================================
  // FILTER & SORT
  // ============================================

  useEffect(() => {
    let result = [...allPatients];

    if (debouncedSearchTerm) {
      const lowerTerm = debouncedSearchTerm.toLowerCase();
      result = result.filter(p =>
        p.full_name?.toLowerCase().includes(lowerTerm) ||
        p.email?.toLowerCase().includes(lowerTerm) ||
        p.phone?.includes(lowerTerm)
      );
    }

    // Filtro por clínica de atención
    if (clinicFilter === 'unassigned') {
      result = result.filter(p => !p.clinic_id);
    } else if (clinicFilter !== 'all') {
      result = result.filter(p => p.clinic_id === clinicFilter);
    }

    result.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (!aVal) aVal = '';
      if (!bVal) bVal = '';

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredPatients(result);
    setPage(1);
  }, [allPatients, debouncedSearchTerm, sortBy, sortDirection, clinicFilter]);

  // ============================================
  // PAGINATION
  // ============================================

  const totalCount = filteredPatients.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedPatients = filteredPatients.slice((page - 1) * pageSize, page * pageSize);

  // ============================================
  // BASIC HANDLERS
  // ============================================

  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setModalOpen(true);
  };

  const handleViewDetails = (patient) => {
    setSelectedPatient(patient);
    setSheetOpen(true);
  };

  const handleSave = () => {
    setModalOpen(false);
    fetchPatients();
    fetchStats();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSortBy('lastAppointmentDate');
    setSortDirection('desc');
    setClinicFilter('all');
  };

  // ============================================
  // MERGE HANDLERS
  // ============================================

  const toggleMergeMode = () => {
    if (mergeMode) {
      setMergeMode(false);
      setSelectedForMerge([]);
    } else {
      setMergeMode(true);
      setSelectedForMerge([]);
      if (pieMode) {
        setPieMode(false);
        setSelectedForPie([]);
      }
    }
  };

  const handleSelectForMerge = (patientId) => {
    setSelectedForMerge(prev => {
      if (prev.includes(patientId)) {
        return prev.filter(id => id !== patientId);
      } else if (prev.length < 2) {
        return [...prev, patientId];
      }
      return prev;
    });
  };

  const openMergeModal = () => {
    if (selectedForMerge.length !== 2) {
      toast({
        variant: "destructive",
        title: "Selección inválida",
        description: "Debes seleccionar exactamente 2 pacientes para fusionar."
      });
      return;
    }
    setPrimaryPatientId(selectedForMerge[0]);
    setMergeModalOpen(true);
  };

  const selectedPatientsData = useMemo(() => {
    return selectedForMerge.map(id => allPatients.find(p => p.id === id)).filter(Boolean);
  }, [selectedForMerge, allPatients]);

  const primaryPatient = selectedPatientsData.find(p => p.id === primaryPatientId);
  const secondaryPatient = selectedPatientsData.find(p => p.id !== primaryPatientId);

  const handleMergePatients = async () => {
    if (!primaryPatientId || selectedForMerge.length !== 2) return;

    const secondaryPatientId = selectedForMerge.find(id => id !== primaryPatientId);
    if (!secondaryPatientId) return;

    setMerging(true);

    try {
      const primaryPatient = allPatients.find(p => p.id === primaryPatientId);
      const secondaryPatient = allPatients.find(p => p.id === secondaryPatientId);

      logger.log('Fusionando pacientes:', {
        primary: primaryPatient?.full_name,
        secondary: secondaryPatient?.full_name
      });

      // 1. Transferir citas del paciente secundario al primario
      const { error: appointmentsError } = await supabase
        .from('appointments')
        .update({ patient_id: primaryPatientId })
        .eq('patient_id', secondaryPatientId);

      if (appointmentsError) {
        logger.error('Error transfiriendo citas:', appointmentsError);
        throw new Error('Error al transferir las citas');
      }

      // 2. Transferir documentos (si existen)
      const { error: documentsError } = await supabase
        .from('patient_documents')
        .update({ patient_id: primaryPatientId })
        .eq('patient_id', secondaryPatientId);

      if (documentsError && documentsError.code !== 'PGRST116') {
        logger.warn('Error transfiriendo documentos:', documentsError);
      }

      // 3. Transferir notas clínicas (si existen)
      const { error: notesError } = await supabase
        .from('patient_private_notes')
        .update({ patient_id: primaryPatientId })
        .eq('patient_id', secondaryPatientId);

      if (notesError && notesError.code !== 'PGRST116') {
        logger.warn('Error transfiriendo notas:', notesError);
      }

      // 4. Transferir objetivos/metas (si existen)
      const { error: goalsError } = await supabase
        .from('patient_goals')
        .update({ patient_id: primaryPatientId })
        .eq('patient_id', secondaryPatientId);

      if (goalsError && goalsError.code !== 'PGRST116') {
        logger.warn('Error transfiriendo objetivos:', goalsError);
      }

      // 5. Transferir planes asignados (si existen)
      const { error: plansError } = await supabase
        .from('patient_assigned_plans')
        .update({ patient_id: primaryPatientId })
        .eq('patient_id', secondaryPatientId);

      if (plansError && plansError.code !== 'PGRST116') {
        logger.warn('Error transfiriendo planes:', plansError);
      }

      // 6. Transferir historial clínico (si existe)
      const { error: historyError } = await supabase
        .from('clinical_history')
        .update({ patient_id: primaryPatientId })
        .eq('patient_id', secondaryPatientId);

      if (historyError && historyError.code !== 'PGRST116') {
        logger.warn('Error transfiriendo historial:', historyError);
      }

      // 7. Marcar el paciente secundario como inactivo
      const { error: archiveError } = await supabase
        .from('patients')
        .update({
          status: 'inactive',
          notes: `[FUSIONADO] Datos transferidos a: ${primaryPatient.full_name} (ID: ${primaryPatientId}) - Fecha: ${new Date().toLocaleDateString()}`
        })
        .eq('id', secondaryPatientId);

      if (archiveError) {
        logger.error('Error archivando paciente:', archiveError);
        throw new Error('Error al archivar el paciente duplicado');
      }

      toast({
        title: "✅ Pacientes fusionados",
        description: `${secondaryPatient.full_name} fue fusionado con ${primaryPatient.full_name}. Todas las citas y datos fueron transferidos.`,
        duration: 5000
      });

      setMergeModalOpen(false);
      setMergeMode(false);
      setSelectedForMerge([]);
      setPrimaryPatientId(null);

      await fetchPatients();
      await fetchStats();

    } catch (error) {
      logger.error('❌ Error fusionando pacientes:', error);
      toast({
        variant: "destructive",
        title: "Error al fusionar",
        description: error.message || "No se pudieron fusionar los pacientes. Intenta de nuevo."
      });
    } finally {
      setMerging(false);
    }
  };

  // ============================================
  // PIE HANDLERS
  // ============================================

  const togglePieMode = () => {
    if (pieMode) {
      setPieMode(false);
      setSelectedForPie([]);
    } else {
      setPieMode(true);
      setSelectedForPie([]);
      if (mergeMode) {
        setMergeMode(false);
        setSelectedForMerge([]);
      }
    }
  };

  const handleTogglePie = (patientId) => {
    setSelectedForPie(prev =>
      prev.includes(patientId) ? prev.filter(id => id !== patientId) : [...prev, patientId]
    );
  };

  const handleAddToPie = async () => {
    if (selectedForPie.length === 0) return;
    setAddingToPie(true);
    try {
      const { data: existing } = await supabase
        .from('pie_student_data')
        .select('patient_id')
        .in('patient_id', selectedForPie)
        .eq('therapist_id', user.id);

      const existingIds = new Set((existing || []).map(r => r.patient_id));
      const toInsert = selectedForPie.filter(id => !existingIds.has(id));

      if (toInsert.length > 0) {
        const rows = toInsert.map(patientId => ({
          patient_id: patientId,
          therapist_id: user.id,
          nee_type: 'transitoria',
          course: 'Sin asignar',
          active: true,
        }));

        const { error } = await supabase.from('pie_student_data').insert(rows);
        if (error) throw error;
      }

      const skipped = existingIds.size;
      toast({
        title: "Listo",
        description: toInsert.length > 0
          ? `${toInsert.length} paciente(s) agregados al PIE.${skipped > 0 ? ` (${skipped} ya existían)` : ''}`
          : 'Todos los pacientes seleccionados ya estaban en el módulo PIE.',
      });

      setPieMode(false);
      setSelectedForPie([]);
    } catch (err) {
      logger.error('Error agregando a PIE:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron agregar los pacientes al PIE. Intenta nuevamente.',
      });
    } finally {
      setAddingToPie(false);
    }
  };

  // ============================================
  // KPI DATA
  // ============================================

  const kpiData = useMemo(() => [
    { title: "Total de Pacientes", value: statsLoading ? '...' : stats.totalPatients, icon: Users, color: "text-blue-600" },
    { title: "Citas Programadas", value: statsLoading ? '...' : stats.scheduledAppointments, icon: Calendar, color: "text-green-600" },
    { title: "Documentos", value: statsLoading ? '...' : stats.totalDocuments, icon: FolderKanban, color: "text-purple-600" },
  ], [stats, statsLoading]);

  return {
    // Data
    loading, error, kpiData,
    paginatedPatients, totalCount, totalPages,
    // Pagination
    page, setPage, pageSize,
    // Filters
    searchTerm, setSearchTerm,
    sortBy, setSortBy,
    clinicFilter, setClinicFilter,
    // Modals
    isModalOpen, setModalOpen,
    isSheetOpen, setSheetOpen,
    selectedPatient, setSelectedPatient,
    // Merge
    mergeMode, selectedForMerge,
    mergeModalOpen, setMergeModalOpen,
    primaryPatientId, setPrimaryPatientId,
    merging,
    selectedPatientsData, primaryPatient, secondaryPatient,
    // PIE
    pieMode, selectedForPie, addingToPie,
    // Handlers
    handleEdit, handleViewDetails, handleSave, handleClearFilters,
    toggleMergeMode, handleSelectForMerge, openMergeModal, handleMergePatients,
    togglePieMode, handleTogglePie, handleAddToPie,
  };
};

export default usePatientsPanel;
