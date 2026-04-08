/**
 * @file OpenTicketsTable.jsx
 * @description Tabla de tickets abiertos para el dashboard support.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import TicketStatusBadge from './TicketStatusBadge';

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const priorityColors = {
  high:    'text-red-600 font-semibold',
  medium:  'text-amber-600',
  low:     'text-slate-500',
  urgent:  'text-red-700 font-bold',
};

const OpenTicketsTable = ({ tickets = [], loading = false }) => {
  const navigate = useNavigate();

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 py-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Ticket className="h-4 w-4 text-muted-foreground" />
          Tickets Abiertos
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-primary" asChild>
          <Link to="/admin/support/tickets">
            Ver todos <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Ticket className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No hay tickets abiertos</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead>Usuario</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t) => (
                <TableRow
                  key={t.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => navigate(`/admin/support/tickets/${t.id}`)}
                >
                  <TableCell className="font-medium">
                    {t.user?.full_name || t.user?.email || 'Anónimo'}
                  </TableCell>
                  <TableCell>
                    <span className={priorityColors[t.priority] || 'text-slate-500'}>
                      {t.priority || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <TicketStatusBadge status={t.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(t.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default OpenTicketsTable;
