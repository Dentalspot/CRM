// Placeholder to fulfill requirement of creating this component if not covered by the page logic directly.
// In this case, the PatientsManagementPage logic could be extracted here for reusability.
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatRut } from '@/lib/patientUtils';

const PatientList = ({ patients, loading }) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>RUT</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={3}>Cargando...</TableCell></TableRow>
          ) : patients.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.profile?.full_name || p.full_name}</TableCell>
              <TableCell>{formatRut(p.profile?.rut || p.rut)}</TableCell>
              <TableCell>
                <Button variant="link" asChild>
                  <Link to={`/admin/patients/${p.id}/demographics`}>Ver</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PatientList;