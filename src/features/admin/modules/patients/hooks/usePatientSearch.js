import { useState } from 'react';

/**
 * Hook for handling patient search state and debouncing
 * @returns {object} { query, setQuery, results, isSearching }
 */
export const usePatientSearch = () => {
  const [query, setQuery] = useState('');
  
  return {
    query,
    setQuery,
    results: [],
    isSearching: false
  };
};