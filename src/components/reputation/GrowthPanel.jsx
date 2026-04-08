import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTherapistGrowth } from '@/hooks/useTherapistGrowth';
import {
  Rocket, GraduationCap, Clock, Globe, Star, Loader2, 
  ChevronDown, ChevronUp, Sparkles, Zap, Target, TrendingUp, ExternalLink
} from 'lucide-react';

// ============================================
// CONSTANTES & UTILIDADES
// ============================================

const LEVEL_COLORS = {
  experiencia_basica: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', bar: 'bg-amber-500' },
  profesional_experiencia: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', bar: 'bg-orange-500' },
  alta_experiencia: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', bar: 'bg-blue-500' },
  experto: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', bar: 'bg-purple-500' },
  maximo: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', bar: 'bg-green-500' },
};

const MODALITY_LABELS = {
  online: { label: '💻 Online', color: 'bg-green-50 text-green-700 border-green-200' },
  presencial: { label: '🏫 Presencial', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  hibrido: { label: '🔄 Híbrido', color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

// ============================================
// SUB-COMPONENTE: Tarjeta de Progreso
// ============================================

const SpecialtyProgressCard = ({ spec }) => {
  const styles = LEVEL_COLORS[spec.next_badge_level] || LEVEL_COLORS.experiencia_basica;

  return (
    <div className={`p-4 rounded-xl border-2 transition-all hover:shadow-sm ${styles.border} ${styles.bg}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{spec.specialty_icon}</div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">{spec.specialty_name}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-gray-500">{spec.current_emoji} {spec.current_badge}</span>
              <span className="text-gray-300">→</span>
              <span className={`text-xs font-bold ${styles.text}`}>{spec.next_emoji} {spec.next_badge}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-xl font-black ${styles.text}`}>{spec.final_score}</span>
          <span className="block text-[9px] uppercase font-bold text-gray-400">Score</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="w-full bg-white rounded-full h-2.5 overflow-hidden border border-black/5">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${styles.bar}`} 
            style={{ width: `${spec.progress_percent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-medium text-gray-500">
          <span>{spec.progress_percent}% completado</span>
          <span>Faltan {spec.points_to_next} pts</span>
        </div>
      </div>

      {spec.weakest_axis === 'education' && spec.unique_patients > 0 && (
        <div className="mt-3 flex items-start gap-2 bg-white/60 p-2 rounded-lg border border-dashed border-amber-200">
          <Zap className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 leading-tight">
            Tienes buena experiencia clínica. Un curso certificado impulsaría tu nivel rápidamente.
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================
// SUB-COMPONENTE: Tarjeta de Curso
// ============================================

const CourseCard = ({ course }) => {
  const [expanded, setExpanded] = useState(false);
  const modality = MODALITY_LABELS[course.course_modality] || MODALITY_LABELS.online;

  return (
    <Card className={`overflow-hidden border transition-all hover:shadow-md ${course.course_featured ? 'border-purple-200 ring-1 ring-purple-100' : 'border-gray-100'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          {course.course_featured ? (
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200">
              <Star className="w-3 h-3 mr-1 fill-purple-700" /> Recomendado
            </Badge>
          ) : <div />}
          
          {course.would_level_up && (
            <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200 animate-pulse">
              <Sparkles className="w-3 h-3 mr-1" /> Sube de Nivel
            </Badge>
          )}
        </div>

        <div className="flex gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100">
            <GraduationCap className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900 leading-snug">{course.course_title}</h4>
            <p className="text-xs text-gray-500 mt-0.5">{course.course_provider}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3 bg-purple-50 p-2 rounded-md">
          <div className="text-lg">{course.specialty_icon}</div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wide">Impacto</p>
            <p className="text-xs font-medium text-purple-900">+{course.real_points_gain} puntos en {course.specialty_name}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge variant="secondary" className="text-[10px] h-5">{course.course_level}</Badge>
          <Badge variant="outline" className={`text-[10px] h-5 ${modality.color}`}>{modality.label}</Badge>
          {course.course_hours && (
            <Badge variant="outline" className="text-[10px] h-5 text-gray-500">
              <Clock className="w-2.5 h-2.5 mr-1" /> {course.course_hours}h
            </Badge>
          )}
        </div>

        <p className="text-xs text-gray-600 italic border-l-2 border-gray-200 pl-2 mb-3">
          "{course.motivation_message}"
        </p>

        <div className="flex flex-col gap-2">
          {course.course_url && (
            <Button variant="outline" size="sm" className="w-full justify-between" asChild>
              <a href={course.course_url} target="_blank" rel="noopener noreferrer">
                Ver Curso <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
            </Button>
          )}
          
          {course.course_description && (
            <button 
              onClick={() => setExpanded(!expanded)}
              className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 w-full py-1"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Ocultar detalles' : 'Ver detalles'}
            </button>
          )}
        </div>

        {expanded && (
          <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
            {course.course_description}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const GrowthPanel = () => {
  const { user } = useAuth();
  const { growthPlan, loading, error } = useTherapistGrowth(user?.id);

  if (loading) {
    return (
      <Card className="border-none shadow-none bg-transparent">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-3" />
          <p className="text-gray-500 font-medium">Analizando tu trayectoria profesional...</p>
        </div>
      </Card>
    );
  }

  if (error || !growthPlan) {
    return (
      <Card className="border-dashed border-2 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardContent className="py-12 text-center">
          <Rocket className="w-12 h-12 text-purple-300 mx-auto mb-4" />
          <h4 className="font-bold text-purple-900 text-lg mb-2">Plan de Crecimiento</h4>
          <p className="text-sm text-purple-600 max-w-md mx-auto">
            Pronto podrás ver tu ruta de ascenso profesional, cursos recomendados y métricas de progreso por especialidad.
          </p>
          <Badge className="mt-4 bg-purple-100 text-purple-700 border-purple-200">
            Próximamente ✨
          </Badge>
        </CardContent>
      </Card>
    );
  }

  const { specialties_progress, recommended_courses, stats } = growthPlan;
  const hasProgress = specialties_progress?.length > 0;
  const hasCourses = recommended_courses?.length > 0;

  return (
    <div className="space-y-8">
      
      {/* HEADER STATS */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-none shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-black">{stats.avg_score}</p>
              <p className="text-xs opacity-80 uppercase font-bold tracking-wider">Score Promedio</p>
            </CardContent>
          </Card>
          <Card className="border-purple-100 bg-purple-50 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-black text-purple-700">{stats.specialties_at_max}</p>
              <p className="text-xs text-purple-600 font-bold uppercase tracking-wider">Nivel Experto</p>
            </CardContent>
          </Card>
          <Card className="border-amber-100 bg-amber-50 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-black text-amber-600">{stats.closest_to_level_up || 0}</p>
              <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Pts para Subir</p>
            </CardContent>
          </Card>
          <Card className="border-blue-100 bg-blue-50 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-black text-blue-600">{stats.total_specialties}</p>
              <p className="text-xs text-blue-700 font-bold uppercase tracking-wider">Especialidades</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUMNA IZQUIERDA: Progreso */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Rocket className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold text-gray-900">Tu Ruta de Ascenso</h3>
          </div>
          
          {hasProgress ? (
            <div className="space-y-4">
              {specialties_progress.map((spec) => (
                <SpecialtyProgressCard key={spec.specialty_slug} spec={spec} />
              ))}
            </div>
          ) : (
            <div className="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
              <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Aún no hay suficiente actividad registrada para calcular tu progreso.</p>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: Recomendaciones */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-bold text-gray-900">Oportunidades Recomendadas</h3>
          </div>

          {hasCourses ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommended_courses.map((course) => (
                <CourseCard key={course.course_id} course={course} />
              ))}
            </div>
          ) : (
            <div className="p-12 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
              <p className="text-gray-500">No hay cursos recomendados disponibles por el momento.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrowthPanel;