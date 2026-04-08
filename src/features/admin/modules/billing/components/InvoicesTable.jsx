import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

/**
 * Table listing generated invoices
 */
const InvoicesTable = ({ invoices = [] }) => {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Folio</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Emisión</TableHead>
            <TableHead>PDF</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow><TableCell colSpan={5} className="text-center">No hay facturas</TableCell></TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default InvoicesTable;