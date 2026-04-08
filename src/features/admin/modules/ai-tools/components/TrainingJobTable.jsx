import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/**
 * Table listing active and past training jobs.
 */
const TrainingJobTable = ({ jobs = [] }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Job ID</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Modelo Base</TableHead>
          <TableHead>Duración</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={4} className="text-center">No hay trabajos activos</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

export default TrainingJobTable;