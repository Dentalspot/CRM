import React from 'react';
import { Badge } from '@/components/ui/badge';

/**
 * Badge indicating training job status.
 */
const TrainingStatusBadge = ({ status }) => {
  return <Badge>{status}</Badge>;
};

export default TrainingStatusBadge;