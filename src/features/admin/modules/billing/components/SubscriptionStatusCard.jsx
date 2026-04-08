import React from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';

/**
 * Card showing status summary of a subscription
 */
const SubscriptionStatusCard = ({ status, details }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <CardTitle className="text-sm font-medium text-muted-foreground">Estado</CardTitle>
        <div className="text-2xl font-bold mt-2 capitalize">{status}</div>
        <p className="text-xs text-muted-foreground mt-1">{details}</p>
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatusCard;