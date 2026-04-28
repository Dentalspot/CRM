import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Info, ShieldCheck, Trophy, Medal, Star, Crown } from 'lucide-react';

// ============================================
// CONFIGURACIÓN DE ESTILOS
// ============================================

const BADGE_STYLES = {
  purple: {
    bg: 'bg-purple-50 border-purple-200',
    text: 'text-purple-700',
    fill: 'bg-purple-500',
    ring: 'ring-purple-300',
  },
  blue: {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    fill: 'bg-blue-500',
    ring: 'ring-blue-300',
  },
  orange: {
    bg: 'bg-orange-50 border-orange-200',
    text: 'text-orange-700',
    fill: 'bg-orange-500',
    ring: 'ring-orange-300',
  },
  yellow: {
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    fill: 'bg-amber-500',
    ring: 'ring-amber-300',
  },
  gray: {
    bg: 'bg-gray-50 border-gray-200',
    text: 'text-gray-600',
    fill: 'bg-gray-400',
    ring: 'ring-gray-300',
  },
  pink: {
    bg: 'bg-primary border-primary',
    text: 'text-primary',
    fill: 'bg-primary',
    ring: 'ring-primary',
  }
};

// ============================================
// COMPONENTE: Badge Mini (para tarjetas)
// ============================================

export const ReputationBadgeMini = ({ badge_emoji, badge_label, badge_color, final_score }) => {
  if (!badge_label) return null;

  const styles = BADGE_STYLES[badge_color] || BADGE_STYLES.gray;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border cursor-help transition-colors",
            styles.bg,
            styles.text
          )}>
            <span className="text-sm">{badge_emoji}</span>
            <span>{badge_label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>Score de Reputación: <b>{final_score}/100</b></p>
          <p className="text-muted-foreground">Basado en formación y experiencia clínica.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// ============================================
// COMPONENTE: Insignia Global (para perfil/dashboard)
// ============================================

export const ReputationGlobalBadge = ({ global, className }) => {
  if (!global) return null;

  const styles = BADGE_STYLES[global.color] || BADGE_STYLES.gray;

  return (
    <div className={cn(
      "inline-flex items-center gap-3 px-4 py-2 rounded-full border shadow-sm",
      styles.bg,
      styles.text,
      className
    )}>
      <span className="text-2xl filter drop-shadow-sm">{global.emoji}</span>
      <div className="flex flex-col">
        <span className="text-xs font-bold uppercase tracking-wider opacity-80">Nivel Actual</span>
        <span className="text-sm font-bold leading-none">{global.badge}</span>
      </div>
      <div className="h-8 w-px bg-current opacity-20 mx-1" />
      <div className="text-center">
        <span className="block text-lg font-bold leading-none">{global.score}</span>
        <span className="text-[9px] uppercase font-bold opacity-70">Puntos</span>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: Barra de Progreso
// ============================================

export const ScoreProgressBar = ({ score, maxScore = 100, color = 'purple', size = 'md', className }) => {
  const styles = BADGE_STYLES[color] || BADGE_STYLES.gray;
  const percentage = Math.min((score / maxScore) * 100, 100);
  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className={cn("w-full bg-gray-100 rounded-full overflow-hidden", heightClass, className)}>
      <div
        className={cn(heightClass, "rounded-full transition-all duration-1000 ease-out", styles.fill)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

// ============================================
// COMPONENTE: Card de Especialidad con Score
// ============================================

export const SpecialtyScoreCard = ({ specialty, compact = false }) => {
  if (!specialty) return null;

  const styles = BADGE_STYLES[specialty.badge_color] || BADGE_STYLES.gray;

  if (compact) {
    return (
      <div className={cn("flex items-center justify-between p-3 rounded-lg border bg-white", styles.bg.split(' ')[1])}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{specialty.specialty_icon}</span>
          <span className="text-sm font-medium text-gray-900">{specialty.specialty_name}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24">
            <ScoreProgressBar score={specialty.final_score} color={specialty.badge_color} size="sm" />
          </div>
          <span className={cn("text-sm font-bold min-w-[2rem] text-right", styles.text)}>
            {specialty.final_score}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-4 rounded-xl border bg-white shadow-sm transition-all hover:shadow-md", styles.bg.split(' ')[1])}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", styles.bg)}>
            <span className="text-xl">{specialty.specialty_icon}</span>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 leading-tight">{specialty.specialty_name}</h4>
            <div className={cn("text-xs font-medium flex items-center gap-1 mt-0.5", styles.text)}>
              {specialty.badge_emoji} {specialty.badge_label}
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className={cn("text-2xl font-bold block leading-none", styles.text)}>
            {specialty.final_score}
          </span>
          <span className="text-[10px] text-gray-400 uppercase font-medium">Score</span>
        </div>
      </div>

      <ScoreProgressBar score={specialty.final_score} color={specialty.badge_color} className="mb-3" />

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center justify-between p-1.5 bg-gray-50 rounded border border-gray-100">
          <span className="text-gray-500 flex items-center gap-1">
            <GraduationCap className="w-3 h-3" /> Formación
          </span>
          <span className="font-semibold text-gray-700">{specialty.education_points} pts</span>
        </div>
        <div className="flex items-center justify-between p-1.5 bg-gray-50 rounded border border-gray-100">
          <span className="text-gray-500 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Experiencia
          </span>
          <span className="font-semibold text-gray-700">{specialty.experience_points} pts</span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: Panel de Reputación (Vista Pública)
// ============================================

export const ReputationPanel = ({ reputation, loading = false }) => {
  if (loading) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl" />;
  if (!reputation) return null;

  const { global, specialties } = reputation;
  const activeSpecialties = specialties?.filter(s => s.final_score > 0) || [];

  return (
    <div className="space-y-6">
      {global && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <ReputationGlobalBadge global={global} />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-purple-600 transition-colors cursor-help">
                  <Info className="w-3.5 h-3.5" />
                  <span>¿Cómo se calcula?</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs p-3">
                <p className="font-semibold mb-1">Algoritmo de Reputación</p>
                <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground">
                  <li>40% Formación Académica (Títulos, cursos)</li>
                  <li>60% Experiencia Clínica (Pacientes, citas, resultados)</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {activeSpecialties.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Especialidades Verificadas
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {activeSpecialties.map(spec => (
              <SpecialtyScoreCard key={spec.specialty_slug} specialty={spec} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Icon components for internal use
const GraduationCap = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 0 6-1 6-1v-7"/></svg>
);

export default ReputationPanel;