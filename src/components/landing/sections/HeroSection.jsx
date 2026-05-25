/**
 * @file src/components/landing/sections/HeroSection.jsx
 * 
 * HERO SECTION — Compact, dynamic, no wasted vertical space
 * FIX: Removed min-h-[80vh], reduced padding, tighter grid alignment
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Video, ShieldCheck, Shield, Calendar, ArrowRight,
  Share2, Check, ChevronDown, Trophy, CheckCircle2
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScaleOnHover } from '@/components/landing/LandingAnimations';
import { normalizeDetails, hexToRgb, FloatingParticles, BlobShape } from './shared/utils';

// ============================================================================
// HERO SECTION — COMPACT & DYNAMIC
// ============================================================================
const HeroSection = ({ therapist, branding, onBookClick, onShareClick, onDownloadCV, copied = false }) => {
  const { primaryColor, secondaryColor, logoUrl } = branding;
  const details = normalizeDetails(therapist.therapist_details);

  const badges = [
    details.years_experience && {
      icon: Trophy,
      label: `${details.years_experience} años`,
      sublabel: 'Experiencia',
      color: '#FFD700'
    },
    details.registration_supersalud && {
      icon: ShieldCheck,
      label: 'Verificado',
      sublabel: 'SIS Chile',
      color: '#10B981'
    },
    therapist.hasOnline && {
      icon: Video,
      label: 'Online',
      sublabel: 'Disponible',
      color: '#3B82F6'
    },
    therapist.hasInsurance && {
      icon: Shield,
      label: 'Previsión',
      sublabel: 'Aceptada',
      color: '#8B5CF6'
    },
  ].filter(Boolean);

  return (
    <section className="relative flex items-center overflow-hidden bg-white pt-4 pb-8 md:pt-6 md:pb-12 lg:pt-8 lg:pb-16">
      {/* Floating particles - decorative */}
      <FloatingParticles primaryColor={primaryColor} secondaryColor={secondaryColor} />

      {/* Background blobs - positioned more tightly */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute right-[-12%] top-[0%] w-[55%] h-[100%]"
        >
          <BlobShape color={primaryColor} className="w-full h-full opacity-80" />
        </motion.div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, opacity: 0.2 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="absolute left-[-5%] bottom-[0%] w-[25%] h-[40%]"
        >
          <BlobShape color={secondaryColor} className="w-full h-full" />
        </motion.div>
      </div>

      <div className="relative container mx-auto max-w-7xl px-4">
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-6 items-center">

          {/* Left: Content */}
          <div className="order-2 lg:order-1 z-10">
            {logoUrl && (
              <motion.img
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                src={logoUrl}
                alt="Logo"
                className="h-10 md:h-12 mb-2 object-contain"
              />
            )}

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <span
                className="text-3xl md:text-4xl font-black"
                style={{ color: primaryColor, fontFamily: "'Permanent Marker', cursive" }}
              >
                ¡Hola!
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mt-1"
            >
              Soy {therapist.full_name?.split(' ')[0]}
              <span className="block text-slate-500 text-sm md:text-base font-medium mt-0.5">
                {details.professional_title || 'Dentista'}
              </span>
            </motion.h1>

            {(therapist.hero_subtitle || details.headline_statement) && (
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-slate-600 leading-relaxed max-w-md mt-2"
              >
                {therapist.hero_subtitle || details.headline_statement}
              </motion.p>
            )}

            {/* Gamification Badges — compact row */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-2 mt-4"
            >
              {badges.map((badge, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.08, type: 'spring' }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow-md border border-white/50"
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: `${badge.color}20` }}
                  >
                    <badge.icon className="w-3.5 h-3.5" style={{ color: badge.color }} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-[11px] leading-tight">{badge.label}</p>
                    <p className="text-[9px] text-slate-400 leading-tight">{badge.sublabel}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-2.5 mt-5"
            >
              <ScaleOnHover>
                <Button
                  onClick={onBookClick}
                  size="lg"
                  className="text-white text-sm font-bold rounded-full px-6 h-10 shadow-xl hover:shadow-2xl transition-shadow"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Agendar Cita
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </ScaleOnHover>
              <Button
                variant="outline"
                size="lg"
                onClick={onShareClick}
                className="rounded-full px-5 h-10 font-medium border-2 hover:bg-slate-50"
              >
                {copied ? (
                  <><Check className="w-4 h-4 mr-2 text-green-500" />¡Copiado!</>
                ) : (
                  <><Share2 className="w-4 h-4 mr-2" />Compartir</>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Right: Photo — more compact */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative order-1 lg:order-2 flex justify-center lg:justify-end"
          >
            <div className="relative">
              <img
                src={therapist.avatar_url}
                alt={therapist.full_name}
                className="w-48 h-48 md:w-64 md:h-64 object-cover object-top rounded-[30%_70%_70%_30%/30%_30%_70%_70%] shadow-2xl border-4 border-white"
              />

              {/* Verified badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.9, type: 'spring' }}
                className="absolute -bottom-2 -left-2 bg-white rounded-lg px-2.5 py-1.5 shadow-lg z-20"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-[9px]">Verificado</p>
                    <p className="text-[8px] text-slate-400">Profesional</p>
                  </div>
                </div>
              </motion.div>

              {/* Years badge */}
              {details.years_experience && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.1, type: 'spring' }}
                  className="absolute -top-1 -right-1 bg-white rounded-lg px-2.5 py-1.5 shadow-lg z-20"
                >
                  <p className="text-lg font-black" style={{ color: primaryColor }}>
                    +{details.years_experience}
                  </p>
                  <p className="text-[8px] text-slate-400 font-medium">años exp.</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator — only on desktop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-2 left-1/2 -translate-x-1/2 hidden lg:block"
      >
        <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <ChevronDown className="w-4 h-4 text-slate-300" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;