import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const DashboardCard = ({ 
  icon: Icon, 
  title, 
  value, 
  description, 
  loading, 
  link, 
  color = "blue",
  delay = 0 
}) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
    pink: "bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400",
  };

  const Content = (
    <div className="relative overflow-hidden">
      <div className="p-6 flex items-start justify-between">
        <div className="space-y-4 w-full">
          <div className={cn("p-2.5 w-fit rounded-lg", colorClasses[color])}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <h3 className="text-3xl font-bold tracking-tight mt-1">{value}</h3>
            )}
            {description && !loading && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        {link && (
          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className={cn(
        "h-full border-muted/60 shadow-sm transition-all duration-300 hover:shadow-md",
        link && "group hover:border-primary/50 cursor-pointer"
      )}>
        {link ? (
          <Link to={link}>{Content}</Link>
        ) : (
          Content
        )}
      </Card>
    </motion.div>
  );
};

export default DashboardCard;