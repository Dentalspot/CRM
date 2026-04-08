import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const SidebarSearch = ({ value, onChange, collapsed }) => {
  if (collapsed) {
    return (
      <div className="flex justify-center py-2">
        <button 
          className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground"
          onClick={() => {/* Expand sidebar logic could go here */}}
          aria-label="Buscar"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar módulo..."
          className="pl-8 h-9 bg-background/50 border-input/50 focus:bg-background transition-all"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default SidebarSearch;