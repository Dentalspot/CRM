// API
export { patientsApi } from './api/patientsApi';

// Hooks
export { usePatients } from './hooks/usePatients';
export { usePatientDetail } from './hooks/usePatientDetail';
export { useDemographicsStats } from './hooks/useDemographicsStats';
export { useDataQuality } from './hooks/useDataQuality';
export { usePatientPermissions } from './hooks/usePatientPermissions';
export { useDemographicsForm } from './hooks/useDemographicsForm';
export { usePatientSearch } from './hooks/usePatientSearch';
export { useBulkActions } from './hooks/useBulkActions';

// Components
export { default as PatientsTable } from './components/PatientsTable';
export { default as PatientProfileCard } from './components/PatientProfileCard';
export { default as DemographicsForm } from './components/DemographicsForm';
export { default as DemographicsFilters } from './components/DemographicsFilters';
export { default as DemographicsChart } from './components/DemographicsChart';
export { default as DataQualityIndicator } from './components/DataQualityIndicator';
export { default as PatientChangeHistory } from './components/PatientChangeHistory';
export { default as BulkActionModal } from './components/BulkActionModal';
export { default as DataQualityCard } from './components/DataQualityCard';

// Pages
export { default as PatientsListPage } from './pages/PatientsListPage';
export { default as PatientDetailPage } from './pages/PatientDetailPage';
export { default as PatientDemographicsEditPage } from './pages/PatientDemographicsEditPage';
export { default as PatientDemographicsStatsPage } from './pages/PatientDemographicsStatsPage';
export { default as PatientDataQualityPage } from './pages/PatientDataQualityPage';
export { default as PatientBulkActionsPage } from './pages/PatientBulkActionsPage';