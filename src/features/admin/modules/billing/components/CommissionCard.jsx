import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Summary card for a commission record
 */
const CommissionCard = ({ commission }) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between">
            <span className="font-semibold">Comisión #{commission?.id}</span>
            <span className="text-green-600">${commission?.amount}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommissionCard;