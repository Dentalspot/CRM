/**
 * @file CouponsSummaryPanel.jsx
 * @description Panel resumen de cupones para el dashboard billing.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/adminUtils';

const CouponsSummaryPanel = ({ coupons = { data: [], count: 0 }, loading = false }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Ticket className="h-4 w-4 text-purple-500" />
          Cupones
          {coupons.count > 0 && (
            <Badge variant="secondary" className="text-xs">{coupons.count}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
        ) : coupons.data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sin cupones activos
          </p>
        ) : (
          coupons.data.slice(0, 3).map((coupon) => (
            <div
              key={coupon.id}
              className="flex items-center justify-between p-2 rounded border"
            >
              <div>
                <code className="text-xs font-mono font-bold">{coupon.code}</code>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {coupon.discount_type === 'percentage'
                    ? `${coupon.discount_value}%`
                    : formatCurrency(coupon.discount_value)}
                  {coupon.is_active ? '' : ' (inactivo)'}
                </p>
              </div>
              <Badge
                variant={coupon.is_active ? 'default' : 'secondary'}
                className="text-[10px]"
              >
                {coupon.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          ))
        )}
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to="/admin/billing/coupons">Gestionar Cupones</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default CouponsSummaryPanel;