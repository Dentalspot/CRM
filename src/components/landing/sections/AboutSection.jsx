/**
 * @file src/components/landing/sections/AboutSection.jsx
 * 
 * ABOUT + DENTALLEVEL SECTION — Unified, clear information architecture
 * 
 * FIX: Previously DentalLevel data was scattered between About and Specialties.
 * Now unified into one clean section with:
 * - Bio text on the left
 * - DentalLevel card + ALL specialty scores on the right (clear hierarchy)
 * - Languages inline, not in a separate heavy block
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, GraduationCap, ShieldCheck, Globe, Sparkles, Zap,
  Instagram, Facebook, Linkedin, Twitter
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AnimatedSection } from '@/components/landing/LandingAnimations';
import {
  normalizeDetails, hexToRgb, BADGE_CONFIG,
  SectionBadge, RingProgress, SkillBar, FloatingParticles
} from './shared/utils';

// ============================================================================
// DENTALLEVEL GLOBAL CARD — Compact, clear badge display
// ============================================================================
const DentalLevelGlobalCard = ({ badge, score, primaryColor }) => {
  const config = BADGE_CONFIG[badge] || BADGE_CONFIG['En formación'];
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 15 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 shadow-md"
    >
      <div className="relative z-10 flex items-center gap-4">
        {/* Ring con el color del badge */}
        <div className="relative" style={{ width: 80, height: 80 }}>
          <svg width={80} height={80} className="transform -rotate-90">
            <circle cx={40} cy={40} r={34} fill="none" stroke="#e5e7eb" strokeWidth={5} />
            <motion.circle
              cx={40} cy={40} r={34}
              fill="none"
              stroke={config.color}
              strokeWidth={5}
              strokeLinecap="round"
              initial={{ strokeDasharray: 213.6, strokeDashoffset: 213.6 }}
              animate={{ strokeDashoffset: 213.6 - (score / 100) * 213.6 }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className="text-2xl font-black text-slate-800"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, type: 'spring' }}
            >
              {score}
            </motion.span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <IconComponent className="w-4 h-4" style={{ color: config.color }} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              DentalLevel
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-800 leading-tight">{badge}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{config.description}</p>
        </div>

        {/* Emoji del badge */}
        <span className="text-2xl absolute top-3 right-3">{config.emoji}</span>
      </div>
    </motion.div>
  );
};

