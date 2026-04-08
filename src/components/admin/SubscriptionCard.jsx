import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';

const SubscriptionCard = ({ subscription = {} }) => {
  // Placeholder stub
  const { 
    user_name = "Usuario Desconocido", 
    plan_name = "Plan Básico", 
    status = "active",
    amount = 0 
  } = subscription;

  const statusColors = {
    active: 'bg-green-500',
    past_due: 'bg-amber-500',
    canceled: 'bg-red-500',
    trialing: 'bg-blue-500'
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <h3 className="font-semibold">{user_name}</h3>
          <p className="text-sm text-muted-foreground">{plan_name}</p>
        </div>
        <Badge variant="secondary" className={statusColors[status] || 'bg-gray-500'}>
          {status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">${amount}/mes</div>
        <p className="text-xs text-muted-foreground">Próximo cobro: 15 Oct, 2023</p>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button variant="ghost" size="sm" className="w-full">
          <MoreHorizontal className="mr-2 h-4 w-4" /> Gestionar
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SubscriptionCard;