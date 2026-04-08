import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import Logo from '@/components/shared/Logo';
import SidebarSearch from './components/SidebarSearch';
import SidebarGroup from './components/SidebarGroup';
import SidebarItem from './components/SidebarItem';
import SidebarFooter from './components/SidebarFooter';

const AdminSidebar = ({ 
  className, 
  collapsed, 
  structure, 
  searchQuery, 
  setSearchQuery, 
  expandedGroups, 
  toggleGroup 
}) => {
  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-card border-r shadow-sm transition-all duration-300",
        collapsed ? "w-[70px]" : "w-64",
        className
      )}
    >
      {/* Brand */}
      <div className={cn("h-16 flex items-center border-b px-4 transition-all", collapsed && "justify-center px-0")}>
        <Link to="/" className="flex items-center gap-2 overflow-hidden">
          {collapsed ? (
            <div className="font-bold text-primary text-xl">F</div> 
          ) : (
            <Logo className="h-8" />
          )}
        </Link>
      </div>

      {/* Search */}
      <SidebarSearch 
        value={searchQuery} 
        onChange={setSearchQuery} 
        collapsed={collapsed} 
      />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-2">
        <div className="space-y-4">
          {structure.length === 0 && !collapsed && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No se encontraron módulos
            </div>
          )}

          {structure.map((item) => {
            // Flattened list (search mode)
            if (item.type === 'item') {
              return (
                <SidebarItem 
                  key={item.key} 
                  {...item} 
                  collapsed={collapsed} 
                />
              );
            }
            
            // Grouped list
            return (
              <SidebarGroup
                key={item.key}
                title={item.label}
                items={item.items}
                expanded={expandedGroups.includes(item.key)}
                onToggle={() => toggleGroup(item.key)}
                collapsed={collapsed}
              />
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <SidebarFooter collapsed={collapsed} />
    </aside>
  );
};

export default AdminSidebar;