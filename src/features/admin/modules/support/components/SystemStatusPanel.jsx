/**
 * @file SystemStatusPanel.jsx
 * @description Panel con estado del sistema y métricas de salud.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const StatusRow = ({ label, value, status }) => {
  const isOk = status === 'ok' || status === 'operational';
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-medium tabular-nums">{value}</span>
        {isOk ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <XCircle className="h-3.5 w-3.5 text-red-500" />
        )}
      </div>
    </div>
  );
};

const SystemStatusPanel = ({ health = null, loading = false }) => {
  const isOperational = health?.status === 'operational';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Server className="h-4 w-4 text-slate-500" />
          Estado del Sistema
          {!loading && health && (
            <Badge
              variant="outline"
              className={isOperational
                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400'
              }
            >
              {isOperational ? 'Operativo' : 'Degradado'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
        ) : !health ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sin datos de salud
          </p>
        ) : (
          <>
            <StatusRow
              label="Usuarios totales"
              value={health.total_users}
              status="ok"
            />
            <StatusRow
              label="Suscripciones activas"
              value={health.active_subscriptions}
              status="ok"
            />
            <StatusRow
              label="Tickets abiertos"
              value={health.open_tickets}
              status={health.open_tickets > 10 ? 'warning' : 'ok'}
            />
            <StatusRow
              label="Estado general"
              value={isOperational ? 'OK' : 'Revisar'}
              status={health.status}
            />
          </>
        )}
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to="/admin/support/health">Panel de Salud</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default SystemStatusPanel;
