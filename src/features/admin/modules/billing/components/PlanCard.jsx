import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

/**
 * Card display for a plan summary
 */
const PlanCard = ({ plan }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{plan?.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">${plan?.price}</div>
        <p className="text-sm text-muted-foreground">/{plan?.interval}</p>
      </CardContent>
    </Card>
  );
};

export default PlanCard;