import React from 'react';
import { Progress } from '@/components/ui/progress';

/**
 * Visual indicator of data completeness/quality
 * @param {number} score - 0 to 100
 */
const DataQualityIndicator = ({ score }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm font-medium">Calidad de Datos</span>
        <span className="text-sm text-muted-foreground">{score}%</span>
      </div>
      <Progress value={score} />
    </div>
  );
};

export default DataQualityIndicator;