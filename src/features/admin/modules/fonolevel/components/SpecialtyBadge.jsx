import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';

/**
 * A badge to indicate the validation status of a specialty.
 * @param {{isValidated: boolean, specialtyName: string}} props
 */
const SpecialtyBadge = ({ isValidated, specialtyName }) => {
  return (
    <Badge variant={isValidated ? 'default' : 'secondary'}>
      {isValidated ? <CheckCircle className="mr-1 h-3 w-3 text-green-400" /> : <AlertCircle className="mr-1 h-3 w-3 text-yellow-400" />}
      {specialtyName}
    </Badge>
  );
};

export default SpecialtyBadge;