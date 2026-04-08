/**
 * @file PlansSummaryPanel.jsx
 * @description Panel resumen de planes disponibles para el dashboard billing.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/adminUtils';

const PlansSummaryPanel = ({ plans = [], loading = false }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BadgeCheck className="h-4 w-4 text-blue-500" />
          Planes Disponibles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
        ) : plans.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sin planes configurados
          </p>
        ) : (
          plans.map((plan) => (
            <div
              key={plan.id}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
            >
              <div>
                <p className="font-medium text-sm">{plan.name}</p>
                <p className="text-xs text-muted-foreground">
                  {plan.description || 'Sin descripción'}
                </p>
              </div>
              <span className="font-bold text-sm tabular-nums">
                {formatCurrency(plan.price || 0)}
              </span>
            </div>
          ))
        )}
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to="/admin/billing/plans">Gestionar Planes</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default PlansSummaryPanel;