/**
 * @file src/components/landing/sections/ServicesSection.jsx
 * 
 * SERVICES & PRICING — Starbucks-inspired interactive carousel
 * 
 * FIX: Previously static boring cards.
 * Now:
 * - Horizontal scrollable carousel on mobile
 * - Cards EXPAND on hover (scale + elevation + details reveal)
 * - Active card is highlighted with therapist's primary color
 * - Price prominently displayed with playful animation
 * - Duration shown as a visual indicator
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Clock, MapPin, Video, ArrowRight,
  ChevronLeft, ChevronRight, Calendar, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedSection, ScaleOnHover } from '@/components/landing/LandingAnimations';
import { hexToRgb, formatPrice, SectionBadge, SectionTitle, SectionSubtitle } from './shared/utils';

// ============================================================================
// SERVICE CARD — Interactive, expands on hover/focus
// ============================================================================
const ServiceCard = ({ service, isActive, onSelect, primaryColor, secondaryColor, index }) => {
  const rgb = hexToRgb(primaryColor);

  return (
    <motion.div
      layout
      onClick={() => onSelect(index)}
      onMouseEnter={() => onSelect(index)}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      animate={{
        scale: isActive ? 1.05 : 1,
        zIndex: isActive ? 10 : 1,
      }}
      className={`
        relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 flex-shrink-0
        ${isActive
          ? 'shadow-2xl bg-white ring-2'
          : 'shadow-md bg-white/80 hover:bg-white hover:shadow-lg'
        }
      `}
      style={{
        width: 'clamp(260px, 30vw, 320px)',
        ringColor: isActive ? primaryColor : 'transparent',
      }}
    >
      {/* Top colored accent bar */}
      <motion.div
        className="h-1.5 w-full"
        style={{
          background: isActive
            ? `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`
            : '#e2e8f0'
        }}
        animate={{
          scaleX: isActive ? 1 : 0.3,
        }}
        transition={{ duration: 0.3 }}
      />

      <div className="p-5">
        {/* Service name */}
        <h4 className="font-bold text-slate-900 text-lg mb-1 leading-tight">
          {service.service_name}
        </h4>

        {/* Modality badge */}
        {service.modality && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mb-3"
            style={{
              backgroundColor: isActive ? `rgba(${rgb}, 0.1)` : '#f1f5f9',
              color: isActive ? primaryColor : '#94a3b8',
            }}
          >
            {service.modality === 'online' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
            {service.modality}
          </span>
        )}

        {/* Description — only visible when active */}
        <AnimatePresence>
          {isActive && service.service_description && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-slate-500 text-sm leading-relaxed mb-4 overflow-hidden"
            >
              {service.service_description}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Price display — prominent */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">Desde</span>
              <motion.span
                className="text-3xl font-black leading-none"
                style={{ color: isActive ? primaryColor : '#1e293b' }}
                animate={{ scale: isActive ? [1, 1.05, 1] : 1 }}
                transition={{ duration: 0.3 }}
              >
                {formatPrice(service.price_clp)}
              </motion.span>
            </div>

            {/* Duration pill */}
            {service.duration_minutes && (
              <motion.div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
                style={{
                  backgroundColor: isActive ? `rgba(${rgb}, 0.08)` : '#f8fafc',
                  border: isActive ? `1px solid rgba(${rgb}, 0.15)` : '1px solid #e2e8f0',
                }}
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-600">
                  {service.duration_minutes} min
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* CTA — visible only when active */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4"
            >
              <button
                className="w-full py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-shadow hover:shadow-lg"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                <Calendar className="w-4 h-4" />
                Agendar este servicio
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Decorative corner glow when active */}
      {isActive && (
        <motion.div
          className="absolute top-0 right-0 w-20 h-20 opacity-10 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          style={{
            background: `radial-gradient(circle at top right, ${primaryColor}, transparent)`,
          }}
        />
      )}
    </motion.div>
  );
};

// ============================================================================
// CAROUSEL NAVIGATION
// ============================================================================
const CarouselNav = ({ canScrollLeft, canScrollRight, onScrollLeft, onScrollRight, primaryColor }) => (
  <div className="hidden md:flex items-center gap-2">
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onScrollLeft}
      disabled={!canScrollLeft}
      className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      style={{
        borderColor: canScrollLeft ? primaryColor : '#475569',
        color: canScrollLeft ? primaryColor : '#64748b',
      }}
    >
      <ChevronLeft className="w-5 h-5" />
    </motion.button>
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onScrollRight}
      disabled={!canScrollRight}
      className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      style={{
        borderColor: canScrollRight ? primaryColor : '#e2e8f0',
        color: canScrollRight ? primaryColor : '#94a3b8',
      }}
    >
      <ChevronRight className="w-5 h-5" />
    </motion.button>
  </div>
);

// ============================================================================
// MAIN SERVICES SECTION
// ============================================================================
const ServicesSection = ({ services, branding, onBookClick }) => {
  // FIX: Hooks must be called unconditionally at the top level
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Early return moved after hooks
  if (!services || services.length === 0) return null;

  const { primaryColor, secondaryColor } = branding;
  const rgb = hexToRgb(primaryColor);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scrollBy = (direction) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction * 300,
      behavior: 'smooth',
    });
  };

  return (
    <section className="py-14 md:py-18 relative overflow-hidden bg-slate-900">
      {/* Fondos decorativos */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[80px]" style={{ backgroundColor: primaryColor }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[80px]" style={{ backgroundColor: secondaryColor }} />
      </div>
      {/* Subtle background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(${primaryColor} 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="container mx-auto max-w-7xl px-4 relative z-10">
        {/* Header with navigation */}
        <AnimatedSection>
          <div className="flex items-end justify-between mb-8">
            <div>
              <SectionBadge icon={DollarSign} label="Precios Transparentes" primaryColor={primaryColor} rgb={rgb} />
              <SectionTitle className="text-white">Servicios y Tarifas</SectionTitle>
              <SectionSubtitle className="text-left mx-0 text-slate-300">
                Conoce el valor de cada servicio. Sin sorpresas.
              </SectionSubtitle>
            </div>
            <CarouselNav
              canScrollLeft={canScrollLeft}
              canScrollRight={canScrollRight}
              onScrollLeft={() => scrollBy(-1)}
              onScrollRight={() => scrollBy(1)}
              primaryColor={primaryColor}
            />
          </div>
        </AnimatedSection>

        {/* Carousel of service cards */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Add a bit of leading space for the "peek" effect */}
          <div className="flex-shrink-0 w-2 md:w-0" />

          {services.map((service, index) => (
            <ServiceCard
              key={service.id || index}
              service={service}
              isActive={activeIndex === index}
              onSelect={setActiveIndex}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              index={index}
            />
          ))}

          {/* Trailing space */}
          <div className="flex-shrink-0 w-2 md:w-0" />
        </div>

        {/* Scroll indicator dots (mobile) */}
        {services.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-4 md:hidden">
            {services.map((_, i) => (
              <motion.div
                key={i}
                className="h-1.5 rounded-full transition-all"
                animate={{
                  width: activeIndex === i ? 20 : 6,
                  backgroundColor: activeIndex === i ? primaryColor : '#cbd5e1',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ServicesSection;