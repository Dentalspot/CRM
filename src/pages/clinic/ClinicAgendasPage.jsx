/**
 * @file src/pages/clinic/ClinicAgendasPage.jsx
 *
 * STUB — Agenda consolidada del dashboard de clínica.
 *
 * Spec futuro: `clinic-dashboard-sections-expansion` Phase B2
 * - Filtro por dentista (dropdown con dentistas activos de la clínica)
 * - Vista calendario reutilizando componentes de therapist CalendarPage
 * - Botón "Nueva cita" asigna dentista default
 * - Agenda por box diferido a spec `create-clinical-boxes-table-and-enforcement`
 *
 * Por ahora placeholder con mensaje "Próximamente" para establecer el shape
 * del sidebar + routing. Activar la UI real es el siguiente micro-bloque
 * después de cerrar spec 023.
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, UserCheck, Grid3x3 } from 'lucide-react';

const ClinicAgendasPage = () => {
  return (
    <>
      <Helmet>
        <title>Agendas | DentalSpot</title>
      </Helmet>

      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Agendas</h1>
          <p className="text-muted-foreground mt-1">
            Vista consolidada de todas las citas de tu clínica.
          </p>
        </div>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calendar className="h-6 w-6 text-primary" />
              Próximamente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Estamos trabajando en dos vistas de agenda para clínica:
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="border rounded-lg p-4 bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Agenda por dentista</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Filtrá por dentista de tu equipo y revisá todas sus citas en un solo calendario.
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                  <Grid3x3 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Agenda por box (sillón)</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Requiere habilitar la gestión de sillones (módulo diferido).
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic pt-2 border-t">
              Por ahora podés gestionar citas desde el panel de cada dentista. Agenda unificada disponible en próxima versión.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ClinicAgendasPage;
