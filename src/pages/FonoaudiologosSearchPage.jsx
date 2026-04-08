
/**
 * @file src/pages/DentistasSearchPage.jsx
 * 
 * Búsqueda de dentistas — Estilo Doctoralia + Sistema de Insignias
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import useProfessionalSearch from '@/hooks/useProfessionalSearch';
import useBatchAvailability from '@/hooks/useBatchAvailability';
import ProfessionalCard from '@/components/search/ProfessionalCard';
import SearchResultsMap from '@/components/search/SearchResultsMap';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  MapPin,
  Video,
  X,
  SlidersHorizontal,
  Map,
  List,
  AlertCircle,
  Users
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { useMetaTracking } from '@/hooks/useMetaTracking';



// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const FonoaudiologosSearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { trackEvent } = useMetaTracking();

  useEffect(() => {
    trackEvent('ViewContent', { content_name: 'Professionals Search', content_category: 'Directory' });
  }, []);

  // Filtros
  const [filters, setFilters] = useState({
    specialty: searchParams.get('especialidad') || null,
    region: searchParams.get('region') || null,
    city: searchParams.get('ciudad') || null,
    modality: searchParams.get('tipoConsulta') || null,
    term: searchParams.get('term') || null,
  });

  // Data para selects
  const [specialties, setSpecialties] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  
  // Hook de búsqueda
  const { searchResults, loading, error, setFilters: applyFilters } = useProfessionalSearch(filters);

  // IDs para batch availability
  const therapistIds = useMemo(
    () => searchResults.map((p) => p.id).filter(Boolean),
    [searchResults]
  );

  // Disponibilidad en batch
  const { availabilityMap, loading: loadingAvailability } = useBatchAvailability(therapistIds);

  // Badges por especialidad
  const [specialtyBadgesMap, setSpecialtyBadgesMap] = useState({});

  // Fetch initial data for selects
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
      if (filters.region && filters.region !== 'all') {
        const { data } = await supabase
          .from('cities')
          .select('id, name')
          .eq('region_id', filters.region)
          .order('name');
        setCities(data || []);
      } else {
        setCities([]);
      }
    };
    fetchCities();
  }, [filters.region]);

  // Fetch specialty badges
  useEffect(() => {
    const fetchSpecialtyBadges = async () => {
      if (therapistIds.length === 0) {
        setSpecialtyBadgesMap({});
        return;
      }

      const { data, error } = await supabase
        .from('therapist_specialty_badges')
        .select('therapist_id, specialty, badge, final_score')
        .in('therapist_id', therapistIds)
        .gte('final_score', 25)
        .order('final_score', { ascending: false });

      if (data && !error) {
        const grouped = data.reduce((acc, item) => {
          if (!acc[item.therapist_id]) acc[item.therapist_id] = [];
          acc[item.therapist_id].push(item);
          return acc;
        }, {});
        setSpecialtyBadgesMap(grouped);
      }
    };

    fetchSpecialtyBadges();
  }, [therapistIds]);

  // Sync URL params to State
  useEffect(() => {
    setFilters({
      specialty: searchParams.get('especialidad') || null,
      region: searchParams.get('region') || null,
      city: searchParams.get('ciudad') || null,
      modality: searchParams.get('tipoConsulta') || null,
      term: searchParams.get('term') || null,
    });
  }, [location.search, searchParams]);

  // Handlers
  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...filters,
      [key]: value === 'all' ? null : value
    };

    // Reset city if region changes
    if (key === 'region') {
      newFilters.city = null;
    }

    setFilters(newFilters);
    applyFilters(newFilters);
    // Update URL
    const params = new URLSearchParams();
    if (newFilters.specialty) params.set('especialidad', newFilters.specialty);
    if (newFilters.region) params.set('region', newFilters.region);
    if (newFilters.city) params.set('ciudad', newFilters.city);
    if (newFilters.modality) params.set('tipoConsulta', newFilters.modality);
    if (newFilters.term) params.set('term', newFilters.term);
    setSearchParams(params);
  };

  const handleSearch = (term) => {
    if (term) {
      trackEvent('Search', { search_string: term, content_category: 'Professionals' });
    }
    handleFilterChange('term', term);
  };

  const clearFilters = () => {
    const emptyFilters = { specialty: null, region: null, city: null, modality: null, term: null };
    setFilters(emptyFilters);
    applyFilters(emptyFilters);
    setSearchParams(new URLSearchParams());
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const getLocationTitle = () => {
    if (filters.city && filters.city !== 'all') {
      const city = cities.find(c => String(c.id) === filters.city);
      return city?.name || 'Chile';
    }
    if (filters.region && filters.region !== 'all') {
      const region = regions.find(r => String(r.id) === filters.region);
      return region?.name || 'Chile';
    }
    return 'Chile';
  };

  const finalResults = searchResults;

  // Render variables
  const showLoading = loading;
  const showError = !loading && error;
  const showEmpty = !loading && !error && finalResults.length === 0;
  const showData = !loading && !error && finalResults.length > 0;

  return (
    <>
      <Helmet>
        <title>Dentistas en {getLocationTitle()} | DentalSpot</title>
        <meta
          name="description"
          content={`Encuentra dentistas verificados en ${getLocationTitle()}. Agenda online, consulta precios y disponibilidad.`}
        />
      </Helmet>

      <div className="min-h-screen bg-[#FAFBFC]">

        {/* ═══════════════════════════════════════════════════════════
            HEADER CON FILTROS
            ═══════════════════════════════════════════════════════════ */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="hidden md:flex items-center gap-3 py-3">
              {/* Search Input */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar profesional..."
                  value={filters.term || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 h-10 bg-gray-50 border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              {/* Modality Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200/50">
                <button
                  onClick={() => handleFilterChange('modality', null)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-all text-gray-700",
                    !filters.modality ? "bg-white text-gray-900 shadow-sm" : "hover:text-gray-900"
                  )}
                >
                  Todos
                </button>
                <button
                  onClick={() => handleFilterChange('modality', 'presencial')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 text-gray-700",
                    filters.modality === 'presencial' ? "bg-white text-gray-900 shadow-sm" : "hover:text-gray-900"
                  )}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Presencial
                </button>
                <button
                  onClick={() => handleFilterChange('modality', 'online')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 text-gray-700",
                    filters.modality === 'online' ? "bg-white text-gray-900 shadow-sm" : "hover:text-gray-900"
                  )}
                >
                  <Video className="h-3.5 w-3.5" />
                  Online
                </button>
              </div>

              {/* Specialty Select */}
              <Select
                value={filters.specialty || 'all'}
                onValueChange={(v) => handleFilterChange('specialty', v)}
              >
                <SelectTrigger className="w-[180px] h-10 bg-gray-50 border-gray-200 rounded-lg text-sm text-gray-900">
                  <SelectValue placeholder="Especialidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas especialidades</SelectItem>
                  {specialties.map((spec) => (
                    <SelectItem key={spec.id} value={String(spec.id)}>
                      {spec.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Region Select */}
              <Select
                value={filters.region || 'all'}
                onValueChange={(v) => handleFilterChange('region', v)}
              >
                <SelectTrigger className="w-[180px] h-10 bg-gray-50 border-gray-200 rounded-lg text-sm text-gray-900">
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

              {/* City Select */}
              {cities.length > 0 && (
                <Select
                  value={filters.city || 'all'}
                  onValueChange={(v) => handleFilterChange('city', v)}
                >
                  <SelectTrigger className="w-[160px] h-10 bg-gray-50 border-gray-200 rounded-lg text-sm text-gray-900">
                    <SelectValue placeholder="Ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={String(city.id)}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-gray-900"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpiar
                </Button>
              )}

              {/* View Toggle */}
              <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-lg p-1 border border-gray-200/50">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-1.5 rounded-md transition-all",
                    viewMode === 'list' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={cn(
                    "p-1.5 rounded-md transition-all",
                    viewMode === 'map' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <Map className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Mobile Filters Trigger */}
            <div className="md:hidden flex items-center justify-between py-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMobileFilters(true)}
                className="gap-2 text-gray-800"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge className="ml-1 h-5 w-5 p-0 justify-center bg-primary text-white">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>

              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 border border-gray-200/50">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-1.5 rounded-md transition-all text-gray-700",
                    viewMode === 'list' ? "bg-white shadow-sm" : ""
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={cn(
                    "p-1.5 rounded-md transition-all text-gray-700",
                    viewMode === 'map' ? "bg-white shadow-sm" : ""
                  )}
                >
                  <Map className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            CONTENIDO PRINCIPAL
            ═══════════════════════════════════════════════════════════ */}
        <div className="container mx-auto max-w-7xl px-4 py-6">

          {/* Title & Count */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Dentistas en {getLocationTitle()}
            </h1>
            <p className="text-gray-500 mt-1">
              {showLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Buscando profesionales verificados...
                </span>
              ) : showError ? (
                <span className="text-red-500 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Error en la búsqueda.
                </span>
              ) : (
                <>
                  <span className="font-semibold text-gray-700">{finalResults.length}</span>
                  {' '}profesional{finalResults.length !== 1 ? 'es' : ''} disponible{finalResults.length !== 1 ? 's' : ''}
                </>
              )}
            </p>
          </div>

          {/* Active Filters Chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {filters.term && (
                <FilterChip
                  label={`"${filters.term}"`}
                  onRemove={() => handleFilterChange('term', null)}
                />
              )}
              {filters.specialty && (
                <FilterChip
                  label={specialties.find(s => String(s.id) === filters.specialty)?.name || 'Especialidad'}
                  onRemove={() => handleFilterChange('specialty', null)}
                />
              )}
              {filters.region && (
                <FilterChip
                  label={regions.find(r => String(r.id) === filters.region)?.name || 'Región'}
                  onRemove={() => handleFilterChange('region', null)}
                />
              )}
              {filters.city && (
                <FilterChip
                  label={cities.find(c => String(c.id) === filters.city)?.name || 'Ciudad'}
                  onRemove={() => handleFilterChange('city', null)}
                />
              )}
              {filters.modality && (
                <FilterChip
                  label={filters.modality === 'online' ? 'Online' : 'Presencial'}
                  onRemove={() => handleFilterChange('modality', null)}
                />
              )}
            </div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Results List */}
            <div className={cn(
              "lg:col-span-2",
              viewMode === 'map' && "hidden lg:block"
            )}>
              {/* TASK 3: Renderizado condicional mejorado */}
              {showLoading && <SearchSkeleton />}
              
              {showError && <ErrorState error={error} />}
              
              {showEmpty && <EmptyState onClear={clearFilters} filtersActive={activeFiltersCount > 0} />}
              
              {showData && (
                <motion.div
                  className="space-y-4"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.05 } }
                  }}
                >
                  {finalResults.map((professional) => (
                    <motion.div
                      key={professional.id}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0 }
                      }}
                    >
                      <ProfessionalCard
                        professional={professional}
                        nextSlots={availabilityMap[professional.id] || null}
                        loadingSlots={loadingAvailability}
                        specialtyBadges={specialtyBadgesMap[professional.id] || []}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Map */}
            <div className={cn(
              "lg:col-span-1",
              viewMode === 'list' && "hidden lg:block"
            )}>
              <div className="sticky top-[70px]">
                <div className="h-[calc(100vh-120px)] min-h-[400px] rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                  {showData ? (
                     <SearchResultsMap
                      therapists={finalResults}
                      loading={loading}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-50 text-gray-400 text-sm flex-col gap-3 p-6 text-center">
                      <MapPin className="h-8 w-8 opacity-50" />
                      <p>No hay ubicaciones para mostrar en el mapa</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            MOBILE FILTERS DRAWER
            ═══════════════════════════════════════════════════════════ */}
        <MobileFiltersDrawer
          isOpen={showMobileFilters}
          onClose={() => setShowMobileFilters(false)}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClear={clearFilters}
          specialties={specialties}
          regions={regions}
          cities={cities}
        />
      </div>
    </>
  );
};

