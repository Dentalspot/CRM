import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, UserX, RefreshCw, Loader2, TrendingUp } from 'lucide-react';
import DemographicsChart from '../components/DemographicsChart';
import { useDemographicsStats } from '../hooks/useDemographicsStats';

const PatientDemographicsStatsPage = () => {
  const { stats, loading, refreshStats } = useDemographicsStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Estadísticas Demográficas</h1>
          <p className="text-muted-foreground">Análisis poblacional de pacientes en la plataforma</p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshStats}>
          <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Pacientes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-gray-500">Activos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100">
              <UserX className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.inactive}</p>
              <p className="text-xs text-gray-500">Inactivos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-100">
              <TrendingUp className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%</p>
              <p className="text-xs text-gray-500">Tasa Activos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DemographicsChart type="bar" data={stats.byAge} title="Distribución por Rango Etario" />
        <DemographicsChart type="pie" data={stats.byGender} title="Distribución por Género" />
        <DemographicsChart type="line" data={stats.byMonth} title="Registros por Mes (últimos 6 meses)" />
        <DemographicsChart type="pie" data={stats.byStatus} title="Estado de Pacientes" />
      </div>
    </div>
  );
};

export default PatientDemographicsStatsPage;
