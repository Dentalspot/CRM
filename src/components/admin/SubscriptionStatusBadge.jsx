import React from 'react';
import { Badge } from '@/components/ui/badge';

const SubscriptionStatusBadge = ({ status }) => {
  const styles = {
    active: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    past_due: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    canceled: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
    trialing: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
    incomplete: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  };

  const labels = {
    active: "Activa",
    past_due: "Vencida",
    canceled: "Cancelada",
    trialing: "Prueba",
    incomplete: "Incompleta"
  };

  return (
    <Badge className={`hover:bg-opacity-80 ${styles[status] || styles.canceled}`}>
      {labels[status] || status}
    </Badge>
  );
};

export default SubscriptionStatusBadge;