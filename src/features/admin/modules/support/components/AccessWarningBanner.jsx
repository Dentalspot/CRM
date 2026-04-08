import React from 'react';
import { Alert } from '@/components/ui/alert';

/**
 * Warning banner for accessing sensitive user data.
 */
const AccessWarningBanner = () => (
  <Alert variant="destructive">
    Acceso a datos sensibles. Esta acción está siendo auditada.
  </Alert>
);
export default AccessWarningBanner;