// ============================================
// SUB-COMPONENTS
// ============================================
const FilterChip = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
    {label}
    <button onClick={onRemove} className="hover:bg-primary/20 rounded-full p-0.5 transition-colors">
      <X className="h-3 w-3" />
    </button>
  </span>
);

const SearchSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex gap-4">
            <Skeleton className="h-16 w-16 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full max-w-sm" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-6 w-24 rounded-md" />
                <Skeleton className="h-6 w-24 rounded-md" />
              </div>
              <Skeleton className="h-4 w-32 mt-4" />
            </div>
          </div>
          <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-4">
             <Skeleton className="h-4 w-32 mb-3" />
             <div className="space-y-2">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
             </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// TASK 2 & 3: Mensaje vacío robusto
const EmptyState = ({ onClear, filtersActive }) => (
  <div className="text-center py-16 px-6 bg-white rounded-xl border border-gray-200 shadow-sm">
    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
      {filtersActive ? <Search className="h-8 w-8 text-gray-400" /> : <Users className="h-8 w-8 text-gray-400" />}
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">
      No encontramos dentistas
    </h3>
    <p className="text-gray-500 max-w-md mx-auto mb-8">
      {filtersActive
        ? "No hay profesionales que coincidan exactamente con tus filtros actuales. Intenta ampliando tu búsqueda o cambiando la modalidad."
        : "Aún no hay profesionales públicos registrados en la plataforma. Vuelve a intentarlo más tarde."}
    </p>
    {filtersActive && (
      <Button onClick={onClear} className="min-w-[140px] bg-primary text-white hover:bg-primary/90">
        Limpiar todos los filtros
      </Button>
    )}
  </div>
);

