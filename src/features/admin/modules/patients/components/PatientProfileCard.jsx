import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

/**
 * Displays summary profile information
 * @param {object} props - { patient }
 */
const PatientProfileCard = ({ patient }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil del Paciente</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Profile Details Stub */}
        <p>Nombre: {patient?.profiles?.full_name}</p>
      </CardContent>
    </Card>
  );
};

export default PatientProfileCard;