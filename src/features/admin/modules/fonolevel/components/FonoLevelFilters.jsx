import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * Filter controls for the DentalLevel list page.
 */
const DentalLevelFilters = ({ onSearch, onFilterChange }) => {
  return (
    <div className="flex gap-4 p-4 border rounded-lg bg-card">
      <Input placeholder="Buscar por terapeuta..." onChange={(e) => onSearch(e.target.value)} />
      {/* More complex filters would go here */}
      <Button>Aplicar Filtros</Button>
    </div>
  );
};

export default DentalLevelFilters;