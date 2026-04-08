import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Star,
  TrendingUp,
  ClipboardCheck,
  UserCheck,
  FileText,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import logger from '@/lib/utils/logger';

const METRIC_CONFIG = {
  attendanceRate: {
    label: 'Asistencia',
    icon: UserCheck,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    format: (v) => `${v}%`,
    getLevel: (v) => v >= 85 ? 'excellent' : v >= 70 ? 'good' : v >= 50 ? 'regular' : 'low',
  },
  adherenceRate: {
    label: 'Adherencia ejercicios',
    icon: ClipboardCheck,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    format: (v) => `${v}%`,
    getLevel: (v) => v >= 75 ? 'excellent' : v >= 50 ? 'good' : v >= 25 ? 'regular' : 'low',
  },
  dischargeRate: {
    label: 'Tasa de alta',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    format: (v) => `${v}%`,
    getLevel: (v) => v >= 40 ? 'excellent' : v >= 20 ? 'good' : v >= 10 ? 'regular' : 'low',
  },
  avgRating: {
    label: 'Satisfacción',
    icon: Star,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    format: (v) => v > 0 ? `${v}/5` : 'Sin datos',
    getLevel: (v) => v >= 4.5 ? 'excellent' : v >= 3.5 ? 'good' : v >= 2.5 ? 'regular' : 'low',
  },
  reportsShared: {
    label: 'Reportes compartidos',
    icon: FileText,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    format: (v) => `${v}`,
    getLevel: (v) => v >= 5 ? 'excellent' : v >= 2 ? 'good' : v >= 1 ? 'regular' : 'low',
  },
};

