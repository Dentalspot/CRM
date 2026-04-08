/**
 * @file src/components/landing/sections/EducationSection.jsx
 * 
 * EDUCATION & EXPERIENCE — Redesigned with visual hierarchy
 * 
 * FIX: Previously boring flat timeline limited to 4 items.
 * Now:
 * - Education is weighted: Doctorado/Magíster get LARGE prominent cards
 * - Diplomados get medium cards
 * - Cursos/Talleres get compact list items
 * - ALL items shown (expandable "Ver más" for courses)
 * - Experience shown as a clean sidebar timeline
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Briefcase, Award, ChevronDown, ChevronUp,
  ExternalLink, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from '@/components/landing/LandingAnimations';
import {
  hexToRgb, detectEducationType,
  SectionBadge, SectionTitle
} from './shared/utils';

// ============================================================================
// EDUCATION CARD — Large (Doctorado/Magíster)
// ============================================================================
const EducationCardLarge = ({ edu, typeConfig, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    whileHover={{ y: -3 }}
    className="relative bg-white rounded-2xl p-5 shadow-lg border-l-4 hover:shadow-xl transition-all"
    style={{ borderLeftColor: typeConfig.color }}
  >
    {/* Type badge */}
    <div className="flex items-center justify-between mb-3">
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"
        style={{ backgroundColor: `${typeConfig.color}15`, color: typeConfig.color }}
      >
        <Award className="w-3.5 h-3.5" />
        {typeConfig.label}
      </span>
      {edu.graduation_year && (
        <span className="text-xs text-slate-400 font-medium">{edu.graduation_year}</span>
      )}
    </div>

    <h4 className="font-bold text-slate-900 text-base leading-snug mb-1">
      {edu.title || edu.degree}
    </h4>
    <p className="text-sm text-slate-500">{edu.institution}</p>

    {/* Certificate link */}
    {edu.certificate_url && (
      <a
        href={edu.certificate_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium hover:underline transition-colors"
        style={{ color: typeConfig.color }}
      >
        <FileText className="w-3.5 h-3.5" />
        Ver certificado
        <ExternalLink className="w-3 h-3" />
      </a>
    )}
  </motion.div>
);

