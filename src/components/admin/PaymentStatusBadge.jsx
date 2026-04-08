import React from 'react';
import { Badge } from '@/components/ui/badge';

const PaymentStatusBadge = ({ status }) => {
  const styles = {
    succeeded: "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400",
    paid: "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400",
    pending: "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
    failed: "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400",
    refunded: "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
  };

  const labels = {
    succeeded: "Exitoso",
    paid: "Pagado",
    pending: "Pendiente",
    failed: "Fallido",
    refunded: "Reembolsado"
  };

  const style = styles[status] || "bg-gray-100 text-gray-800";
  const label = labels[status] || status;

  return (
    <Badge variant="outline" className={`border-0 ${style}`}>
      {label}
    </Badge>
  );
};

export default PaymentStatusBadge;