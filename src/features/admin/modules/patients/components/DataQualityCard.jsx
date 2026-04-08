import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DataQualityIndicator from './DataQualityIndicator';

/**
 * Dashboard card showing overall data quality metrics
 */
const DataQualityCard = ({ stats }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Salud de la Base de Datos</CardTitle>
      </CardHeader>
      <CardContent>
        <DataQualityIndicator score={stats?.score || 0} />
        <p className="mt-4 text-sm text-muted-foreground">
          {stats?.issuesCount || 0} problemas detectados.
        </p>
      </CardContent>
    </Card>
  );
};

export default DataQualityCard;