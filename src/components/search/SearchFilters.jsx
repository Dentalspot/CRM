/**
 * @file src/components/search/SearchFilters.jsx
 * 
 * Filtros de búsqueda — Premium Redesign
 * Soporta dos variantes: 'hero' (en el hero) e 'inline' (en la página)
 * 
 * Características:
 * - Diseño adaptable según contexto
 * - Chips de filtros activos
 * - Animaciones suaves
 * - Accesibilidad mejorada
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Loader2,
  X,
  MapPin,
  Stethoscope,
  Monitor,
  SlidersHorizontal
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const SearchFilters = ({
  onSearch,
  initialFilters = {},
  isLoading,
  variant = 'inline' // 'hero' | 'inline'
}) => {
  // State
  const [searchTerm, setSearchTerm] = useState(initialFilters.term || '');
  const [selectedSpecialty, setSelectedSpecialty] = useState(initialFilters.specialty || 'all');
  const [selectedRegion, setSelectedRegion] = useState(initialFilters.region || 'all');
  const [selectedCity, setSelectedCity] = useState(initialFilters.city || 'all');
  const [selectedModality, setSelectedModality] = useState(initialFilters.modality || 'todas');

  // Data
  const [specialties, setSpecialties] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [isFetchingCities, setIsFetchingCities] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      const [{ data: specData }, { data: regData }] = await Promise.all([
        supabase.from('specialties').select('id, name, slug').order('name'),
        supabase.from('regions').select('id, name').order('name'),
      ]);
      if (specData) setSpecialties(specData);
      if (regData) setRegions(regData);
    };
    fetchData();
  }, []);

  // Fetch cities when region changes
  useEffect(() => {
    const fetchCities = async () => {
      if (selectedRegion && selectedRegion !== 'all') {
        setIsFetchingCities(true);
        const { data } = await supabase
          .from('cities')
          .select('id, name')
          .eq('region_id', selectedRegion)
          .order('name');
        setCities(data || []);
        setIsFetchingCities(false);
      } else {
        setCities([]);
        setSelectedCity('all');
      }
    };
    fetchCities();
  }, [selectedRegion]);

  // Sync with external filters
  useEffect(() => {
    setSelectedSpecialty(initialFilters.specialty || 'all');
    setSelectedRegion(initialFilters.region || 'all');
    setSelectedCity(initialFilters.city || 'all');
    setSelectedModality(initialFilters.modality || 'todas');
    setSearchTerm(initialFilters.term || '');
  }, [initialFilters]);

  // Handlers
  const handleSearch = useCallback(() => {
    onSearch({
      term: searchTerm || null,
      specialty: selectedSpecialty === 'all' ? null : selectedSpecialty,
      region: selectedRegion === 'all' ? null : selectedRegion,
      city: selectedCity === 'all' ? null : selectedCity,
      modality: selectedModality === 'todas' ? null : selectedModality,
    });
  }, [searchTerm, selectedSpecialty, selectedRegion, selectedCity, selectedModality, onSearch]);

  const handleClear = () => {
    setSearchTerm('');
    setSelectedSpecialty('all');
    setSelectedRegion('all');
    setSelectedCity('all');
    setSelectedModality('todas');
    onSearch({ term: null, specialty: null, region: null, city: null, modality: null });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Active filters for chips
  const activeFilters = [];
  if (searchTerm) activeFilters.push({ key: 'term', label: searchTerm, clear: () => setSearchTerm('') });
  if (selectedSpecialty !== 'all') {
    const spec = specialties.find(s => String(s.id) === selectedSpecialty);
    activeFilters.push({
      key: 'specialty',
      label: spec?.name || 'Especialidad',
      clear: () => setSelectedSpecialty('all')
    });
  }
  if (selectedRegion !== 'all') {
    const reg = regions.find(r => String(r.id) === selectedRegion);
    activeFilters.push({
      key: 'region',
      label: reg?.name || 'Región',
      clear: () => { setSelectedRegion('all'); setSelectedCity('all'); }
    });
  }
  if (selectedCity !== 'all') {
    const city = cities.find(c => String(c.id) === selectedCity);
    activeFilters.push({
      key: 'city',
      label: city?.name || 'Ciudad',
      clear: () => setSelectedCity('all')
    });
  }
  if (selectedModality !== 'todas') {
    activeFilters.push({
      key: 'modality',
      label: selectedModality === 'online' ? 'Online' : 'Presencial',
      clear: () => setSelectedModality('todas')
    });
  }

  const hasActiveFilters = activeFilters.length > 0;

  // ═══════════════════════════════════════════════════════════
  // HERO VARIANT
  // ═══════════════════════════════════════════════════════════
  if (variant === 'hero') {
    return (
      <div className="space-y-4">
        {/* Main search row */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre, especialidad o patología..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="
                pl-12 h-14 text-base
                bg-slate-50 border-slate-200
                placeholder:text-slate-400
                focus:bg-white focus:border-primary/30 focus:ring-2 focus:ring-primary/10
                rounded-xl transition-all
              "
            />
          </div>

          {/* Search button */}
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            size="lg"
            className="
              h-14 px-8 rounded-xl
              bg-gradient-to-r from-primary to-secondary
              hover:shadow-lg hover:shadow-primary/25
              text-white font-semibold text-base
              transition-all duration-300
            "
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                Buscar
              </>
            )}
          </Button>
        </div>

        {/* Filters row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Specialty */}
          <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
            <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl text-sm">
              <Stethoscope className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Especialidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las especialidades</SelectItem>
              {specialties.map((spec) => (
                <SelectItem key={spec.id} value={String(spec.id)}>
                  {spec.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Region */}
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl text-sm">
              <MapPin className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Región" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las regiones</SelectItem>
              {regions.map((reg) => (
                <SelectItem key={reg.id} value={String(reg.id)}>
                  {reg.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* City */}
          <Select
            value={selectedCity}
            onValueChange={setSelectedCity}
            disabled={selectedRegion === 'all' || isFetchingCities}
          >
            <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl text-sm">
              <SelectValue placeholder={isFetchingCities ? 'Cargando...' : 'Ciudad'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ciudades</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city.id} value={String(city.id)}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Modality */}
          <Select value={selectedModality} onValueChange={setSelectedModality}>
            <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl text-sm">
              <Monitor className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las modalidades</SelectItem>
              <SelectItem value="presencial">Solo Presencial</SelectItem>
              <SelectItem value="online">Solo Online</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // INLINE VARIANT (default)
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="space-y-4">
      {/* Filters grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {/* Search input */}
        <div className="col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="
              pl-10 h-10
              bg-slate-50 border-slate-200
              placeholder:text-slate-400
              focus:bg-white focus:border-primary/30 focus:ring-1 focus:ring-primary/10
              rounded-lg text-sm
            "
          />
        </div>

        {/* Specialty */}
        <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
          <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-lg text-sm">
            <SelectValue placeholder="Especialidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {specialties.map((spec) => (
              <SelectItem key={spec.id} value={String(spec.id)}>
                {spec.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Region */}
        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-lg text-sm">
            <SelectValue placeholder="Región" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {regions.map((reg) => (
              <SelectItem key={reg.id} value={String(reg.id)}>
                {reg.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Modality */}
        <Select value={selectedModality} onValueChange={setSelectedModality}>
          <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-lg text-sm">
            <SelectValue placeholder="Modalidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="presencial">Presencial</SelectItem>
            <SelectItem value="online">Online</SelectItem>
          </SelectContent>
        </Select>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="
              flex-1 h-10 rounded-lg
              bg-gradient-to-r from-primary to-secondary
              hover:shadow-md hover:shadow-primary/20
              text-white font-medium text-sm
            "
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Buscar'
            )}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-10 w-10 rounded-lg text-slate-400 hover:text-slate-600"
              title="Limpiar filtros"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Active filters chips */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 pt-2">
              {activeFilters.map((filter) => (
                <motion.div
                  key={filter.key}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <Badge
                    variant="secondary"
                    className="
                      px-3 py-1.5 rounded-full 
                      bg-primary/10 text-primary border-0
                      hover:bg-primary/20 cursor-pointer
                      flex items-center gap-1.5
                    "
                    onClick={() => {
                      filter.clear();
                      // Auto-search after clearing
                      setTimeout(handleSearch, 0);
                    }}
                  >
                    <span className="text-xs font-medium">{filter.label}</span>
                    <X className="h-3 w-3" />
                  </Badge>
                </motion.div>
              ))}

              {activeFilters.length > 1 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-7 px-3 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Limpiar todo
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchFilters;