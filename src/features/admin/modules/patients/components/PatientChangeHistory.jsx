import React from 'react';

/**
 * Timeline of changes for a patient record
 * @param {object} props - { history }
 */
const PatientChangeHistory = ({ history = [] }) => {
  return (
    <div className="space-y-4">
      <h3>Historial de Cambios</h3>
      <div className="border-l-2 pl-4 ml-2">
        <div className="mb-4">
          <p className="text-sm font-medium">Perfil Creado</p>
          <p className="text-xs text-muted-foreground">Hace 2 días</p>
        </div>
      </div>
    </div>
  );
};

export default PatientChangeHistory;