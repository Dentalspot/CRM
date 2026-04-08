import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

const SalesTable = ({ sales = [], onAction }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>ID</TableHead>
        <TableHead>Cliente</TableHead>
        <TableHead>Total</TableHead>
        <TableHead>Fecha</TableHead>
        <TableHead>Acciones</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {sales.length === 0 ? (
        <TableRow><TableCell colSpan={5}>No hay ventas</TableCell></TableRow>
      ) : (
        sales.map(sale => (
          <TableRow key={sale.id}>
            <TableCell>{sale.id}</TableCell>
            <TableCell>{sale.customer_name}</TableCell>
            <TableCell>${sale.amount}</TableCell>
            <TableCell>{sale.created_at}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm" onClick={() => onAction('view', sale)}>Ver</Button>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
);
export default SalesTable;