const LEVEL_BADGES = {
  excellent: { label: 'Excelente', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  good: { label: 'Bueno', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  regular: { label: 'Regular', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  low: { label: 'Bajo', className: 'bg-red-50 text-red-600 border-red-200' },
};

const getOverallLevel = (metrics) => {
  const levels = Object.entries(metrics).map(([key, val]) => {
    const config = METRIC_CONFIG[key];
    if (!config) return null;
    return config.getLevel(val);
  }).filter(Boolean);

  const scores = levels.map(l => l === 'excellent' ? 4 : l === 'good' ? 3 : l === 'regular' ? 2 : 1);
  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  if (avg >= 3.5) return 'excellent';
  if (avg >= 2.5) return 'good';
  if (avg >= 1.5) return 'regular';
  return 'low';
};

const ClinicalQualityPanel = ({ therapists = [], clinicId }) => {
  const [loading, setLoading] = useState(true);
  const [qualityData, setQualityData] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (clinicId && therapists.length > 0) {
      loadQualityData();
    } else {
      setLoading(false);
    }
  }, [clinicId, therapists]);

  const loadQualityData = async () => {
    setLoading(true);
    try {
      const therapistIds = therapists.map(t => t.therapist_id);

      const [appointmentsRes, plansRes, activitiesRes, reviewsRes, reportsRes] = await Promise.all([
        // Appointments por terapeuta en la clínica
        supabase
          .from('appointments')
          .select('id, therapist_id, status, patient_id')
          .eq('clinic_id', clinicId)
          .in('therapist_id', therapistIds),

        // Planes asignados por terapeuta
        supabase
          .from('patient_assigned_plans')
          .select('id, therapist_id, status, patient_id')
          .in('therapist_id', therapistIds),

        // Actividades de sesión (necesitamos resolver vía plan_sessions)
        supabase
          .from('session_activities')
          .select(`
            id, status,
            plan_sessions!inner(
              patient_assigned_plans!inner(therapist_id)
            )
          `)
          .in('plan_sessions.patient_assigned_plans.therapist_id', therapistIds),

        // Reviews por terapeuta
        supabase
          .from('patient_reviews')
          .select('id, therapist_id, rating')
          .in('therapist_id', therapistIds),

        // Reportes de progreso
        supabase
          .from('progress_reports')
          .select('id, therapist_id, shared_with_patient')
          .in('therapist_id', therapistIds),
      ]);

      const appointments = appointmentsRes.data || [];
      const plans = plansRes.data || [];
      const activities = activitiesRes.data || [];
      const reviews = reviewsRes.data || [];
      const reports = reportsRes.data || [];

      // Calcular métricas por terapeuta
      const data = therapists.map((t) => {
        const tId = t.therapist_id;

        // 1. Tasa de asistencia
        const tApps = appointments.filter(a => a.therapist_id === tId);
        const completed = tApps.filter(a => a.status === 'completed').length;
        const cancelled = tApps.filter(a => a.status === 'cancelled').length;
        const noShow = tApps.filter(a => a.status === 'no-show').length;
        const relevantApps = completed + cancelled + noShow;
        const attendanceRate = relevantApps > 0 ? Math.round((completed / relevantApps) * 100) : 0;

        // 2. Tasa de alta
        const tPlans = plans.filter(p => p.therapist_id === tId);
        const plansCompleted = tPlans.filter(p => p.status === 'completed').length;
        const dischargeRate = tPlans.length > 0 ? Math.round((plansCompleted / tPlans.length) * 100) : 0;

        // 3. Adherencia a ejercicios
        const tActivities = activities.filter(a => 
          a.plan_sessions?.patient_assigned_plans?.therapist_id === tId
        );
        const activitiesCompleted = tActivities.filter(a => a.status === 'completed').length;
        const adherenceRate = tActivities.length > 0 ? Math.round((activitiesCompleted / tActivities.length) * 100) : 0;

        // 4. Satisfacción
        const tReviews = reviews.filter(r => r.therapist_id === tId);
        const avgRating = tReviews.length > 0
          ? Math.round((tReviews.reduce((s, r) => s + Number(r.rating), 0) / tReviews.length) * 10) / 10
          : 0;

        // 5. Reportes compartidos
        const tReports = reports.filter(r => r.therapist_id === tId);
        const reportsShared = tReports.filter(r => r.shared_with_patient).length;

        // Conteos extra
        const uniquePatients = new Set(tApps.map(a => a.patient_id)).size;

        const metrics = { attendanceRate, adherenceRate, dischargeRate, avgRating, reportsShared };
        const overall = getOverallLevel(metrics);

        return {
          ...t,
          name: t.profiles?.full_name || 'Terapeuta',
          metrics,
          overall,
          totalAppointments: tApps.length,
          completedAppointments: completed,
          uniquePatients,
          totalPlans: tPlans.length,
          totalActivities: tActivities.length,
          totalReviews: tReviews.length,
          totalReports: tReports.length,
        };
      }).sort((a, b) => {
        const scoreA = Object.values(a.metrics).reduce((s, v) => s + v, 0);
        const scoreB = Object.values(b.metrics).reduce((s, v) => s + v, 0);
        return scoreB - scoreA;
      });

      setQualityData(data);
    } catch (err) {
      logger.error('Error loading quality data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ========== LOADING ==========
  if (loading) {
    return (
      <Card className="border border-gray-100 animate-pulse">
        <CardContent className="p-6 space-y-3">
          <div className="h-6 w-1/3 bg-gray-200 rounded" />
          <div className="h-20 w-full bg-gray-100 rounded" />
          <div className="h-20 w-full bg-gray-100 rounded" />
        </CardContent>
      </Card>
    );
  }

  // ========== EMPTY ==========
  if (qualityData.length === 0) {
    return (
      <Card className="border border-gray-100">
        <CardContent className="py-8 text-center">
          <Activity className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium">Sin datos clínicos aún</p>
          <p className="text-sm text-gray-400 mt-1">
            Los indicadores aparecerán cuando haya sesiones completadas y planes activos.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ========== RENDER ==========
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card className="border border-gray-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Award className="h-4 w-4 text-indigo-600" />
            </div>
            Calidad clínica por terapeuta
          </CardTitle>
          <CardDescription className="text-xs">
            Indicadores de desempeño clínico basados en datos reales del sistema
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2 pt-1">
          {qualityData.map((t) => {
            const isExpanded = expandedId === t.id;
            const levelBadge = LEVEL_BADGES[t.overall];

            return (
              <div key={t.id} className="rounded-lg border border-gray-100 overflow-hidden">
                {/* Summary row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : t.id)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="h-9 w-9 rounded-full bg-indigo-50 overflow-hidden shrink-0">
                    <ProfileAvatar
                      profile={t.profiles || t}
                      src={t.profiles?.avatar_url}
                      alt={t.name}
                      className="h-9 w-9"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {t.uniquePatients} paciente{t.uniquePatients !== 1 ? 's' : ''} · {t.completedAppointments} sesiones
                    </p>
                  </div>

                  {/* Quick metrics preview */}
                  <div className="hidden sm:flex items-center gap-3 shrink-0">
                    {t.metrics.attendanceRate > 0 && (
                      <span className="text-xs text-teal-600 font-medium">
                        {t.metrics.attendanceRate}% asist.
                      </span>
                    )}
                    {t.metrics.avgRating > 0 && (
                      <span className="text-xs text-amber-600 font-medium flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {t.metrics.avgRating}
                      </span>
                    )}
                  </div>

                  <Badge variant="outline" className={`text-[10px] shrink-0 ${levelBadge.className}`}>
                    {levelBadge.label}
                  </Badge>

                  {isExpanded
                    ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                  }
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 bg-white space-y-4"
                  >
                    {/* Metrics grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(METRIC_CONFIG).map(([key, config]) => {
                        const value = t.metrics[key];
                        const level = config.getLevel(value);
                        const levelInfo = LEVEL_BADGES[level];
                        const Icon = config.icon;

                        return (
                          <div key={key} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50">
                            <div className={`h-8 w-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                              <Icon className={`h-4 w-4 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-500">{config.label}</span>
                                <span className={`text-xs font-bold ${config.color}`}>
                                  {config.format(value)}
                                </span>
                              </div>
                              {(key === 'attendanceRate' || key === 'adherenceRate' || key === 'dischargeRate') && (
                                <Progress value={value} className="h-1.5" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Context stats */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400 pt-2 border-t">
                      <span>{t.totalAppointments} citas totales</span>
                      <span>{t.totalPlans} planes asignados</span>
                      <span>{t.totalActivities} actividades creadas</span>
                      <span>{t.totalReviews} reseñas recibidas</span>
                      <span>{t.totalReports} reportes generados</span>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ClinicalQualityPanel;