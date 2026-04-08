import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

/**
 * Table showing the requirements for each DentalLevel.
 * @param {{levels: Array}} props
 */
const LevelRequirementsTable = ({ levels = [] }) => {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nivel</TableHead>
            <TableHead>Puntaje Mínimo</TableHead>
            <TableHead>Requisitos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {levels.map(level => (
            <TableRow key={level.id}>
              <TableCell>{level.name}</TableCell>
              <TableCell>{level.min_score}</TableCell>
              <TableCell>{level.requirements_summary}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LevelRequirementsTable;