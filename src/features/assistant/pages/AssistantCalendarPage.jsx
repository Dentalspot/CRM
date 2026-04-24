/**
 * @file src/features/assistant/pages/AssistantCalendarPage.jsx
 *
 * Página del asistente en `/dashboard/assistant/agenda`.
 * Wrapper fino que delega en `OrgCalendarView` con scope='assistant'.
 *
 * Reemplaza a `AssistantAgendaPage.jsx` (vista lista día-por-día).
 *
 * Ver spec 024: specs/024-assistant-rich-calendar/
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { AlertCircle, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import useCurrentOrganization from '@/hooks/useCurrentOrganization';
import { supabase } from '@/lib/supabaseClient';

import OrgCalendarView from '@/components/calendar/OrgCalendarView';

const AssistantCalendarPage = () => {
  const { currentOrganizationId, currentOrganization, loading: orgLoading } = useCurrentOrganization();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // Guard: sin organización activa → mensaje claro + CTA logout
  // (Spec 023 followup #3: post-revoke UX)
  if (!orgLoading && !currentOrganizationId) {
    return (
      <>
        <Helmet>
          <title>Agenda | DentalSpot</title>
        </Helmet>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
          <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sin acceso a clínica</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Esta cuenta no tiene acceso activo a ninguna clínica.
            Si esto es un error, contactá al administrador de la clínica.
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
        <title>Agenda | {currentOrganization?.name || 'DentalSpot'}</title>
      </Helmet>
      <OrgCalendarView scope="assistant" organizationId={currentOrganizationId} />
    </>
  );
};

export default AssistantCalendarPage;
