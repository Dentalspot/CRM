import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

/**
 * Table listing therapist commissions
 */
const CommissionsTable = ({ commissions = [] }) => {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Terapeuta</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow><TableCell colSpan={4} className="text-center">No hay comisiones</TableCell></TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default CommissionsTable;