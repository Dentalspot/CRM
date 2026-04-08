
import React, { useState, useEffect } from 'react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import logger from '@/lib/utils/logger';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const FonoSpecialtyPage = () => {
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch specialties
        const { data: specsData, error: specsError } = await supabase
          .from('specialties')
          .select('id, name, slug')
          .order('name');

        if (specsError || !specsData) {
          setSpecialties([]);
          return;
        }

        const slugs = specsData.map(s => s.slug).filter(Boolean);

        // 2. Fetch counts grouped by specialty slug
        // Since standard select doesn't group easily, we fetch records and aggregate in JS
        let countsMap = {};
        if (slugs.length > 0) {
          const { data: badgesData, error: badgesError } = await supabase
            .from('therapist_specialty_badges')
            .select('specialty')
            .in('specialty', slugs);

          if (!badgesError && badgesData) {
            countsMap = badgesData.reduce((acc, curr) => {
              const key = curr.specialty;
              if (key) {
                acc[key] = (acc[key] || 0) + 1;
              }
              return acc;
            }, {});
          }
        }

        // 3. Merge data
        const mergedData = specsData.map(spec => ({
          ...spec,
          activeTherapists: countsMap[spec.slug] || 0
        }));

        setSpecialties(mergedData);
      } catch (error) {
        // Silent fail
        logger.error("Error loading specialties", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <PermissionGuard module="dentallevel" action="read">
      <div className="py-8 px-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Especialidades del Sistema</h1>
          <p className="text-slate-500 mt-1">
            Resumen de especialidades y la cantidad de dentistas activos evaluados en cada una.
          </p>
        </div>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Métricas por Especialidad</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : specialties.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No se encontraron especialidades registradas.
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-semibold text-slate-700">Nombre de la Especialidad</TableHead>
                      <TableHead className="font-semibold text-slate-700 hidden sm:table-cell">Slug Identificador</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-right">Terapeutas Activos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {specialties.map((spec) => (
                      <TableRow key={spec.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium text-slate-900">{spec.name}</TableCell>
                        <TableCell className="text-slate-500 hidden sm:table-cell font-mono text-xs">{spec.slug}</TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-sm font-medium">
                            {spec.activeTherapists}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
};

export default FonoSpecialtyPage;
