import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import OrganizationSelector from '@/components/dashboard/OrganizationSelector';

const DashboardHeader = ({ title, subtitle, children, onMenuToggle }) => {
  return (
    <div className="space-y-4 px-4 py-4 md:px-8 bg-background border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onMenuToggle && (
            <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuToggle}>
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            {subtitle && (
              <p className="text-muted-foreground text-sm">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <OrganizationSelector />
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;