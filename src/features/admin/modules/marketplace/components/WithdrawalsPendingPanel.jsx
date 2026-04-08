/**
 * @file WithdrawalsPendingPanel.jsx
 * @description Panel lateral con retiros pendientes de aprobación.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/adminUtils';

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
};

const WithdrawalsPendingPanel = ({ withdrawals = [], loading = false }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Wallet className="h-4 w-4 text-amber-500" />
          Retiros Pendientes
          {withdrawals.length > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              {withdrawals.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
        ) : withdrawals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sin retiros pendientes
          </p>
        ) : (
          withdrawals.map((w) => (
            <div key={w.id} className="flex items-center justify-between p-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/20">
              <div>
                <p className="font-medium text-sm">{w.author?.full_name || 'Sin nombre'}</p>
                <p className="text-xs text-muted-foreground">{formatDate(w.created_at)}</p>
              </div>
              <span className="font-bold text-sm tabular-nums">
                {formatCurrency(w.amount || 0)}
              </span>
            </div>
          ))
        )}
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to="/admin/marketplace/withdrawals">Gestionar Retiros</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default WithdrawalsPendingPanel;