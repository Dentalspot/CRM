import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

/**
 * A summary card displaying a therapist's main DentalLevel stats.
 * @param {{therapist: object}} props
 */
const DentalLevelCard = ({ therapist }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{therapist?.name || 'Cargando...'}</CardTitle>
        <CardDescription>Resumen de Reputación</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Card content stub */}
        <p>Nivel: {therapist?.level_name}</p>
        <p>Puntaje: {therapist?.global_score}</p>
      </CardContent>
    </Card>
  );
};

export default DentalLevelCard;