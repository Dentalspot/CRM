import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Form for an admin to validate or reject a therapist's specialty claim.
 */
const SpecialtyValidationForm = ({ specialty, onValidate }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{specialty?.name}</CardTitle>
        <CardDescription>Validación de Especialidad</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onValidate(false)}>Rechazar</Button>
        <Button onClick={() => onValidate(true)}>Validar</Button>
      </CardContent>
    </Card>
  );
};

export default SpecialtyValidationForm;