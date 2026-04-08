import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const SidebarItem = ({ icon: Icon, label, routes = [], badge, collapsed }) => {
  // Use the first route as the main link
  const mainRoute = routes[0] || '#';

  const content = (
    <NavLink
      to={mainRoute}
      end
      className={({ isActive }) => cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isActive ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", collapsed && "h-5 w-5")} />
      
      {!collapsed && (
        <span className="truncate flex-1">{label}</span>
      )}
      
      {!collapsed && badge && (
        <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0.5 h-5">
          {badge}
        </Badge>
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {label}
            {badge && <Badge variant="secondary" className="text-[10px] h-4 px-1">{badge}</Badge>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};

export default SidebarItem;