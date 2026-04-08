import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import useDebounce from '@/hooks/useDebounce';

const SearchArticles = ({ onSearch, placeholder = "Buscar artículos..." }) => {
  const [term, setTerm] = useState('');
  
  const handleSearch = (e) => {
    const value = e.target.value;
    setTerm(value);
    onSearch(value);
  };

  return (
    <div className="relative max-w-md w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={term}
        onChange={handleSearch}
        className="pl-9"
      />
    </div>
  );
};

export default SearchArticles;