// ============================================================================
// EDUCATION CARD — Medium (Diplomados/Postítulos)
// ============================================================================
const EducationCardMedium = ({ edu, typeConfig, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    whileHover={{ y: -2 }}
    className="bg-white rounded-xl p-4 shadow-md border border-slate-100 hover:shadow-lg transition-all"
  >
    <div className="flex items-start gap-3">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: `${typeConfig.color}15` }}
      >
        <GraduationCap className="w-5 h-5" style={{ color: typeConfig.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${typeConfig.color}12`, color: typeConfig.color }}
          >
            {typeConfig.label}
          </span>
          {edu.graduation_year && (
            <span className="text-[10px] text-slate-400">{edu.graduation_year}</span>
          )}
        </div>
        <h4 className="font-semibold text-slate-900 text-sm leading-snug">{edu.title || edu.degree}</h4>
        <p className="text-xs text-slate-500 mt-0.5">{edu.institution}</p>
      </div>
    </div>
  </motion.div>
);

// ============================================================================
// EDUCATION ITEM — Compact (Cursos/Talleres)
// ============================================================================
const EducationItemCompact = ({ edu, typeConfig, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors"
  >
    <div
      className="w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: typeConfig.color }}
    />
    <div className="flex-1 min-w-0">
      <p className="text-sm text-slate-700 font-medium truncate">{edu.title || edu.degree}</p>
      <p className="text-[11px] text-slate-400">{edu.institution}{edu.graduation_year ? ` · ${edu.graduation_year}` : ''}</p>
    </div>
    {edu.certificate_url && (
      <a
        href={edu.certificate_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-slate-400 hover:text-slate-600 flex-shrink-0"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    )}
  </motion.div>
);

// ============================================================================
// EXPERIENCE TIMELINE — Clean sidebar
// ============================================================================
const ExperienceTimeline = ({ experience, secondaryColor }) => {
  if (!experience || experience.length === 0) return null;
  const rgb = hexToRgb(secondaryColor);

  return (
    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `rgba(${rgb}, 0.1)` }}
        >
          <Briefcase className="w-4.5 h-4.5" style={{ color: secondaryColor }} />
        </div>
        Experiencia Profesional
      </h3>
      <div className="relative pl-7">
        <div
          className="absolute left-[11px] top-0 bottom-0 w-0.5"
          style={{ backgroundColor: `rgba(${rgb}, 0.25)` }}
        />
        {experience.map((exp, i) => {
          const startYear = exp.start_date ? new Date(exp.start_date).getFullYear() : '';
          const endYear = exp.end_date ? new Date(exp.end_date).getFullYear() : 'Presente';
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative mb-5 last:mb-0"
            >
              <div
                className="absolute -left-4 w-3 h-3 rounded-full border-[3px] border-white shadow-sm"
                style={{ backgroundColor: secondaryColor }}
              />
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 ml-2">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `rgba(${rgb}, 0.1)`, color: secondaryColor }}
                >
                  {startYear} — {endYear}
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-1.5">
                  {exp.role || exp.position}
                </h4>
                <p className="text-xs text-slate-500">{exp.institution || exp.company}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN EDUCATION SECTION
// ============================================================================
const EducationSection = ({ education, experience, branding }) => {
  // FIX: Hooks must be called unconditionally at the top level
  const [showAllCourses, setShowAllCourses] = useState(false);

  const hasEducation = education && education.length > 0;
  const hasExperience = experience && experience.length > 0;
  
  // Early return moved after hooks
  if (!hasEducation && !hasExperience) return null;

  const { primaryColor, secondaryColor } = branding;
  const rgb = hexToRgb(primaryColor);

  // Categorize education by weight
  const categorized = (education || []).map(edu => ({
    ...edu,
    typeConfig: detectEducationType(edu.title || edu.degree)
  }));

  // Sort by weight desc, then year desc
  categorized.sort((a, b) => {
    if (b.typeConfig.weight !== a.typeConfig.weight) return b.typeConfig.weight - a.typeConfig.weight;
    return (b.graduation_year || 0) - (a.graduation_year || 0);
  });

  const highWeight = categorized.filter(e => e.typeConfig.weight >= 4); // Doctorado, Magíster
  const medWeight = categorized.filter(e => e.typeConfig.weight === 3 || e.typeConfig.weight === 2); // Diplomado, Licenciatura
  const lowWeight = categorized.filter(e => e.typeConfig.weight <= 1); // Cursos, talleres

  const COURSES_INITIAL_SHOW = 5;
  const visibleCourses = showAllCourses ? lowWeight : lowWeight.slice(0, COURSES_INITIAL_SHOW);
  const hasMoreCourses = lowWeight.length > COURSES_INITIAL_SHOW;

  return (
    <section className="py-12 md:py-16 bg-slate-50/80 relative overflow-hidden">
      {/* Fondos decorativos — mismo estilo que Reserva tu Cita */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ y: [0, -15, 0], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: primaryColor }}
        />
        <motion.div
          animate={{ y: [0, 20, 0], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: secondaryColor }}
        />
      </div>
      <div className="container mx-auto max-w-6xl px-4 relative z-10">
        <AnimatedSection>
          <div className="text-center mb-10">
            <SectionBadge icon={GraduationCap} label="Mi Trayectoria" primaryColor={primaryColor} rgb={rgb} />
            <SectionTitle className="text-slate-900">Formación y Experiencia</SectionTitle>
          </div>
        </AnimatedSection>

        <div className="grid lg:grid-cols-5 gap-8">

          {/* LEFT: Education (3/5) — Hierarchical */}
          {hasEducation && (
            <div className="lg:col-span-3 space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `rgba(${rgb}, 0.1)` }}
                >
                  <GraduationCap className="w-4.5 h-4.5" style={{ color: primaryColor }} />
                </div>
                Formación Académica
              </h3>

              {/* HIGH WEIGHT — Doctorado / Magíster: Large cards */}
              {highWeight.length > 0 && (
                <div className="space-y-4">
                  {highWeight.map((edu, i) => (
                    <EducationCardLarge
                      key={`high-${i}`}
                      edu={edu}
                      typeConfig={edu.typeConfig}
                      delay={i * 0.1}
                    />
                  ))}
                </div>
              )}

              {/* MEDIUM WEIGHT — Diplomados / Licenciaturas: Medium cards in grid */}
              {medWeight.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {medWeight.map((edu, i) => (
                    <EducationCardMedium
                      key={`med-${i}`}
                      edu={edu}
                      typeConfig={edu.typeConfig}
                      delay={i * 0.08}
                    />
                  ))}
                </div>
              )}

              {/* LOW WEIGHT — Cursos / Talleres: Compact list, collapsible */}
              {lowWeight.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                        {lowWeight.length}
                      </span>
                      Cursos y Certificaciones
                    </h4>
                  </div>
                  <div className="divide-y divide-slate-50">
                    <AnimatePresence>
                      {visibleCourses.map((edu, i) => (
                        <EducationItemCompact
                          key={`low-${i}`}
                          edu={edu}
                          typeConfig={edu.typeConfig}
                          delay={i * 0.05}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                  {hasMoreCourses && (
                    <div className="px-4 py-2.5 border-t border-slate-100">
                      <button
                        onClick={() => setShowAllCourses(!showAllCourses)}
                        className="flex items-center gap-1.5 text-xs font-semibold transition-colors w-full justify-center py-1 hover:bg-slate-50 rounded-lg"
                        style={{ color: primaryColor }}
                      >
                        {showAllCourses ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            Ver menos
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            Ver {lowWeight.length - COURSES_INITIAL_SHOW} cursos más
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* RIGHT: Experience Timeline (2/5) */}
          {hasExperience && (
            <div className="lg:col-span-2">
              <ExperienceTimeline
                experience={experience}
                secondaryColor={secondaryColor}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default EducationSection;