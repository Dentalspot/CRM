/**
 * @file RecentPatientsTable.jsx
 * @description Tabla de pacientes recientes para el dashboard.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
};

const statusColors = {
  active:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  pending:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const RecentPatientsTable = ({ patients = [], loading = false }) => {
  const navigate = useNavigate();

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 py-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          Pacientes Recientes
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-primary" asChild>
          <Link to="/admin/patients/management">
            Ver todos <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No hay pacientes registrados</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead>Paciente</TableHead>
                <TableHead>Terapeuta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ingreso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => navigate(`/admin/patients/${p.id}`)}
                >
                  <TableCell className="font-medium">
                    {p.profile?.full_name || 'Sin nombre'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.therapist?.full_name || 'Sin asignar'}
                  </TableCell>
                  <TableCell>
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', statusColors[p.status] || statusColors.inactive)}>
                      {p.status || 'Sin estado'}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(p.created_at)}
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

export default RecentPatientsTable;
