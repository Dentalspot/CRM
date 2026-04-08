/**
 * @file ActiveIncidentsPanel.jsx
 * @description Panel lateral con incidentes activos.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import IncidentStatusBadge from './IncidentStatusBadge';

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const ActiveIncidentsPanel = ({ incidents = [], loading = false }) => {
  const active = incidents.filter(i => i.status !== 'resolved');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          Incidentes
          {active.length > 0 && (
            <Badge variant="destructive" className="text-[10px]">{active.length} activos</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
        ) : incidents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sin incidentes registrados
          </p>
        ) : (
          incidents.slice(0, 4).map((inc) => (
            <Link
              key={inc.id}
              to={`/admin/support/incidents/${inc.id}`}
              className="block p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-sm truncate">
                  {inc.title || `Incidente #${inc.id?.slice(0, 8)}`}
                </p>
                <IncidentStatusBadge status={inc.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {inc.creator?.full_name || 'Sistema'}
                </span>
                <span className="text-xs text-muted-foreground">{formatDate(inc.created_at)}</span>
              </div>
            </Link>
          ))
        )}
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to="/admin/support/incidents">Ver Incidentes</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ActiveIncidentsPanel;
