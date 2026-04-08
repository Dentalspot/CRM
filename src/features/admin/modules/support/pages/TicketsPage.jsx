import React from 'react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import TicketsTable from '../components/TicketsTable';
import { useSupportTickets } from '../hooks/useSupportTickets';

/**
 * Ticket management page.
 */
const TicketsPage = () => {
  const { tickets } = useSupportTickets({});
  
  return (
    <PermissionGuard module="support" action="read">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Tickets de Soporte</h1>
        <TicketsTable tickets={tickets} />
      </div>
    </PermissionGuard>
  );
};

export default TicketsPage;