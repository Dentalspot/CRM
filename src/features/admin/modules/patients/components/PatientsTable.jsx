import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

/**
 * Renders a data table for patients
 * @param {object} props - { patients, isLoading, onSort, selectedIds, onToggleSelect }
 */
const PatientsTable = ({ patients = [], isLoading }) => {
  if (isLoading) return <div>Cargando pacientes...</div>;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha Ingreso</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center">No hay pacientes</TableCell>
            </TableRow>
          ) : (
            patients.map(p => (
              <TableRow key={p.id}>
                <TableCell>{p.profile?.full_name || p.profiles?.full_name || 'Desconocido'}</TableCell>
                <TableCell>{p.status}</TableCell>
                <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                <TableCell>...</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PatientsTable;