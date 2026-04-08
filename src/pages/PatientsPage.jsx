import React from 'react';
import PatientsPanel from '@/features/patients/components/PatientsPanel';

const PatientsPage = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
      </div>
      <PatientsPanel />
    </div>
  );
};

export default PatientsPage;