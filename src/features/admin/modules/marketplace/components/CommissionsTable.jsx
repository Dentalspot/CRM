import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
const CommissionsTable = ({ commissions = [] }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Terapeuta</TableHead>
        <TableHead>Monto</TableHead>
        <TableHead>Estado</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody><TableRow><TableCell colSpan={3}>No data</TableCell></TableRow></TableBody>
  </Table>
);
export default CommissionsTable;