// ============================================================================
// ALL SPECIALTIES BREAKDOWN — Shows ALL scores, not just filtered ones
// ============================================================================
const SpecialtiesBreakdown = ({ specialtyBadges, primaryColor }) => {
  if (!specialtyBadges || specialtyBadges.length === 0) return null;

  // Sort by score desc, show ALL
  const sorted = [...specialtyBadges].sort((a, b) => b.final_score - a.final_score);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md border border-amber-100">
      <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide mb-4 flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-600" />
        Nivel por Especialidad
      </h3>
      <div className="space-y-3">
        {sorted.map((badge, i) => {
          const config = BADGE_CONFIG[badge.badge] || BADGE_CONFIG['En formación'];
          return (
            <SkillBar
              key={i}
              name={badge.specialty?.replace(/_/g, ' ') || ''}
              score={badge.final_score}
              color={config.color}
              emoji={config.emoji}
              delay={i * 0.08}
            />
          );
        })}
      </div>
      {/* Explanation tooltip */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-[11px] text-amber-600 cursor-help hover:text-amber-700 transition-colors">
                ¿Qué es DentalLevel? →
              </p>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs">
              <p className="font-semibold mb-1">Sistema de Reputación Clínica</p>
              <p className="text-muted-foreground">
                DentalLevel mide la experiencia verificada del profesional basándose en su formación académica (40%)
                y experiencia clínica real (60%). Es el primer sistema de su tipo en Latinoamérica.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

// ============================================================================
// SOCIAL LINKS — Inline, compact
// ============================================================================
const SocialLinksInline = ({ details }) => {
  const links = [
    { url: details.social_instagram_url, icon: Instagram, label: 'Instagram' },
    { url: details.social_facebook_url, icon: Facebook, label: 'Facebook' },
    { url: details.social_linkedin_url, icon: Linkedin, label: 'LinkedIn' },
    { url: details.social_twitter_url, icon: Twitter, label: 'Twitter' },
  ].filter(s => s.url);

  if (links.length === 0) return null;

  return (
    <div className="flex gap-2 mt-4">
      {links.map((social, i) => (
        <a
          key={i}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all"
          aria-label={social.label}
        >
          <social.icon className="w-4 h-4" />
        </a>
      ))}
    </div>
  );
};

// ============================================================================
// MAIN ABOUT SECTION
// ============================================================================
const AboutSection = ({ bio, branding, therapist, specialtyBadges = [], languages = [] }) => {
  if (!bio) return null;

  const { primaryColor, secondaryColor } = branding;
  const rgb = hexToRgb(primaryColor);
  const details = normalizeDetails(therapist?.therapist_details);

  const mainBadge = therapist?.badge_label || (specialtyBadges.length > 0 ? specialtyBadges[0]?.badge : null);
  const mainScore = therapist?.final_score || (specialtyBadges.length > 0 ? specialtyBadges[0]?.final_score : null);

  // Display languages inline
  const displayLanguages = languages.length > 0
    ? languages
    : [{ language: 'Español', level: 5 }];

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-slate-50 to-white overflow-hidden relative">
      <FloatingParticles primaryColor={primaryColor} secondaryColor={secondaryColor} count={5} />

      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid lg:grid-cols-5 gap-8 items-start">

          {/* LEFT COLUMN (3/5) — Bio + Quick Stats */}
          <AnimatedSection direction="left" className="lg:col-span-3">
            <div className="space-y-5">
              <div>
                <SectionBadge icon={BookOpen} label="Conóceme" primaryColor={primaryColor} rgb={rgb} />
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">Sobre Mí</h2>
                <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">{bio}</p>
              </div>

              {/* Quick stats — horizontal compact chips */}
              <div className="flex flex-wrap gap-2">
                {details.years_experience && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-sm border border-slate-100"
                  >
                    <span className="text-lg font-bold" style={{ color: primaryColor }}>
                      {details.years_experience}+
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide">Años Exp.</span>
                  </motion.div>
                )}
                {details.university && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-sm border border-slate-100"
                  >
                    <GraduationCap className="w-4 h-4" style={{ color: secondaryColor }} />
                    <span className="text-[11px] text-slate-600">{details.university}</span>
                  </motion.div>
                )}
                {details.registration_supersalud && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-sm border border-slate-100"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-[11px] text-slate-600">SIS Verificado</span>
                  </motion.div>
                )}
              </div>

              {/* Languages — lightweight inline display */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Globe className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Idiomas:</span>
                </div>
                {displayLanguages.map((lang, i) => (
                  <span
                    key={i}
                    className="text-sm text-slate-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 font-medium"
                  >
                    {lang.language || lang.name || lang}
                  </span>
                ))}
              </div>

              {/* Social links */}
              <SocialLinksInline details={details} />
            </div>
          </AnimatedSection>

          {/* RIGHT COLUMN (2/5) — DentalLevel + Specialties Breakdown */}
          <AnimatedSection direction="right" delay={0.2} className="lg:col-span-2">
            <div className="space-y-5 lg:sticky lg:top-8">
              {/* DentalLevel Global Badge */}
              {mainBadge && mainScore && (
                <DentalLevelGlobalCard
                  badge={mainBadge}
                  score={mainScore}
                  primaryColor={primaryColor}
                />
              )}

              {/* ALL specialty scores */}
              <SpecialtiesBreakdown
                specialtyBadges={specialtyBadges}
                primaryColor={primaryColor}
              />
            </div>
          </AnimatedSection>

        </div>
      </div>
    </section>
  );
};

export default AboutSection;