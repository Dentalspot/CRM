import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Search, 
  Filter, 
  Star, 
  Save, 
  History, 
  X,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { saveSearch, getSavedSearches, deleteSavedSearch } from '../api/searchApi';
import logger from '@/lib/utils/logger';
import { MARKETPLACE_CONFIG } from '@/lib/constants/marketplace';

const AdvancedSearch = ({ onSearch }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Search State
  const [keyword, setKeyword] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    minPrice: 0,
    maxPrice: 100000,
    minRating: 0,
    sort: 'newest'
  });
  
  // UI State
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [isSavePopoverOpen, setIsSavePopoverOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleTriggerSearch();
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword, filters]);

  // Load saved searches on mount
  useEffect(() => {
    if (user) {
      loadSavedSearches();
    }
  }, [user]);

  const loadSavedSearches = async () => {
    try {
      const data = await getSavedSearches(user.id);
      setSavedSearches(data);
    } catch (error) {
      logger.error("Failed to load saved searches", error);
    }
  };

  const handleTriggerSearch = () => {
    onSearch({
      search: keyword,
      ...filters
    });
  };

  const handleClearFilters = () => {
    setKeyword('');
    setFilters({
      type: 'all',
      minPrice: 0,
      maxPrice: 100000,
      minRating: 0,
      sort: 'newest'
    });
  };

  const handleSaveSearch = async () => {
    if (!searchName.trim()) {
      toast({ title: "Ingresa un nombre para la búsqueda", variant: "destructive" });
      return;
    }
    try {
      await saveSearch(user.id, searchName, { search: keyword, ...filters });
      toast({ title: "Búsqueda guardada" });
      setSearchName('');
      setIsSavePopoverOpen(false);
      loadSavedSearches();
    } catch (error) {
      toast({ title: "Error al guardar búsqueda", variant: "destructive" });
    }
  };

  const handleLoadSavedSearch = (search) => {
    setKeyword(search.filters.search || '');
    setFilters({
      type: search.filters.type || 'all',
      minPrice: search.filters.minPrice || 0,
      maxPrice: search.filters.maxPrice || 100000,
      minRating: search.filters.minRating || 0,
      sort: search.filters.sort || 'newest'
    });
    // Trigger is handled by useEffect
  };

  const handleDeleteSavedSearch = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteSavedSearch(id);
      loadSavedSearches();
      toast({ title: "Búsqueda eliminada" });
    } catch (error) {
      toast({ title: "Error al eliminar", variant: "destructive" });
    }
  };

  const activeFiltersCount = [
    filters.type !== 'all',
    filters.minRating > 0,
    filters.minPrice > 0 || filters.maxPrice < 100000
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input 
            placeholder="Buscar por título, descripción o palabras clave..." 
            className="pl-10 h-11 bg-white shadow-sm border-gray-200" 
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          {keyword && (
            <button 
              onClick={() => setKeyword('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {/* Saved Searches Dropdown */}
          {user && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-11 px-3 border-dashed" title="Búsquedas guardadas">
                  <History className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Guardadas</span>
                  <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-2">
                <h4 className="text-sm font-medium mb-2 px-2">Mis Búsquedas</h4>
                {savedSearches.length === 0 ? (
                  <p className="text-xs text-gray-500 px-2 py-2">No tienes búsquedas guardadas.</p>
                ) : (
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {savedSearches.map(search => (
                      <div 
                        key={search.id} 
                        className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-md cursor-pointer group"
                        onClick={() => handleLoadSavedSearch(search)}
                      >
                        <span className="text-sm truncate flex-1">{search.name}</span>
                        <button 
                          onClick={(e) => handleDeleteSavedSearch(e, search.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>
          )}

          <Button 
            variant={isFiltersOpen ? "secondary" : "outline"}
            className={`h-11 gap-2 ${activeFiltersCount > 0 ? 'border-teal-200 bg-teal-50 text-teal-700' : ''}`}
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-teal-200 text-teal-800 ml-1 px-1.5 h-5">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Expanded Filters Panel */}
      {isFiltersOpen && (
        <div className="bg-white p-5 rounded-xl border shadow-sm animate-in slide-in-from-top-2">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            
            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tipo de Producto</label>
              <Select value={filters.type} onValueChange={(val) => setFilters(prev => ({ ...prev, type: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="plan">Planes de Tratamiento</SelectItem>
                  <SelectItem value="activity">Actividades</SelectItem>
                  <SelectItem value="resource">Material Educativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-gray-700">Precio</label>
                <span className="text-xs text-gray-500">
                  ${filters.minPrice} - ${filters.maxPrice >= 100000 ? '100k+' : filters.maxPrice}
                </span>
              </div>
              <Slider 
                value={[filters.minPrice, filters.maxPrice]} 
                min={0} 
                max={100000} 
                step={1000} 
                minStepsBetweenThumbs={1}
                onValueChange={(vals) => setFilters(prev => ({ ...prev, minPrice: vals[0], maxPrice: vals[1] }))}
                className="py-2"
              />
            </div>

            {/* Rating Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Valoración Mínima</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, minRating: prev.minRating === star ? 0 : star }))}
                    className={`p-1 rounded-md transition-all ${
                      filters.minRating >= star ? 'text-yellow-400 scale-110' : 'text-gray-300 hover:text-gray-400'
                    }`}
                  >
                    <Star className={`h-6 w-6 ${filters.minRating >= star ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 h-4">
                {filters.minRating > 0 ? `${filters.minRating} estrellas o más` : 'Cualquier valoración'}
              </p>
            </div>

            {/* Sorting */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Ordenar por</label>
              <Select value={filters.sort} onValueChange={(val) => setFilters(prev => ({ ...prev, sort: val }))}>
                <SelectTrigger>
                  <ArrowUpDown className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Más Recientes</SelectItem>
                  <SelectItem value="popular">Más Populares</SelectItem>
                  <SelectItem value="highest_rated">Mejor Valorados</SelectItem>
                  <SelectItem value="lowest_price">Menor Precio</SelectItem>
                  <SelectItem value="highest_price">Mayor Precio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <Button variant="ghost" className="text-sm text-gray-500 hover:text-gray-900" onClick={handleClearFilters}>
              Limpiar todo
            </Button>

            <div className="flex gap-3">
              {user && (
                <Popover open={isSavePopoverOpen} onOpenChange={setIsSavePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Save className="h-4 w-4" />
                      Guardar Búsqueda
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="end">
                    <div className="space-y-3">
                      <h4 className="font-medium">Guardar filtros actuales</h4>
                      <Input 
                        placeholder="Nombre de la búsqueda (ej: Planes de Voz)" 
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsSavePopoverOpen(false)}>Cancelar</Button>
                        <Button size="sm" onClick={handleSaveSearch}>Guardar</Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;