// TASK 3: Componente de error real
const ErrorState = ({ error }) => (
  <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
    <AlertCircle className="h-5 w-5 text-red-600" />
    <div className="ml-2">
      <AlertTitle className="font-semibold text-red-800">Error al cargar el directorio</AlertTitle>
      <AlertDescription className="mt-1 text-red-700 text-sm break-all">
        {typeof error === 'string' ? error : error?.message || 'Hubo un problema de conexión con la base de datos.'}
      </AlertDescription>
    </div>
  </Alert>
);

const MobileFiltersDrawer = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onClear,
  specialties,
  regions,
  cities
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-50"
        />

        {/* Drawer */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-h-[85vh] flex flex-col"
        >
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-2xl shrink-0">
            <h3 className="font-semibold text-gray-900 text-lg">Filtros</h3>
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full h-8 w-8 p-0 text-gray-600">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-4 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
            {/* Search */}
            <div>
              <label className="text-sm font-bold text-gray-800 mb-2 block">Buscar por nombre</label>
              <Input
                placeholder="Nombre del profesional..."
                value={filters.term || ''}
                onChange={(e) => onFilterChange('term', e.target.value)}
                className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500"
              />
            </div>

            {/* Modality */}
            <div>
              <label className="text-sm font-bold text-gray-800 mb-2 block">Modalidad de atención</label>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'all', label: 'Cualquier modalidad' }, 
                  { id: 'presencial', label: 'Presencial (En consulta)' }, 
                  { id: 'online', label: 'Online (Videollamada)' }
                ].map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => onFilterChange('modality', mod.id === 'all' ? null : mod.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border",
                      (mod.id === 'all' && !filters.modality) || filters.modality === mod.id
                        ? "bg-primary/5 border-primary text-primary"
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                    )}
                  >
                    {mod.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Specialty */}
            <div>
              <label className="text-sm font-bold text-gray-800 mb-2 block">Especialidad clínica</label>
              <Select value={filters.specialty || 'all'} onValueChange={(v) => onFilterChange('specialty', v)}>
                <SelectTrigger className="w-full h-12 bg-gray-50 border-gray-200 text-gray-900">
                  <SelectValue placeholder="Todas las especialidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las especialidades</SelectItem>
                  {specialties.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Region */}
            <div>
              <label className="text-sm font-bold text-gray-800 mb-2 block">Ubicación</label>
              <Select value={filters.region || 'all'} onValueChange={(v) => onFilterChange('region', v)}>
                <SelectTrigger className="w-full h-12 bg-gray-50 border-gray-200 mb-3 text-gray-900">
                  <SelectValue placeholder="Cualquier Región" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Cualquier Región</SelectItem>
                  {regions.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* City */}
              {cities.length > 0 && (
                <Select value={filters.city || 'all'} onValueChange={(v) => onFilterChange('city', v)}>
                  <SelectTrigger className="w-full h-12 bg-gray-50 border-gray-200 text-gray-900">
                    <SelectValue placeholder="Cualquier Ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Cualquier Ciudad</SelectItem>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 flex gap-3 bg-white shrink-0">
            <Button variant="outline" className="flex-1 h-12 text-gray-700" onClick={onClear}>
              Limpiar
            </Button>
            <Button className="flex-1 h-12 bg-primary text-white" onClick={onClose}>
              Ver resultados
            </Button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default FonoaudiologosSearchPage;
