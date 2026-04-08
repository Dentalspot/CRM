import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Check } from 'lucide-react';

const PlanCard = ({ plan = {} }) => {
  // Placeholder stub
  const { 
    name = "Plan Profesional", 
    price = 29990, 
    interval = "monthly",
    features = ["Feature 1", "Feature 2"],
    isActive = true 
  } = plan;

  return (
    <Card className={`border-l-4 ${isActive ? 'border-l-green-500' : 'border-l-gray-300'}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold mb-4">
          ${price.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/{interval === 'monthly' ? 'mes' : 'año'}</span>
        </div>
        <ul className="space-y-2">
          {features.slice(0, 3).map((f, i) => (
            <li key={i} className="text-sm flex items-center gap-2">
              <Check className="h-3 w-3 text-green-500" /> {f}
            </li>
          ))}
          {features.length > 3 && <li className="text-xs text-muted-foreground">+{features.length - 3} más...</li>}
        </ul>
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="outline" size="sm" className="w-full">
          <Edit className="mr-2 h-3 w-3" /> Editar Plan
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PlanCard;