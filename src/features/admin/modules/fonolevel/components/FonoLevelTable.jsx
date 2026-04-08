import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

/**
 * Displays a list of therapists and their DentalLevel data.
 * @param {{therapists: Array, isLoading: boolean}} props
 */
const DentalLevelTable = ({ therapists, isLoading }) => {
  if (isLoading) return <div>Cargando niveles...</div>;
  
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Terapeuta</TableHead>
            <TableHead>Nivel</TableHead>
            <TableHead>Puntaje Global</TableHead>
            <TableHead>Insignias</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {therapists.length === 0 ? (
            <TableRow><TableCell colSpan="5" className="text-center">No hay datos</TableCell></TableRow>
          ) : (
            therapists.map(t => (
              <TableRow key={t.id}>
                <TableCell>{t.name}</TableCell>
                <TableCell>{t.level_name}</TableCell>
                <TableCell>{t.global_score}</TableCell>
                <TableCell>{t.badges?.length || 0}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/admin/dentallevel/${t.id}`}>Ver Detalle</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DentalLevelTable;