import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import ComplianceStatusBadge from './ComplianceStatusBadge';

/**
 * @file ClinicalHistoryTable.jsx
 * @description Reusable table to display a list of clinical history records.
 */
const ClinicalHistoryTable = ({ records, isLoading }) => {
  const renderSkeleton = () => (
    Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <div className="border rounded-lg bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Paciente</TableHead>
            <TableHead>Terapeuta</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo de Registro</TableHead>
            <TableHead>Estado Cumplimiento</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? renderSkeleton() : (
            (records && records.length > 0) ? records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.patient?.profiles?.full_name || 'N/A'}</TableCell>
                <TableCell>{record.therapist?.full_name || 'N/A'}</TableCell>
                <TableCell>{new Date(record.entry_date).toLocaleDateString()}</TableCell>
                <TableCell>{record.entry_type}</TableCell>
                <TableCell><ComplianceStatusBadge status={record.compliance_status || 'pending_review'} /></TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem asChild><Link to={`/admin/clinical-history/${record.id}`}>Ver Detalle</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to={`/admin/clinical-history/${record.id}/access-log`}>Historial de Accesos</Link></DropdownMenuItem>
                      <DropdownMenuItem>Exportar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan="6" className="text-center h-24">No hay registros para mostrar.</TableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ClinicalHistoryTable;