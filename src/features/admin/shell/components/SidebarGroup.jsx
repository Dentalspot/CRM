import React from 'react';
import { ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import SidebarItem from './SidebarItem';

const SidebarGroup = ({ title, items, expanded, onToggle, collapsed }) => {
  // If sidebar is collapsed, we don't show groups as collapsible, just list items with separators
  if (collapsed) {
    return (
      <div className="flex flex-col gap-1 py-2">
        <Separator className="my-1 w-8 mx-auto" />
        {items.map(({ key, ...rest }) => (
          <SidebarItem key={key} {...rest} collapsed={true} />
        ))}
      </div>
    );
  }

  return (
    <Collapsible open={expanded} onOpenChange={onToggle} className="space-y-1">
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 hover:bg-accent/50 hover:text-accent-foreground transition-colors",
          )}
        >
          <span className="flex items-center gap-2">
            {title}
          </span>
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-1 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        {items.map(({ key, ...rest }) => (
          <SidebarItem key={key} {...rest} collapsed={false} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default SidebarGroup;