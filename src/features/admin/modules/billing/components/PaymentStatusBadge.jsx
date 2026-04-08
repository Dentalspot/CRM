import React from 'react';
import { Badge } from '@/components/ui/badge';

/**
 * Status badge for payments
 */
const PaymentStatusBadge = ({ status }) => {
  const variant = status === 'paid' ? 'default' : status === 'failed' ? 'destructive' : 'secondary';
  return <Badge variant={variant}>{status}</Badge>;
};

export default PaymentStatusBadge;