import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLOR_MAP = {
  blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400',
  green: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
  amber: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400',
  rose: 'text-rose-600 bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400',
  purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400',
};

const DentalLevelMetricsCard = ({ title, value, icon: Icon, color = 'rose', loading = false, subtitle, alert }) => (
  <Card className="overflow-hidden">
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-2" /> : <p className="text-2xl font-bold">{value}</p>}
          {subtitle && !loading && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {Icon && <div className={cn('p-2.5 rounded-full', COLOR_MAP[color])}><Icon className="h-4 w-4" /></div>}
      </div>
      {alert && !loading && <Badge variant="destructive" className="mt-3 text-[10px]">{alert}</Badge>}
    </CardContent>
  </Card>
);

export default DentalLevelMetricsCard;
