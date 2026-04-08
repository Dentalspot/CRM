import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

/**
 * Panel to configure coupon validity rules
 */
const CouponRulesPanel = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reglas de Aplicación</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Configuración de restricciones (planes específicos, fechas, etc.)</p>
      </CardContent>
    </Card>
  );
};

export default CouponRulesPanel;