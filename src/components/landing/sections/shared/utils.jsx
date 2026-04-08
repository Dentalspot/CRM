/**
 * @file src/components/landing/sections/shared/utils.jsx
 * 
 * Shared utilities, constants, and small reusable components
 * used across all landing page sections.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Crown, Medal, Flame, TrendingUp, Activity,
  Mic, Baby, Brain, HeartPulse, Ear, MessageCircle, Target
} from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================
export const DENTALSPOT_COLORS = {
  primary: '#ff74c3',
  secondary: '#00bcb5',
  dark: '#1a1a2e',
  light: '#f8fafc',
};

// ============================================================================
// BADGE CONFIG (DentalLevel System)
// ============================================================================
export const BADGE_CONFIG = {
  'Experto DentalSpot': {
    color: '#8B5CF6',
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    bg: 'bg-gradient-to-r from-violet-500 to-purple-600',
    glow: 'shadow-violet-500/50',
    emoji: '👑',
    icon: Crown,
    label: 'EXPERTO',
    description: 'Máximo nivel de experiencia clínica verificada',
    tier: 5,
    minScore: 90
  },
  'Alta experiencia clínica': {
    color: '#3B82F6',
    gradient: 'from-blue-500 via-cyan-500 to-teal-400',
    bg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/50',
    emoji: '🔵',
    icon: Medal,
    label: 'ALTA EXP.',
    description: 'Amplia trayectoria y formación especializada',
    tier: 4,
    minScore: 75
  },
  'Profesional con experiencia': {
    color: '#F97316',
    gradient: 'from-amber-400 via-orange-500 to-red-500',
    bg: 'bg-gradient-to-r from-amber-400 to-orange-500',
    glow: 'shadow-orange-500/50',
    emoji: '🟠',
    icon: Flame,
    label: 'EXPERIENCIA',
    description: 'Experiencia sólida en esta área clínica',
    tier: 3,
    minScore: 50
  },
  'Experiencia básica': {
    color: '#EAB308',
    gradient: 'from-yellow-400 to-amber-500',
    bg: 'bg-yellow-400',
    glow: 'shadow-yellow-500/50',
    emoji: '🟡',
    icon: TrendingUp,
    label: 'BÁSICA',
    description: 'Formación inicial en esta especialidad',
    tier: 2,
    minScore: 25
  },
  'En formación': {
    color: '#9CA3AF',
    gradient: 'from-gray-400 to-gray-500',
    bg: 'bg-gray-400',
    glow: 'shadow-gray-400/50',
    emoji: '⚪',
    icon: Activity,
    label: 'EN FORMACIÓN',
    description: 'En proceso de formación',
    tier: 1,
    minScore: 0
  },
};

// ============================================================================
// EDUCATION TYPE HIERARCHY — for weighted display
// ============================================================================
export const EDUCATION_HIERARCHY = {
  'doctorado': { weight: 5, color: '#8B5CF6', label: 'Doctorado', size: 'lg' },
  'magíster': { weight: 4, color: '#3B82F6', label: 'Magíster', size: 'lg' },
  'magister': { weight: 4, color: '#3B82F6', label: 'Magíster', size: 'lg' },
  'máster': { weight: 4, color: '#3B82F6', label: 'Máster', size: 'lg' },
  'master': { weight: 4, color: '#3B82F6', label: 'Máster', size: 'lg' },
  'diplomado': { weight: 3, color: '#F97316', label: 'Diplomado', size: 'md' },
  'postítulo': { weight: 3, color: '#F97316', label: 'Postítulo', size: 'md' },
  'postitulo': { weight: 3, color: '#F97316', label: 'Postítulo', size: 'md' },
  'especialización': { weight: 3, color: '#F97316', label: 'Especialización', size: 'md' },
  'especializacion': { weight: 3, color: '#F97316', label: 'Especialización', size: 'md' },
  'licenciatura': { weight: 2, color: '#10B981', label: 'Licenciatura', size: 'md' },
  'título profesional': { weight: 2, color: '#10B981', label: 'Título Profesional', size: 'md' },
  'titulo profesional': { weight: 2, color: '#10B981', label: 'Título Profesional', size: 'md' },
  'curso': { weight: 1, color: '#94A3B8', label: 'Curso', size: 'sm' },
  'taller': { weight: 1, color: '#94A3B8', label: 'Taller', size: 'sm' },
  'seminario': { weight: 1, color: '#94A3B8', label: 'Seminario', size: 'sm' },
  'capacitación': { weight: 1, color: '#94A3B8', label: 'Capacitación', size: 'sm' },
  'capacitacion': { weight: 1, color: '#94A3B8', label: 'Capacitación', size: 'sm' },
  'certificación': { weight: 1, color: '#94A3B8', label: 'Certificación', size: 'sm' },
  'certificacion': { weight: 1, color: '#94A3B8', label: 'Certificación', size: 'sm' },
};

/**
 * Detect education type from title string
 */
