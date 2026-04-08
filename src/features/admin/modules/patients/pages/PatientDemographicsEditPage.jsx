import React from 'react';
import { useParams } from 'react-router-dom';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import DemographicsForm from '../components/DemographicsForm';
import { usePatientDetail } from '../hooks/usePatientDetail';

/**
 * @file PatientDemographicsEditPage.jsx
 * @description Page for editing patient demographic data.
 * Requires 'patients.write' permission.
 */

const PatientDemographicsEditPage = () => {
  const { id } = useParams();
  const { patient, loading } = usePatientDetail(id);

  if (loading) return <div>Cargando...</div>;

  return (
    <PermissionGuard module="patients" action="write">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Editar Datos Demográficos</h1>
        <DemographicsForm 
          initialData={patient} 
          onSubmit={(data) => {}}
        />
      </div>
    </PermissionGuard>
  );
};

export default PatientDemographicsEditPage;