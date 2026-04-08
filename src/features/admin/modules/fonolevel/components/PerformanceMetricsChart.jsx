import React from 'react';
import { BarChart } from 'lucide-react';

/**
 * A chart component to visualize performance metrics.
 * @param {{data: object}} props
 */
const PerformanceMetricsChart = ({ data }) => {
  // A real implementation would use a library like Recharts or Chart.js
  return (
    <div className="p-4 border rounded-lg bg-card flex flex-col items-center justify-center h-64">
      <BarChart className="h-16 w-16 text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">Gráfico de Métricas (Stub)</p>
    </div>
  );
};

export default PerformanceMetricsChart;