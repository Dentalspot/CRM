import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

/**
 * Table component for payments history
 */
const PaymentsTable = ({ payments = [], isLoading }) => {
  if (isLoading) return <div>Cargando pagos...</div>;

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID Pago</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Método</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center">No hay pagos</TableCell></TableRow>
          ) : (
            payments.map(pay => (
              <TableRow key={pay.id}>
                <TableCell>{pay.id}</TableCell>
                <TableCell>${pay.amount}</TableCell>
                <TableCell>{pay.status}</TableCell>
                <TableCell>{pay.created_at}</TableCell>
                <TableCell>{pay.method}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PaymentsTable;