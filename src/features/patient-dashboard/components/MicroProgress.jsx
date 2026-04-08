import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  ChevronRight, 
  Target, 
  CheckCircle2, 
  Flame 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const MicroProgress = ({ 
  sessionsCompleted = 0, 
  sessionsTotal = 0, 
  activitiesCompletedThisWeek = 0, 
  activitiesTotalThisWeek = 0,
  lastTherapistNote = null 
}) => {

  // ========== CÁLCULOS ==========
  const sessionPercent = useMemo(() => {
    if (sessionsTotal <= 0) return 0;
    return Math.round((sessionsCompleted / sessionsTotal) * 100);
  }, [sessionsCompleted, sessionsTotal]);

  const weekPercent = useMemo(() => {
    if (activitiesTotalThisWeek <= 0) return 0;
    return Math.round((activitiesCompletedThisWeek / activitiesTotalThisWeek) * 100);
  }, [activitiesCompletedThisWeek, activitiesTotalThisWeek]);

  // Mensaje motivacional basado en data real, no random
  const progressMessage = useMemo(() => {
    if (sessionsTotal === 0 && activitiesTotalThisWeek === 0) {
      return 'Tu progreso aparecerá aquí a medida que avances en tu tratamiento.';
    }
    if (weekPercent === 100) {
      return '¡Excelente semana! Completaste todas tus actividades.';
    }
    if (weekPercent >= 75) {
      return '¡Buen ritmo! Casi completas todas las actividades de esta semana.';
    }
    if (sessionPercent >= 50) {
      return 'Vas avanzando. Cada sesión cuenta.';
    }
    return 'Estás en camino. Paso a paso se llega lejos.';
  }, [sessionPercent, weekPercent, sessionsTotal, activitiesTotalThisWeek]);

  // ========== SIN DATOS AÚN ==========
  const hasNoData = sessionsTotal === 0 && activitiesTotalThisWeek === 0;

  if (hasNoData && !lastTherapistNote) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="border border-gray-100">
          <CardContent className="py-6 text-center">
            <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-5 w-5 text-purple-400" />
            </div>
            <p className="text-gray-600 font-medium text-sm">
              Tu progreso aparecerá aquí a medida que avances.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Sesiones completadas, actividades y logros se irán sumando automáticamente.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ========== CON DATOS ==========
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card className="border border-gray-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            Cómo vas
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {/* Sesiones */}
          {sessionsTotal > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-gray-600 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-teal-500" />
                  Sesiones completadas
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {sessionsCompleted} de {sessionsTotal}
                </span>
              </div>
              <Progress value={sessionPercent} className="h-2.5" />
            </div>
          )}

          {/* Actividades de la semana */}
          {activitiesTotalThisWeek > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-gray-600 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                  Actividades esta semana
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {activitiesCompletedThisWeek} de {activitiesTotalThisWeek}
                </span>
              </div>
              <Progress value={weekPercent} className="h-2.5" />
            </div>
          )}

          {/* Mensaje contextual */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600 flex items-start gap-2">
              <Flame className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
              {lastTherapistNote || progressMessage}
            </p>
          </div>

          {/* Link a evolución completa */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-gray-500 hover:text-purple-600"
            asChild
          >
            <Link to="/dashboard/patient/my-progress">
              Ver mi evolución completa
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MicroProgress;