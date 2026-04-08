import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

/**
 * Detailed view of a transaction
 */
const TransactionDetailsCard = ({ transaction }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalle de Transacción</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <span className="text-sm text-muted-foreground">ID Referencia</span>
                <p>{transaction?.id}</p>
            </div>
            <div>
                <span className="text-sm text-muted-foreground">Pasarela</span>
                <p>MercadoPago</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionDetailsCard;