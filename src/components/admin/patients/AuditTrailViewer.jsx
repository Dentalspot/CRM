import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AuditTrailViewer = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return <div className="text-sm text-muted-foreground p-4 text-center">No hay registros de auditoría disponibles.</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Fecha/Hora</TableHead>
            <TableHead>Acción</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Detalles</TableHead>
            <TableHead className="text-right">IP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-mono text-xs">
                {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: es })}
              </TableCell>
              <TableCell className="capitalize badge-cell">
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                  {log.action}
                </span>
              </TableCell>
              <TableCell>{log.user_name || log.user_id}</TableCell>
              <TableCell className="max-w-[200px] truncate text-xs" title={JSON.stringify(log.details)}>
                {JSON.stringify(log.details)}
              </TableCell>
              <TableCell className="text-right font-mono text-xs">{log.ip_address}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AuditTrailViewer;