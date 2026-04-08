import React from 'react';
import PaymentStatusBadge from '@/components/admin/PaymentStatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const PaymentHistoryPage = () => {
  return (
<div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>Transacciones Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-xs">#PAY-1234</TableCell>
                    <TableCell>Juan Pérez</TableCell>
                    <TableCell>$29.990</TableCell>
                    <TableCell><PaymentStatusBadge status="succeeded" /></TableCell>
                    <TableCell>12 Oct, 2023</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-xs">#PAY-1235</TableCell>
                    <TableCell>Ana Silva</TableCell>
                    <TableCell>$29.990</TableCell>
                    <TableCell><PaymentStatusBadge status="failed" /></TableCell>
                    <TableCell>11 Oct, 2023</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
    </div>
  );
};

export default PaymentHistoryPage;