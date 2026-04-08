
import React, { useState, useEffect } from 'react';
import { fonoLevelApi } from '../api/fonoLevelApi';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import LevelRequirementsTable from '../components/LevelRequirementsTable';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import logger from '@/lib/utils/logger';

const DentalLevelManagementPage = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    total: 0,
    avg: 0,
    common: 'N/A',
    distString: 'N/A'
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const levelsData = [
    { id: 1, name: '⬜ Sin nivel', min_score: 0, requirements_summary: 'Sin formación ni actividad registrada' },
    { id: 2, name: '🔹 En formación', min_score: 1, requirements_summary: 'Formación académica básica registrada' },
    { id: 3, name: '🟡 Experiencia básica', min_score: 20, requirements_summary: 'Formación + primeros pacientes en plataforma' },
    { id: 4, name: '🟠 Profesional con experiencia', min_score: 40, requirements_summary: 'Actividad clínica sostenida y formación sólida' },
    { id: 5, name: '🔵 Alta experiencia', min_score: 60, requirements_summary: 'Alto volumen de pacientes, informes y planes' },
    { id: 6, name: '🏆 Máximo nivel', min_score: 80, requirements_summary: 'Élite: formación completa + máxima actividad clínica' },
  ];

  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    setLoadingStats(true);
    try {
      // Usar limit 200 según requerimientos
      const { data } = await fonoLevelApi.fetchTherapistLevels({ limit: 200, page: 0 });
      
      if (data && data.length > 0) {
        const total = data.length;
        const totalScore = data.reduce((acc, curr) => acc + (curr.global_score || 0), 0);
        const avg = (totalScore / total).toFixed(1);
        
        const distribution = data.reduce((acc, curr) => {
          const level = curr.level_name || 'Desconocido';
          acc[level] = (acc[level] || 0) + 1;
          return acc;
        }, {});

        // Encontrar el más común
        const sortedDist = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
        const common = sortedDist.length > 0 ? `${sortedDist[0][0]} (${sortedDist[0][1]})` : 'N/A';
        
        const distString = sortedDist.map(([k, v]) => `${k}: ${v}`).join(', ');

        setStats({ total, avg, common, distString });
      }
    } catch (error) {
      logger.error('Error loading stats', error);
      // Falla silenciosa como requerido
    } finally {
      setLoadingStats(false);
    }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      await fonoLevelApi.recalculateReputation();
      toast({
        title: "Recálculo completado",
        description: "Se han actualizado las puntuaciones de todos los dentistas exitosamente.",
      });
      await loadSystemStats();
    } catch (error) {
      logger.error(error);
      toast({
        variant: "destructive",
        title: "Error en el recálculo",
        description: "No se pudieron recalcular las puntuaciones. Por favor intenta nuevamente.",
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <PermissionGuard module="dentallevel" action="write">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold">Gestión del Sistema DentalLevel</h1>

        {/* Sección 1: Tabla de Niveles */}
        <Card>
          <CardHeader>
            <CardTitle>Tabla de Niveles del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <LevelRequirementsTable levels={levelsData} />
          </CardContent>
        </Card>

        {/* Sección 2: Estadísticas del sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas del sistema</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-500 font-medium">Total Terapeutas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-500 font-medium">Promedio Score Global</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{stats.avg}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-500 font-medium">Nivel Más Común</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-bold truncate" title={stats.common}>{stats.common}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-500 font-medium">Distribución</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm truncate font-medium" title={stats.distString}>
                      {stats.distString}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sección 3: Recalcular reputación */}
        <Card>
          <CardHeader>
            <CardTitle>Recalcular reputación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Fuerza el recálculo de scores para todos los dentistas. Usa esto después de actualizar la fórmula de puntuación.
            </p>
            <Button 
              onClick={handleRecalculate} 
              disabled={isRecalculating}
              className="w-full sm:w-auto"
            >
              {isRecalculating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Recalcular todo
            </Button>
          </CardContent>
        </Card>

      </div>
    </PermissionGuard>
  );
};

export default DentalLevelManagementPage;
