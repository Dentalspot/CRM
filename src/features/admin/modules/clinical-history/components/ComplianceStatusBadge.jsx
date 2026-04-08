import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * @file ComplianceStatusBadge.jsx
 * @description Displays a colored badge indicating the compliance status of a record.
 *
 * @param {string} status - The compliance status (e.g., 'compliant', 'pending_review', 'non_compliant').
 */
const ComplianceStatusBadge = ({ status }) => {
  const statusConfig = {
    compliant: {
      label: 'Cumple',
      className: 'bg-green-100 text-green-800 border-green-300',
      tooltip: 'El registro cumple con las normativas actuales.',
    },
    pending_review: {
      label: 'Pendiente Revisión',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      tooltip: 'Este registro necesita ser auditado por un administrador.',
    },
    non_compliant: {
      label: 'No Cumple',
      className: 'bg-red-100 text-red-800 border-red-300',
      tooltip: 'Se ha detectado una irregularidad en este registro.',
    },
    default: {
      label: 'Desconocido',
      className: 'bg-gray-100 text-gray-800 border-gray-300',
      tooltip: 'Estado de cumplimiento no determinado.',
    },
  };

  const config = statusConfig[status] || statusConfig.default;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={config.className}>
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ComplianceStatusBadge;