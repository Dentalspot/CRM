/**
 * @file src/features/clinic-dashboard/ClinicAdminCalendarPage.jsx
 *
 * Página del clinic_admin en `/dashboard/clinic/agendas`.
 * Wrapper fino que delega en `OrgCalendarView` con scope='clinic_admin'.
 *
 * Reemplaza a `ClinicAgendasPage.jsx` (vista lista día-por-día, legacy de
 * spec 023 Phase B). La vista lista se elimina en Polish task T011.
 *
 * Spec 025: clinic-admin-rich-calendar. Heredado íntegramente del spec 024
 * (AssistantCalendarPage) solo cambiando el prop scope — el componente
 * `OrgCalendarView` es agnóstico al role y solo lo usa para detalles menores
 * del header (label "Vista recepción" vs "Vista administrativa").
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { AlertCircle, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import useCurrentOrganization from '@/hooks/useCurrentOrganization';
import { supabase } from '@/lib/supabaseClient';

import OrgCalendarView from '@/components/calendar/OrgCalendarView';

const ClinicAdminCalendarPage = () => {
  const { currentOrganizationId, currentOrganization, loading: orgLoading } = useCurrentOrganization();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // Guard: admin sin organización activa → mensaje claro + CTA logout
  // (análogo al pattern de AssistantCalendarPage, spec 024)
  if (!orgLoading && !currentOrganizationId) {
    return (
      <>
        <Helmet>
          <title>Agendas | DentalSpot</title>
        </Helmet>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
          <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sin clínica activa</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Esta cuenta no tiene acceso activo a ninguna clínica.
            Si esto es un error, contacta a soporte.
          </p>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Agendas | {currentOrganization?.name || 'DentalSpot'}</title>
      </Helmet>
      <OrgCalendarView scope="clinic_admin" organizationId={currentOrganizationId} />
    </>
  );
};

export default ClinicAdminCalendarPage;
