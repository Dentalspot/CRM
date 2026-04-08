import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

const SystemHealthChart = ({ data = [], loading }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base flex items-center gap-2">
        <Activity className="h-4 w-4 text-green-500" />
        Métricas de Salud
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-48 bg-slate-50 rounded-lg flex items-center justify-center text-sm text-muted-foreground">
        Gráfico de métricas del sistema
      </div>
    </CardContent>
  </Card>
);

export default SystemHealthChart;
