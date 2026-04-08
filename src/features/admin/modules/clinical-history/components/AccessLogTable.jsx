import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';

/**
 * @file AccessLogTable.jsx
 * @description Table displaying the access history for a specific record.
 */
const AccessLogTable = ({ log, isLoading }) => {
  const renderSkeleton = () => (
    Array.from({ length: 3 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell colSpan="4"><Skeleton className="h-4 w-full" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <div className="border rounded-lg bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Fecha y Hora</TableHead>
            <TableHead>Tipo de Acceso</TableHead>
            <TableHead>Dirección IP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? renderSkeleton() : (
            (log && log.length > 0) ? log.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.user_name}</TableCell>
                <TableCell>{new Date(entry.timestamp).toLocaleString()}</TableCell>
                <TableCell>{entry.action}</TableCell>
                <TableCell>{entry.ip_address}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan="4" className="text-center h-24">No hay registros de acceso.</TableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AccessLogTable;