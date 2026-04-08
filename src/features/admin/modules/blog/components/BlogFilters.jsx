import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RotateCcw } from 'lucide-react';
import { useBlogCategories } from '../hooks/useBlogCategories';

const BlogFilters = ({ filters, onFilterChange, onSearchChange, searchTerm }) => {
  const { categories } = useBlogCategories();

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 bg-card p-4 rounded-lg border">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar artículos..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <div className="flex gap-2">
        <Select 
          value={filters.status || 'all'} 
          onValueChange={(val) => onFilterChange({ status: val === 'all' ? undefined : val })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="published">Publicado</SelectItem>
            <SelectItem value="draft">Borrador</SelectItem>
            <SelectItem value="pending_review">En Revisión</SelectItem>
            <SelectItem value="archived">Archivado</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.categoryId || 'all'} 
          onValueChange={(val) => onFilterChange({ categoryId: val === 'all' ? undefined : val })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => {
            onFilterChange({ status: undefined, categoryId: undefined });
            onSearchChange('');
          }}
          title="Resetear filtros"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default BlogFilters;