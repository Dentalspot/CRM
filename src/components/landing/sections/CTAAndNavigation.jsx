import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Calendar, MessageCircle, Instagram, Facebook, Linkedin, Twitter
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AnimatedSection, ScaleOnHover } from '@/components/landing/LandingAnimations';
import { normalizeDetails, DENTALSPOT_COLORS } from './shared/utils';

export const BookingCTASection = ({ branding, onBookClick }) => {
  const { primaryColor, secondaryColor } = branding;

  return (
    <section className="py-16 relative overflow-hidden bg-slate-900">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[80px]" style={{ backgroundColor: primaryColor }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[80px]" style={{ backgroundColor: secondaryColor }} />
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center">
        <AnimatedSection>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-5">
            ¿Listo para comenzar?
          </h2>
          <p className="text-base text-slate-300 mb-8 max-w-xl mx-auto">
            Agenda tu hora de evaluación o sesión de tratamiento de forma rápida y segura.
          </p>

          <ScaleOnHover>
            <Button
              onClick={onBookClick}
              size="lg"
              className="rounded-full px-8 h-12 text-sm font-bold text-white shadow-xl hover:shadow-2xl transition-all border-0"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                boxShadow: `0 8px 25px -8px ${primaryColor}80`,
              }}
            >
              <Calendar className="w-5 h-5 mr-2" />
              Agendar Cita Ahora
            </Button>
          </ScaleOnHover>
        </AnimatedSection>
      </div>
    </section>
  );
};

export const StickyActionBar = ({ therapist, branding, isVisible, onBookClick }) => {
  const { primaryColor, secondaryColor } = branding;
  const details = normalizeDetails(therapist.therapist_details);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50"
        >
          <div className="bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_30px_rgba(0,0,0,0.1)]">
            <div className="container mx-auto max-w-6xl px-4 py-2.5">
              <div className="flex items-center justify-between gap-4">
                <div className="hidden sm:flex items-center gap-3">
                  <Avatar className="h-8 w-8 ring-2 ring-white shadow-md">
                    <AvatarImage src={therapist.avatar_url} />
                    <AvatarFallback style={{ color: primaryColor }}>
                      {therapist.full_name?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{therapist.full_name}</p>
                    <p className="text-slate-400 text-[10px]">{details.professional_title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  {therapist.phone && (
                    <a
                      href={`https://wa.me/${therapist.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 px-4 rounded-full border border-slate-200 flex items-center gap-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>
                  )}
                  <Button
                    onClick={onBookClick}
                    className="h-9 rounded-full px-5 font-bold text-sm text-white"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    <Calendar className="w-4 h-4 mr-2" />Agendar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const FooterSection = ({ socialLinks = [], branding }) => {
  const { primaryColor } = branding;

  return (
    <footer className="py-8 border-t border-slate-100 bg-white">
      <div className="container mx-auto max-w-4xl px-4">
        {socialLinks.length > 0 && (
          <div className="flex justify-center gap-3 mb-5">
            {socialLinks.map((social, i) => (
              <a
                key={i}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <social.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        )}
        <p className="text-center text-sm text-slate-400">
          Perfil profesional en{' '}
          <Link to="/" className="font-semibold hover:underline" style={{ color: primaryColor }}>
            DentalSpot
          </Link>
        </p>
      </div>
    </footer>
  );
};

export const LoadingSkeleton = () => (
  <div className="min-h-screen bg-white">
    <div className="container mx-auto max-w-7xl px-4 py-16">
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <div className="h-10 w-20 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-8 w-3/4 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-14 w-full bg-slate-100 rounded-xl animate-pulse" />
          <div className="flex gap-3">
            <div className="h-10 w-28 rounded-full bg-slate-200 animate-pulse" />
            <div className="h-10 w-24 rounded-full bg-slate-100 animate-pulse" />
          </div>
        </div>
        <div className="flex justify-center">
          <div className="h-56 w-56 rounded-[30%_70%_70%_30%/30%_30%_70%_70%] bg-gradient-to-br from-pink-200 to-teal-200 animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

export const NotFoundState = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
    <div className="text-center max-w-md">
      <h2 className="text-lg font-bold text-slate-900 mb-2">Profesional no encontrado</h2>
      <p className="text-slate-500 mb-5 text-sm">El perfil que buscas no existe o no está disponible.</p>
      <Button
        asChild
        className="rounded-full px-6 text-white"
        style={{ background: `linear-gradient(135deg, ${DENTALSPOT_COLORS.primary}, ${DENTALSPOT_COLORS.secondary})` }}
      >
        <Link to="/buscar-fonoaudiologo">Buscar Odontólogos</Link>
      </Button>
    </div>
  </div>
);