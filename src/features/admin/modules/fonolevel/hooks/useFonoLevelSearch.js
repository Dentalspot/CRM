import { useState } from 'react';

/**
 * Hook to manage search and filter state for the DentalLevel list.
 * @param {function} onFilterChange - Callback function to execute when filters change.
 * @returns {{filters: object, handleFilterChange: function, handleSearch: function}}
 */
export const useDentalLevelSearch = (onFilterChange) => {
  const [filters, setFilters] = useState({});

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  return {
    filters,
    handleFilterChange,
  };
};