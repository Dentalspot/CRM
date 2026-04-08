import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

/**
 * Table listing discount coupons
 */
const CouponsTable = ({ coupons = [] }) => {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Descuento</TableHead>
            <TableHead>Usos</TableHead>
            <TableHead>Expiración</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coupons.length === 0 ? (
            <TableRow><TableCell colSpan={4} className="text-center">No hay cupones</TableCell></TableRow>
          ) : (
            coupons.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-mono">{c.code}</TableCell>
                <TableCell>{c.discount_type === 'percent' ? `${c.value}%` : `$${c.value}`}</TableCell>
                <TableCell>{c.uses_count}/{c.max_uses || '∞'}</TableCell>
                <TableCell>{c.expires_at || 'Nunca'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CouponsTable;