import React from 'react';
import { useParams } from 'react-router-dom';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import PatientProfileCard from '../components/PatientProfileCard';
import PatientChangeHistory from '../components/PatientChangeHistory';
import { usePatientDetail } from '../hooks/usePatientDetail';

/**
 * @file PatientDetailPage.jsx
 * @description Detailed view of a specific patient.
 * Requires 'patients.read' permission.
 */

const PatientDetailPage = () => {
  const { id } = useParams();
  const { patient, loading } = usePatientDetail(id);

  if (loading) return <div>Cargando...</div>;
  if (!patient) return <div>Paciente no encontrado</div>;

  return (
    <PermissionGuard module="patients" action="read">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Detalle del Paciente</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <PatientProfileCard patient={patient} />
          </div>
          <div>
            <PatientChangeHistory />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default PatientDetailPage;