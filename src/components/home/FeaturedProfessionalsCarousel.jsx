import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import ProfessionalHighlightCard from '@/components/home/ProfessionalHighlightCard';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const FeaturedProfessionalsCarousel = ({
  professionals,
  // Pass dark=true when rendered inside InvitationSection (dark bg)
  dark = false,
  showInviteCTA = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [numVisible, setNumVisible] = useState(4);

  const getNumVisible = useCallback(() => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 768) return 2;
    if (window.innerWidth < 1024) return 3;
    return 4;
  }, []);

  useEffect(() => {
    const handleResize = () => setNumVisible(getNumVisible());
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getNumVisible]);

  const maxIndex = Math.max(0, professionals.length - numVisible);
  const nextSlide = () => setCurrentIndex((p) => Math.min(p + 1, maxIndex));
  const prevSlide = () => setCurrentIndex((p) => Math.max(p - 1, 0));
  const visibleProfessionals = professionals.slice(currentIndex, currentIndex + numVisible);

  if (!professionals || professionals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className={dark ? 'text-slate-500' : 'text-slate-400'}>
          No hay profesionales destacados en este momento.
        </p>
      </div>
    );
  }

  const navBtnClass = dark
    ? 'bg-slate-800 border-slate-700 hover:bg-slate-700'
    : 'bg-white border-slate-200 hover:bg-slate-50';

  const dotClass = (active) =>
    dark
      ? active ? 'w-6 bg-primary' : 'bg-slate-600 hover:bg-slate-500'
      : active ? 'w-6 bg-primary' : 'bg-slate-300 hover:bg-slate-400';

  return (
    <div className="relative" role="region" aria-label="Fonoaudiólogos destacados">

      {/* Nav buttons */}
      {professionals.length > numVisible && (
        <>
          <Button
            onClick={prevSlide}
            disabled={currentIndex === 0}
            variant="outline"
            size="icon"
            className={`absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all ${navBtnClass}`}
            aria-label="Ver profesionales anteriores"
          >
            <ChevronLeft className={`h-5 w-5 ${dark ? 'text-slate-300' : 'text-slate-600'}`} />
          </Button>
          <Button
            onClick={nextSlide}
            disabled={currentIndex >= maxIndex}
            variant="outline"
            size="icon"
            className={`absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all ${navBtnClass}`}
            aria-label="Ver más profesionales"
          >
            <ChevronRight className={`h-5 w-5 ${dark ? 'text-slate-300' : 'text-slate-600'}`} />
          </Button>
        </>
      )}

      {/* Cards */}
      <div className="overflow-hidden px-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {visibleProfessionals.map((prof, index) => (
              <ProfessionalHighlightCard
                key={`${prof.name}-${currentIndex + index}`}
                name={prof.name}
                specialty={prof.specialty}
                rating={prof.rating}
                location={prof.location}
                imageUrl={prof.imageUrl}
                profileUrl={prof.profileUrl}
                whatsapp={prof.whatsapp}
                showInviteCTA={showInviteCTA}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      {professionals.length > numVisible && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${dotClass(i === currentIndex)}`}
              aria-label={`Ir a página ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* ── Invitation bottom CTA ── */}
      {showInviteCTA && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mt-12 p-8 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-3xl"
        >
          <p className="text-white text-lg font-semibold mb-2">
            ¿No conoces a ningún miembro todavía?
          </p>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Déjanos tus datos y conectamos contigo cuando haya cupos disponibles
            o cuando un miembro te quiera recomendar.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold rounded-2xl shadow-lg shadow-primary/25 transition-all px-8"
          >
            <a href="https://influencer.comunicare.cl" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              Solicitar mi invitación
              <ArrowRight className="w-5 h-5" />
            </a>
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default FeaturedProfessionalsCarousel;
