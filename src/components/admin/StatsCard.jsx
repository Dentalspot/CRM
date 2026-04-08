import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const StatsCard = ({ title, value, icon: Icon, trend, trendValue, description, className, color = "blue" }) => {
  const colorStyles = {
    blue: "text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400",
    green: "text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400",
    amber: "text-amber-600 bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400",
    purple: "text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400",
    red: "text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400",
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-full", colorStyles[color])}>
          {Icon && <Icon className="h-4 w-4" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(trend || description) && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {trend && (
              <span className={cn(
                "font-medium",
                trend === 'up' ? "text-green-600" : "text-red-600"
              )}>
                {trend === 'up' ? '↑' : '↓'} {trendValue}
              </span>
            )}
            <span>{description}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;