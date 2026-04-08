/**
 * @file src/components/search/ProfessionalCard.jsx
 * 
 * PROFESSIONAL CARD — Search results card with DentalLevel integration
 * 
 * Redesigned to:
 * - Show DentalLevel badge prominently with correct BADGE_CONFIG colors
 * - Display specialty badges WITH their DentalLevel scores (colored by tier)
 * - Clean Doctoralia-inspired layout
 * - Proper availability display
 * - Consistent visual language with landing page sections
 */

import React, { useState, useEffect, useMemo, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MapPin, Video, Stethoscope, Star, CheckCircle, ChevronRight,
  Calendar, Clock, Shield, Award, TrendingUp
} from 'lucide-react';
import { format, addDays, startOfToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { getTherapistAvailability } from '@/features/therapist/services/therapist.api';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import BookingDialog from '@/components/calendar/BookingDialog';
import logger from '@/lib/utils/logger';

// ============================================================================
// BADGE CONFIG — Must match the landing page system exactly
// ============================================================================
const BADGE_CONFIG = {
  'Experto DentalSpot': {
    color: '#8B5CF6',
    emoji: '👑',
    label: 'Experto',
    tier: 5,
    bgClass: 'bg-violet-50 border-violet-200 text-violet-700',
  },
  'Alta experiencia clínica': {
    color: '#3B82F6',
    emoji: '🔵',
    label: 'Alta Exp.',
    tier: 4,
    bgClass: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  'Profesional con experiencia': {
    color: '#F97316',
    emoji: '🟠',
    label: 'Experiencia',
    tier: 3,
    bgClass: 'bg-orange-50 border-orange-200 text-orange-700',
  },
  'Experiencia básica': {
    color: '#EAB308',
    emoji: '🟡',
    label: 'Básica',
    tier: 2,
    bgClass: 'bg-amber-50 border-amber-200 text-amber-700',
  },
  'En formación': {
    color: '#9CA3AF',
    emoji: '⚪',
    label: 'En formación',
    tier: 1,
    bgClass: 'bg-gray-50 border-gray-200 text-gray-500',
  },
};

const getBadgeConfig = (badge) => BADGE_CONFIG[badge] || BADGE_CONFIG['En formación'];

// ============================================================================
// DENTALLEVEL GLOBAL BADGE — Prominent display with score
// ============================================================================
const DentalLevelGlobalBadge = ({ score, badge }) => {
  if (!badge || score === 0) return null;
  const config = getBadgeConfig(badge);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border cursor-help transition-all hover:shadow-sm"
            style={{
              backgroundColor: `${config.color}10`,
              borderColor: `${config.color}30`,
              color: config.color,
            }}
          >
            <span className="text-sm">{config.emoji}</span>
            <span className="uppercase tracking-wide text-[10px]">{config.label}</span>
            <span
              className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-black"
              style={{
                backgroundColor: `${config.color}15`,
                color: config.color,
              }}
            >
              {score}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[220px]">
          <p className="font-bold mb-1">DentalLevel: {score}/100</p>
          <p className="text-muted-foreground">
            Reputación clínica verificada basada en formación académica (40%) y experiencia clínica real (60%).
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// ============================================================================
// SPECIALTY BADGE — Shows specialty name + DentalLevel score with tier color
// ============================================================================
const SpecialtyBadgeWithScore = ({ specialty, badge, score }) => {
  const config = getBadgeConfig(badge);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border cursor-help transition-all hover:shadow-sm"
            style={{
              backgroundColor: `${config.color}08`,
              borderColor: `${config.color}25`,
              color: config.color,
            }}
          >
            <span className="text-xs">{config.emoji}</span>
            <span>{specialty?.replace(/_/g, ' ')}</span>
            <span
              className="font-black text-[10px] ml-0.5"
              style={{ color: config.color }}
            >
              {score}%
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-bold">{badge}</p>
          <p className="text-muted-foreground">{specialty?.replace(/_/g, ' ')}: {score}/100</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// ============================================================================
// SPECIALTIES WITHOUT DENTALLEVEL — Fallback for non-scored specialties
// ============================================================================
const PlainSpecialtyBadge = ({ name }) => (
  <Badge variant="secondary" className="text-[11px] font-medium bg-slate-100 text-slate-600 border-slate-200">
    {name}
  </Badge>
);

// ============================================================================
// INSURANCE LIST
// ============================================================================
const InsuranceBadge = ({ insurance }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className="text-gray-600 font-normal border-gray-300 whitespace-nowrap text-xs flex items-center gap-1 cursor-help"
        >
          {insurance.logo_url ? (
            <img src={insurance.logo_url} alt={insurance.name} className="h-3 w-3 object-contain" />
          ) : (
            <Shield className="h-3 w-3 text-gray-400" />
          )}
          {insurance.name}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <p>Convenio con {insurance.name}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const InsurancesList = ({ insurances }) => {
  const [showAll, setShowAll] = useState(false);

  if (!insurances || insurances.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Shield className="h-3.5 w-3.5" />
        <span>Sin convenios registrados</span>
      </div>
    );
  }

  const visible = showAll ? insurances : insurances.slice(0, 3);
  const remaining = insurances.length - 3;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="text-xs font-semibold text-gray-700 mr-1 flex items-center gap-1">
        <Shield className="h-3.5 w-3.5 text-primary" />
        Previsiones:
      </p>
      {visible.map((ins) => (
        <InsuranceBadge key={ins.id} insurance={ins} />
      ))}
      {!showAll && remaining > 0 && (
        <Button
          variant="link"
          size="sm"
          className="text-primary h-auto p-0 text-xs"
          onClick={() => setShowAll(true)}
        >
          +{remaining} más
        </Button>
      )}
      {showAll && insurances.length > 3 && (
        <Button
          variant="link"
          size="sm"
          className="text-gray-400 h-auto p-0 text-xs"
          onClick={() => setShowAll(false)}
        >
          ver menos
        </Button>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const ProfessionalCard = memo(({ professional, specialtyBadges = [] }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [availability, setAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [selectedClinicId, setSelectedClinicId] = useState(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState(null);

  const slug = professional.public_slug || professional.slug || professional.id || professional.therapist_id;

  // ── Clinics & Tabs ──
  const presencialClinics = useMemo(() =>
    Array.isArray(professional.clinics)
      ? professional.clinics.filter(c => c.modality === 'presencial' && c.address)
      : [],
    [professional.clinics]
  );

  const offersOnline = professional.offers_online;

  const tabs = useMemo(() => {
    const generated = [];
    presencialClinics.forEach((clinic, index) => {
      generated.push({
        type: 'clinic',
        label: clinic.name || `Dirección ${index + 1}`,
        content: clinic,
      });
    });
    if (offersOnline) {
      generated.push({ type: 'online', label: 'Online', content: null });
    }
    return generated;
  }, [presencialClinics, offersOnline]);

  useEffect(() => {
    if (tabs.length > 0 && tabs[0].type === 'clinic') {
      setSelectedClinicId(tabs[0].content.id);
    }
  }, [tabs]);

  // ── Availability ──
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!slug) return;
      try {
        setLoadingAvailability(true);
        const today = format(startOfToday(), 'yyyy-MM-dd');
        const data = await getTherapistAvailability(slug, selectedClinicId, today, 30);
        let nextAvailableSlot = null;
        if (data && data.length > 0) {
          for (const day of data) {
            const availableSlot = day.time_slots?.find(slot => slot.available);
            if (availableSlot) {
              nextAvailableSlot = { date: day.availability_date, time: availableSlot.time };
              break;
            }
          }
        }
        setAvailability({ nextAvailable: nextAvailableSlot, allData: data });
      } catch (err) {
        logger.error('Error cargando disponibilidad:', err);
        setAvailability({ nextAvailable: null, allData: [] });
      } finally {
        setLoadingAvailability(false);
      }
    };
    fetchAvailability();
  }, [slug, selectedClinicId]);

  // ── Handlers ──
  const handleTabChange = (index, clinic) => {
    setActiveTab(index);
    setSelectedClinicId(clinic?.id || null);
  };

  const handleSlotClick = (day, slot) => {
    const currentClinic = tabs[activeTab]?.content;
    const isOnline = tabs[activeTab]?.type === 'online';
    setSelectedSlotForBooking({
      date: day.date,
      time: slot.time,
      clinicId: selectedClinicId,
      clinicName: isOnline ? 'Consulta Online' : currentClinic?.name,
      clinicAddress: isOnline ? null : currentClinic?.address,
      isOnline,
      serviceName: 'Primera visita',
      price: professional.min_price || 0,
      duration: 30,
    });
    setShowBookingDialog(true);
  };

  // ── DentalLevel Data ──
  // Use specialtyBadges prop (from parent batch fetch) OR fallback to professional fields
  const dentallevelGlobal = {
    score: professional.dentallevel_score || 0,
    badge: professional.dentallevel_badge || '',
  };

  // Merge specialty badges: prefer prop data, then build from specialties
  const sortedBadges = useMemo(() => {
    if (specialtyBadges && specialtyBadges.length > 0) {
      return [...specialtyBadges].sort((a, b) => b.final_score - a.final_score);
    }
    return [];
  }, [specialtyBadges]);

  // Specialties that DON'T have DentalLevel scores (show as plain badges)
  const scoredSpecialtyNames = useMemo(
    () => new Set(sortedBadges.map(b => b.specialty?.toLowerCase().replace(/_/g, ' '))),
    [sortedBadges]
  );

  const unscoredSpecialties = useMemo(
    () => (professional.specialties || []).filter(
      s => !scoredSpecialtyNames.has(s.toLowerCase())
    ),
    [professional.specialties, scoredSpecialtyNames]
  );

  const insurances = Array.isArray(professional.insurances) ? professional.insurances : [];
  const currentTab = tabs[activeTab];

  // ── Availability helpers ──
  const getNext3DaysWithSlots = () => {
    if (!availability?.allData || availability.allData.length === 0) return [];
    const daysWithSlots = [];
    for (const dayData of availability.allData) {
      if (daysWithSlots.length >= 2) break;
      const availableSlots = dayData.time_slots?.filter(slot => slot.available) || [];
      if (availableSlots.length > 0) {
        const date = parseISO(dayData.availability_date);
        const today = startOfToday();
        const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
        const isTomorrow = format(date, 'yyyy-MM-dd') === format(addDays(today, 1), 'yyyy-MM-dd');
        daysWithSlots.push({
          date,
          label: isToday ? 'Hoy' : isTomorrow ? 'Mañana' : format(date, 'EEE', { locale: es }),
          dateStr: format(date, 'd MMM', { locale: es }),
          slots: availableSlots.slice(0, 4),
        });
      }
    }
    return daysWithSlots;
  };

  const availableDays = getNext3DaysWithSlots();

  // ── Render ──
  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-200/80 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">

          {/* ═══════ LEFT: Professional Info (2/3) ═══════ */}
          <div className="lg:col-span-2 p-5 space-y-3">

            {/* Header: Avatar + Name + DentalLevel */}
            <div className="flex items-start gap-4">
              <Link to={`/${slug}`} className="flex-shrink-0">
                <Avatar className="h-16 w-16 border-2 border-primary/20 hover:border-primary/40 transition-colors">
                  <AvatarImage
                    src={professional.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(professional.full_name)}&background=random&color=fff`}
                    alt={professional.full_name}
                  />
                  <AvatarFallback className="text-sm font-bold">
                    {professional.full_name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div className="flex-1 min-w-0">
                {/* Name + Verified */}
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-1.5 mb-0.5">
                  <Link
                    to={`/${slug}`}
                    className="hover:text-primary transition-colors truncate"
                  >
                    {professional.full_name}
                  </Link>
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                </h3>

                {/* Headline */}
                <p className="text-sm text-gray-500 mb-2 line-clamp-1">
                  {professional.headline_statement}
                </p>

                {/* DentalLevel Global + Specialty Badges Row */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Global DentalLevel badge */}
                  <DentalLevelGlobalBadge
                    score={dentallevelGlobal.score}
                    badge={dentallevelGlobal.badge}
                  />

                  {/* Specialty badges WITH DentalLevel scores */}
                  {sortedBadges.slice(0, 3).map((sb, idx) => (
                    <SpecialtyBadgeWithScore
                      key={idx}
                      specialty={sb.specialty}
                      badge={sb.badge}
                      score={sb.final_score}
                    />
                  ))}

                  {/* Remaining specialty badges count */}
                  {sortedBadges.length > 3 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-[11px] text-gray-400 font-medium cursor-help">
                            +{sortedBadges.length - 3} más
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {sortedBadges.slice(3).map((sb, i) => (
                            <p key={i}>{sb.specialty?.replace(/_/g, ' ')}: {sb.final_score}%</p>
                          ))}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* Unscored specialties (plain) */}
                  {unscoredSpecialties.slice(0, 2).map((spec, idx) => (
                    <PlainSpecialtyBadge key={`plain-${idx}`} name={spec} />
                  ))}
                </div>

                {/* Rating */}
                {professional.avg_rating > 0 && (
                  <div className="flex items-center gap-2 text-xs mt-2">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3 w-3",
                            i < Math.round(professional.avg_rating) ? "fill-current" : "text-gray-300"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-gray-500">
                      ({professional.total_reviews || professional.review_count || 0})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Clinic Tabs */}
            {tabs.length > 0 && (
              <>
                <div className="border-b border-gray-100">
                  <nav className="-mb-px flex gap-4" aria-label="Tabs">
                    {tabs.map((tab, index) => (
                      <button
                        key={index}
                        onClick={() => handleTabChange(index, tab.content)}
                        className={cn(
                          'flex items-center gap-1.5 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                          activeTab === index
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        )}
                      >
                        {tab.type === 'online' && <Video className="h-3.5 w-3.5" />}
                        {tab.type === 'clinic' && <MapPin className="h-3.5 w-3.5" />}
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                {currentTab && (
                  <div className="space-y-2 text-sm">
                    {currentTab.type === 'clinic' ? (
                      <>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 text-sm">
                              {currentTab.content.name}
                            </p>
                            <p className="text-gray-500 text-xs">{currentTab.content.address}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            <span>Primera visita</span>
                          </div>
                          <span className="font-bold text-primary text-sm">
                            {professional.min_price > 0
                              ? `$${professional.min_price.toLocaleString('es-CL')}`
                              : 'Consultar'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-primary flex-shrink-0" />
                          <p className="font-semibold text-gray-800 text-sm">Consulta Online</p>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            <span>Primera visita online</span>
                          </div>
                          <span className="font-bold text-primary text-sm">
                            {professional.min_price > 0
                              ? `$${professional.min_price.toLocaleString('es-CL')}`
                              : 'Consultar'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Insurances */}
            <div className="pt-2.5 border-t border-gray-100">
              <InsurancesList insurances={insurances} />
            </div>
          </div>

          {/* ═══════ RIGHT: Availability (1/3) ═══════ */}
          <div className="lg:border-l border-t lg:border-t-0 border-gray-100 p-5 bg-gray-50/50">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Próximas horas disponibles
            </h4>

            {loadingAvailability ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
            ) : availableDays.length > 0 ? (
              <div className="space-y-3">
                {availableDays.map((day, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-gray-800 capitalize">{day.label}</p>
                      <p className="text-[11px] text-gray-400 font-medium">{day.dateStr}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {day.slots.map((slot, slotIdx) => (
                        <Button
                          key={slotIdx}
                          variant="outline"
                          size="sm"
                          className="text-xs font-medium h-8 px-2.5 hover:bg-primary hover:text-white hover:border-primary transition-all cursor-pointer rounded-lg"
                          onClick={() => handleSlotClick(day, slot)}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {slot.time}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}

                <Button asChild className="w-full mt-1 rounded-lg" size="sm">
                  <Link to={`/${slug}#booking${selectedClinicId ? `?clinicId=${selectedClinicId}` : ''}`}>
                    Ver Más
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-200">
                <Calendar className="h-7 w-7 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-3">Sin horarios disponibles</p>
                <Button asChild variant="outline" size="sm" className="rounded-lg">
                  <Link to={`/${slug}`}>Ver perfil</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      <BookingDialog
        isOpen={showBookingDialog}
        onOpenChange={setShowBookingDialog}
        selectedDate={selectedSlotForBooking?.date}
        selectedTime={selectedSlotForBooking?.time}
        selectedSlotData={selectedSlotForBooking}
        professionalInfo={professional}
      />
    </>
  );
});

ProfessionalCard.displayName = 'ProfessionalCard';

export default ProfessionalCard;