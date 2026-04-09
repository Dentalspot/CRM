import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const HeroSearchForm = () => {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (term.trim()) params.set('term', term.trim());
    navigate(`/dentistas${params.toString() ? '?' + params.toString() : ''}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto"
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <Input
          type="text"
          placeholder="Busca por nombre, especialidad o ciudad…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="pl-9 h-12 rounded-xl border-slate-200 bg-white shadow-sm"
        />
      </div>
      <Button
        type="submit"
        size="lg"
        className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm"
      >
        <MapPin className="w-4 h-4 mr-2" />
        Buscar
      </Button>
    </form>
  );
};

export default HeroSearchForm;
