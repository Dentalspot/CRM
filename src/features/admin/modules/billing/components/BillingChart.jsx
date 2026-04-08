import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

/**
 * Chart component for revenue/billing trends
 */
const BillingChart = ({ data }) => {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Ingresos Mensuales</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[200px] flex items-center justify-center bg-muted/10 rounded">
            Gráfico de Ingresos (Stub)
        </div>
      </CardContent>
    </Card>
  );
};

export default BillingChart;