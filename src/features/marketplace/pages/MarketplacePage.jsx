import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, AlertCircle, RefreshCw, GraduationCap, Clock, Star, Users,
  ArrowRight, Package, ChevronDown, SlidersHorizontal, X, Heart,
  FileText, Sparkles, Tag, Mic, MessageSquare, Brain, BookOpen,
  Stethoscope, Baby, Activity, ClipboardList, Download, ShoppingBag,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import ProductCard from '@/features/marketplace/components/ProductCard';
import { fetchMarketplaceItems } from '@/features/marketplace/api/marketplaceApi';
import logger from '@/lib/utils/logger';
import { fetchApprovedCourses } from '@/features/educator/api/courseApi';

// ── Category config ──
const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: Package, color: 'from-teal-500 to-teal-600', bg: 'bg-teal-50' },
  { id: 'evaluation', label: 'Plantillas', icon: ClipboardList, color: 'from-primary to-primary', bg: 'bg-primary' },
  { id: 'plan', label: 'Planificación', icon: FileText, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50' },
  { id: 'activity', label: 'Descargables', icon: Download, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
  { id: 'resource', label: 'Productos', icon: ShoppingBag, color: 'from-purple-500 to-violet-600', bg: 'bg-purple-50' },
  { id: 'course', label: 'Cursos', icon: GraduationCap, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50' },
];

// Stats for social proof in banner
const STATS = [
  { value: '46+', label: 'Dentistas', icon: Users },
  { value: '100+', label: 'Recursos', icon: Package },
  { value: '4.8', label: 'Valoración', icon: Star },
];

const formatCurrency = (amount, currency = 'CLP') =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);

const MarketplacePage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [sort, setSort] = useState('newest');
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadCourses = async () => {
      setCoursesLoading(true);
      try {
        const data = await fetchApprovedCourses();
        setCourses(data);
      } catch (err) {
        logger.error(err);
      } finally {
        setCoursesLoading(false);
      }
    };
    loadCourses();
  }, []);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMarketplaceItems({ search, type: activeCategory, sort });
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, activeCategory, sort]);

  useEffect(() => { loadItems(); }, [loadItems]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleViewDetail = (item) => {
    navigate(`/dashboard/marketplace/listings/${item.id}`);
  };

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
  };

  return (
    <div className="min-h-screen bg-gray-50/50">

      {/* ════════════════════════════════════════════
          HERO BANNER
          ════════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800">
        <div className="relative container mx-auto px-4 md:px-8 py-10 md:py-14">
          <div className="max-w-2xl">
            <span className="text-emerald-200/90 text-sm font-medium tracking-wide uppercase">
              Marketplace Odontológico
            </span>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mt-3 mb-3">
              Planificaciones clínicas <span className="text-emerald-300">listas para usar</span>
            </h1>

            <p className="text-teal-100/80 text-sm sm:text-base max-w-lg mb-6 leading-relaxed">
              Recursos creados por dentistas para dentistas. Ahorra horas de preparación.
            </p>

            <div className="relative max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10" />
              <Input
                placeholder="Buscar por diagnóstico, edad, tipo de recurso..."
                className="pl-12 pr-12 h-12 bg-white border-0 shadow-xl text-sm rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-300"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 z-10">
                  <X className="h-3.5 w-3.5 text-slate-500" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          CATEGORIES
          ════════════════════════════════════════════ */}
      <div className="container mx-auto px-4 md:px-8 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-1.5 sm:p-2">
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`
                    flex items-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium
                    whitespace-nowrap transition-all duration-200 flex-shrink-0
                    ${isActive
                      ? `bg-gradient-to-r ${cat.color} text-white shadow-md`
                      : `${cat.bg} text-slate-600 hover:text-slate-900 hover:shadow-sm`
                    }
                  `}
                >
                  <cat.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isActive ? 'text-white/90' : 'text-slate-400'}`} />
                  {cat.label}
                </button>
              );
            })}

            {/* Shortcut to My Plannings */}
            <div className="ml-auto flex-shrink-0 pl-2 hidden sm:block">
              <Button
                variant="ghost"
                size="sm"
                className="text-teal-700 hover:bg-teal-50 gap-1.5 font-medium text-xs sm:text-sm"
                onClick={() => navigate('/dashboard/therapist/marketplace')}
              >
                <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline">Vender Recursos</span>
                <span className="md:hidden">Vender</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-8 space-y-8">

        {/* ════════════════════════════════════════════
            FILTERS BAR + RESULT COUNT
            ════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[170px] bg-white h-9 text-sm border-slate-200 shadow-sm">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Más recientes</SelectItem>
                <SelectItem value="popular">Más vendidos</SelectItem>
                <SelectItem value="highest_rated">Mejor valorados</SelectItem>
                <SelectItem value="lowest_price">Menor precio</SelectItem>
                <SelectItem value="highest_price">Mayor precio</SelectItem>
              </SelectContent>
            </Select>

            {search && (
              <Badge variant="secondary" className="gap-1.5 pl-3 pr-1.5 py-1.5 bg-teal-50 text-teal-700 border-0">
                Buscando: "{search}"
                <button onClick={clearSearch} className="h-4 w-4 rounded-full bg-teal-200/50 flex items-center justify-center hover:bg-teal-200">
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}

            {activeCategory !== 'all' && (
              <Badge variant="secondary" className="gap-1.5 pl-3 pr-1.5 py-1.5 bg-slate-100 text-slate-600 border-0">
                {CATEGORIES.find(c => c.id === activeCategory)?.label}
                <button onClick={() => setActiveCategory('all')} className="h-4 w-4 rounded-full bg-slate-200/50 flex items-center justify-center hover:bg-slate-200">
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}
          </div>

          {!loading && (
            <span className="text-sm text-slate-400">
              {items.length} recurso{items.length !== 1 ? 's' : ''} encontrado{items.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* ════════════════════════════════════════════
            ERROR STATE
            ════════════════════════════════════════════ */}
        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-sm">{error}</span>
              <Button size="sm" variant="outline" onClick={loadItems} className="ml-4 gap-1 text-xs">
                <RefreshCw className="h-3 w-3" /> Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* ════════════════════════════════════════════
            PRODUCT SECTIONS
            ════════════════════════════════════════════ */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <Skeleton className="h-44 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex justify-between pt-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 && !error ? (
          <div className="text-center py-20">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
              <Search className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1.5">
              {search ? 'No encontramos resultados' : 'Aún no hay recursos publicados'}
            </h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
              {search
                ? `No hay recursos que coincidan con "${search}". Intenta con otros términos.`
                : '¿Eres dentista? Publica el primer recurso y ayuda a tus colegas.'}
            </p>
            <div className="flex gap-3 justify-center">
              {search && (
                <Button variant="outline" onClick={clearSearch} className="gap-1.5">
                  <X className="h-4 w-4" /> Limpiar búsqueda
                </Button>
              )}
              <Button className="bg-teal-600 hover:bg-teal-700 gap-1.5"
                onClick={() => navigate('/dashboard/therapist/marketplace/create')}>
                <Sparkles className="h-4 w-4" /> Publicar recurso
              </Button>
            </div>
          </div>
        ) : activeCategory !== 'all' || search ? (
          /* Filtered view: flat grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {items.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                onBuy={handleViewDetail}
              />
            ))}
          </div>
        ) : (
          /* Home view: grouped by category */
          <div className="space-y-10">
            {[
              { type: 'evaluation', label: 'Plantillas de Anamnesis y Evaluaciones', icon: ClipboardList, color: 'from-primary to-primary', filter: (i) => i.item_type === 'evaluation' },
              { type: 'plan', label: 'Planificación', icon: FileText, color: 'from-blue-500 to-blue-600', filter: (i) => i.item_type === 'plan' || i.is_treatment_plan },
              { type: 'activity', label: 'Descargables', icon: Download, color: 'from-amber-500 to-orange-500', filter: (i) => i.item_type === 'activity' || (i.item_type === 'material' && i.therapist_material_id) },
              { type: 'resource', label: 'Productos', icon: ShoppingBag, color: 'from-purple-500 to-violet-600', filter: (i) => i.item_type === 'resource' || i.item_type === 'product' || (i.item_type === 'material' && !i.therapist_material_id) },
              { type: 'course', label: 'Cursos', icon: GraduationCap, color: 'from-emerald-500 to-teal-600', filter: (i) => i.item_type === 'course' },
            ].map(({ type, label, icon: SectionIcon, color, filter: filterFn }) => {
              const sectionItems = items.filter(filterFn).slice(0, 4);
              if (sectionItems.length === 0) return null;
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-sm`}>
                        <SectionIcon className="h-4 w-4 text-white" />
                      </div>
                      <h2 className="text-lg font-bold text-slate-900">{label}</h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-teal-700 hover:bg-teal-50 gap-1 text-xs"
                      onClick={() => { setActiveCategory(type); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
                      Ver todos <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {sectionItems.map((item) => (
                      <ProductCard key={item.id} product={item} onBuy={handleViewDetail} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ════════════════════════════════════════════
            COURSES SECTION
            ════════════════════════════════════════════ */}
        {courses.length > 0 && (
          <div className="pt-8">
            <Separator className="mb-8" />

            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                  Cursos y Capacitaciones
                </h2>
                <p className="text-slate-500 text-sm mt-1 ml-[46px]">Aprende de colegas dentistas certificados.</p>
              </div>
              <Button variant="ghost" className="text-teal-700 gap-1 hidden sm:flex">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {coursesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-72 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div key={course.id}
                    className="group rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm hover:shadow-lg hover:border-slate-300/80 transition-all duration-300 flex flex-col cursor-pointer"
                    onClick={() => navigate(`/dashboard/marketplace/courses/${course.id}`)}
                  >
                    {/* Course image */}
                    <div className="h-44 bg-gradient-to-br from-emerald-50 to-teal-50 overflow-hidden flex-shrink-0 relative">
                      {course.cover_image_url ? (
                        <img src={course.cover_image_url} alt={course.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <GraduationCap className="h-14 w-14 text-emerald-200" />
                        </div>
                      )}
                      {/* Format badge */}
                      {course.format && (
                        <div className="absolute top-3 left-3">
                          <Badge className={`border-0 shadow-sm text-xs font-medium ${
                            course.format === 'vivo'
                              ? 'bg-red-500 text-white'
                              : 'bg-white/90 backdrop-blur-sm text-emerald-700'
                          }`}>
                            {course.format === 'vivo' ? '🔴 En vivo' : '🎬 Grabado'}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex flex-col flex-1 gap-2.5">
                      {/* Tags */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {course.specialty?.name && (
                          <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-500">
                            {course.specialty.name}
                          </Badge>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-slate-900 line-clamp-2 leading-snug text-[15px] group-hover:text-teal-700 transition-colors">
                        {course.title}
                      </h3>

                      {course.short_description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{course.short_description}</p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-auto pt-2">
                        {course.hours > 0 && (
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.hours}h</span>
                        )}
                        {course.rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {course.rating}
                          </span>
                        )}
                        {course.total_enrollments > 0 && (
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {course.total_enrollments}</span>
                        )}
                      </div>

                      {/* Price + CTA */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <span className="font-bold text-slate-900 text-lg">
                          {course.price > 0 ? formatCurrency(course.price) : <span className="text-emerald-600">Gratis</span>}
                        </span>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-sm text-xs h-8 px-3">
                          Ver curso <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty courses state */}
        {!coursesLoading && courses.length === 0 && (
          <div className="pt-8">
            <Separator className="mb-8" />
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
              <div className="mx-auto w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                <GraduationCap className="h-7 w-7 text-emerald-300" />
              </div>
              <h3 className="font-semibold text-slate-600 mb-1">Cursos próximamente</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                Estamos preparando una sección dedicada a cursos y capacitaciones entre colegas.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;