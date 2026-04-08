import React from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';

/**
 * Card displaying performance metrics for a model.
 */
const ModelPerformanceCard = ({ metrics }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <CardTitle>Rendimiento del Modelo</CardTitle>
        <div className="mt-2">Accuracy: {metrics?.accuracy}%</div>
      </CardContent>
    </Card>
  );
};

export default ModelPerformanceCard;