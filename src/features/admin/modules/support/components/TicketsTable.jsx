import React from 'react';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';

/**
 * Table component for listing support tickets.
 * Displays subject, requester, status, and priority.
 */
const TicketsTable = ({ tickets = [] }) => (
  <Table>
    <TableHeader><TableRow>
      <TableCell>ID</TableCell>
      <TableCell>Asunto</TableCell>
      <TableCell>Estado</TableCell>
    </TableRow></TableHeader>
    <TableBody>
      {tickets.map(t => <TableRow key={t.id}><TableCell>{t.id}</TableCell></TableRow>)}
    </TableBody>
  </Table>
);
export default TicketsTable;