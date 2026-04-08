import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * Filter bar for billing lists
 */
const BillingFilters = ({ onSearch, onFilter }) => {
  return (
    <div className="flex gap-4 mb-4">
      <Input placeholder="Buscar..." className="max-w-sm" onChange={(e) => onSearch(e.target.value)} />
      <Button variant="outline" onClick={onFilter}>Filtros Avanzados</Button>
    </div>
  );
};

export default BillingFilters;