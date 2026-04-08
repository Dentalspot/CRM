import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

/**
 * Alert component for failed payments
 */
const FailedPaymentAlert = ({ error }) => {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error en el pago</AlertTitle>
      <AlertDescription>{error || 'Hubo un problema procesando el pago.'}</AlertDescription>
    </Alert>
  );
};

export default FailedPaymentAlert;