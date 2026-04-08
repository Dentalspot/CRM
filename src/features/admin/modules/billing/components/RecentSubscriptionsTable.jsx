/**
 * @file RecentSubscriptionsTable.jsx
 * @description Tabla de suscripciones recientes para el dashboard billing.
 * Componente presentacional — recibe data vía props.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Receipt, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/adminUtils';
import BillingStatusBadge from './BillingStatusBadge';

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const RecentSubscriptionsTable = ({ subscriptions = [], loading = false }) => {
  const navigate = useNavigate();

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 py-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          Suscripciones Recientes
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-primary" asChild>
          <Link to="/admin/billing/subscriptions">
            Ver todas <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="p-0 flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Receipt className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No hay suscripciones registradas</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead>Terapeuta</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow
                  key={sub.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => navigate(`/admin/billing/subscriptions/${sub.id}`)}
                >
                  <TableCell className="font-medium">
                    {sub.therapist?.full_name || 'Sin nombre'}
                  </TableCell>
                  <TableCell>{sub.plan_name || '—'}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatCurrency(sub.price || 0)}
                  </TableCell>
                  <TableCell>
                    <BillingStatusBadge status={sub.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(sub.created_at)}
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

export default RecentSubscriptionsTable;