export const detectEducationType = (title) => {
  if (!title) return { weight: 0, color: '#CBD5E1', label: 'Otro', size: 'sm' };
  const lower = title.toLowerCase();
  for (const [keyword, config] of Object.entries(EDUCATION_HIERARCHY)) {
    if (lower.includes(keyword)) return config;
  }
  return { weight: 0, color: '#CBD5E1', label: 'Formación', size: 'sm' };
};

// ============================================================================
// UTILITIES
// ============================================================================
export const hexToRgb = (hex) => {
  if (!hex) return '255, 116, 195';
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255, 116, 195';
};

export const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(price || 0);
};

export const normalizeDetails = (details) => {
  if (Array.isArray(details)) return details[0] || {};
  return details || {};
};

const conditionIcons = {
  'tartamudez': Mic, 'dislalia': Mic, 'retraso': Baby,
  'autismo': Brain, 'tea': Brain, 'deglución': HeartPulse,
  'voz': Mic, 'audición': Ear, 'lenguaje': MessageCircle,
  'habla': Mic, 'default': Target
};

export const getConditionIcon = (condition) => {
  const lower = condition.toLowerCase();
  for (const [key, icon] of Object.entries(conditionIcons)) {
    if (lower.includes(key)) return icon;
  }
  return conditionIcons.default;
};

// ============================================================================
// SHARED SMALL COMPONENTS
// ============================================================================

export const SectionBadge = ({ icon: Icon, label, primaryColor, rgb }) => (
  <motion.span
    initial={{ opacity: 0, y: -10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
    style={{ backgroundColor: `rgba(${rgb}, 0.1)`, color: primaryColor }}
  >
    <Icon className="w-4 h-4" />
    {label}
  </motion.span>
);

export const SectionTitle = ({ children, className = '' }) => (
  <h2 className={`text-3xl md:text-4xl font-bold tracking-tight ${className}`}>
    {children}
  </h2>
);

export const SectionSubtitle = ({ children, className = '' }) => (
  <p className={`text-base text-slate-500 max-w-2xl mx-auto leading-relaxed mt-3 ${className}`}>
    {children}
  </p>
);

export const FloatingParticles = ({ primaryColor, secondaryColor, count = 8 }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(count)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          width: 6 + (i % 3) * 4,
          height: 6 + (i % 3) * 4,
          background: i % 2 === 0
            ? `linear-gradient(135deg, ${primaryColor}, ${primaryColor}80)`
            : `linear-gradient(135deg, ${secondaryColor}, ${secondaryColor}80)`,
          left: `${10 + (i * 12)}%`,
          top: `${15 + (i % 4) * 20}%`,
        }}
        animate={{
          y: [0, -30, 0],
          x: [0, i % 2 === 0 ? 15 : -15, 0],
          opacity: [0.3, 0.7, 0.3],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 4 + i * 0.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: i * 0.3,
        }}
      />
    ))}
  </div>
);

export const BlobShape = ({ className = '', color = '#ff74c3' }) => (
  <svg viewBox="0 0 500 500" className={className}>
    <defs>
      <linearGradient id={`blobGrad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: color, stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.6 }} />
      </linearGradient>
    </defs>
    <path
      fill={`url(#blobGrad-${color.replace('#', '')})`}
      d="M440.5,320.5Q418,391,355.5,442.5Q293,494,226,450.5Q159,407,99,367Q39,327,31.5,247.5Q24,168,89,125.5Q154,83,222,67Q290,51,356.5,88Q423,125,446,192.5Q469,260,440.5,320.5Z"
    />
  </svg>
);

// ============================================================================
// RING PROGRESS - For DentalLevel Score
// ============================================================================
export const RingProgress = ({ score, size = 120, strokeWidth = 8, color }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className="text-2xl font-black text-white"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, type: 'spring' }}
        >
          {score}
        </motion.span>
      </div>
    </div>
  );
};

// ============================================================================
// SKILL BAR COMPONENT
// ============================================================================
export const SkillBar = ({ name, score, color, emoji, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="group"
  >
    <div className="flex justify-between items-center mb-1.5">
      <span className="font-medium text-slate-700 text-sm capitalize flex items-center gap-2">
        {emoji && <span className="text-base">{emoji}</span>}
        {name}
      </span>
      <motion.span
        className="text-sm font-bold px-2 py-0.5 rounded-full"
        style={{ backgroundColor: `${color}15`, color }}
        whileHover={{ scale: 1.1 }}
      >
        {score}%
      </motion.span>
    </div>
    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${score}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: delay + 0.2, ease: 'easeOut' }}
        className="h-full rounded-full relative"
        style={{ backgroundColor: color }}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        />
      </motion.div>
    </div>
  </motion.div>
);