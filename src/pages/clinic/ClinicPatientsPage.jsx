/**
 * @file src/pages/clinic/ClinicPatientsPage.jsx
 *
 * STUB — Gestión de pacientes del dashboard de clínica.
 *
 * Spec futuro: `clinic-dashboard-sections-expansion` Phase B3
 * - Listado de pacientes de la organización (scopeado por organization_id,
 *   no por therapist_id como en el flow actual de dentista)
 * - Acciones admin-level: crear paciente, editar contacto, agendar cita
 * - Vista detalle limitada a info admin — NO ficha clínica detallada
 *   (Ley 20.584 art. 12 — clinic_admin requiere exceptional_access_grant
 *   para ver clinical_history, odontograms, treatments)
 * - RLS ya lo soporta via pat_admin_select/insert/update policies
 *
 * Por ahora placeholder con mensaje "Próximamente" + explicación del alcance
 * legal (admin-level, no clínico) para claridad del user.
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle2, XCircle, Shield } from 'lucide-react';

const ClinicPatientsPage = () => {
  return (
    <>
      <Helmet>
        <title>Pacientes | DentalSpot</title>
      </Helmet>

      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Pacientes</h1>
          <p className="text-muted-foreground mt-1">
            Gestión administrativa de los pacientes de tu clínica.
          </p>
        </div>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="h-6 w-6 text-primary" />
              Próximamente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-muted-foreground">
              Desde esta sección vas a poder gestionar el listado de pacientes de tu clínica con funciones administrativas.
            </p>

            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm text-gray-900 flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Qué vas a poder hacer
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Ver listado completo de pacientes de la clínica</li>
                  <li>Crear y editar información de contacto (nombre, email, teléfono)</li>
                  <li>Agendar citas con cualquier dentista del equipo</li>
                  <li>Filtrar por dentista asignado</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-900 flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Qué NO vas a poder hacer
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Ver fichas clínicas detalladas, diagnósticos o tratamientos</li>
                  <li>Ver odontograma, radiografías o notas del dentista</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 mt-4">
                <Shield className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  <strong>Ley 20.584 art. 12:</strong> el acceso de personal no-sanitario a información clínica detallada requiere consent explícito del paciente. Como admin de la clínica, tu acceso está limitado a datos administrativos necesarios para la gestión.
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic pt-3 border-t">
              Por ahora podés gestionar pacientes desde el perfil de cada dentista. Vista consolidada disponible en próxima versión.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ClinicPatientsPage;
