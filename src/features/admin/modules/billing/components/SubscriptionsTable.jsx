import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

/**
 * Table component for listing subscriptions
 */
const SubscriptionsTable = ({ subscriptions = [], isLoading }) => {
  if (isLoading) return <div>Cargando suscripciones...</div>;

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Renovación</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center">No hay datos</TableCell></TableRow>
          ) : (
            subscriptions.map(sub => (
              <TableRow key={sub.id}>
                <TableCell>{sub.user_name}</TableCell>
                <TableCell>{sub.plan_name}</TableCell>
                <TableCell>{sub.status}</TableCell>
                <TableCell>{sub.next_billing_date}</TableCell>
                <TableCell>...</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default SubscriptionsTable;