import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  PlayCircle, 
  ChevronRight,
  Sun 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const TodayPlan = ({ activities = [], onMarkComplete, loading = false }) => {
  // Mostrar máximo 3 actividades (las más urgentes)
  const visibleActivities = activities.slice(0, 3);
  const remainingCount = Math.max(0, activities.length - 3);

  // ========== EMPTY STATE ==========
  if (!loading && activities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="border border-gray-100">
          <CardContent className="py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
              <Sun className="h-6 w-6 text-green-400" />
            </div>
            <p className="text-gray-700 font-medium">
              Hoy no tienes ejercicios pendientes.
            </p>
            <p className="text-sm text-gray-400 mt-1">
              ¡Aprovecha para descansar! Tu próximo ejercicio aparecerá aquí cuando tu terapeuta lo indique.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ========== POPULATED STATE ==========
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="border border-gray-100">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <PlayCircle className="h-4 w-4 text-blue-600" />
              </div>
              Tu plan para hoy
            </CardTitle>
            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 font-medium">
              {activities.length} {activities.length === 1 ? 'ejercicio' : 'ejercicios'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-2 pt-2">
          {visibleActivities.map((activity, index) => (
            <div
              key={activity.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
            >
              {/* Número de orden */}
              <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
                {index + 1}
              </div>

              {/* Info del ejercicio */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {activity.activity?.name || activity.name || 'Ejercicio asignado'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {/* Duración si existe */}
                  {(activity.duration_minutes || activity.activity?.duration_minutes) && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {activity.duration_minutes || activity.activity?.duration_minutes} min
                    </span>
                  )}
                  {/* Categoría si existe */}
                  {(activity.category || activity.activity?.category) && (
                    <span className="text-xs text-gray-400">
                      {activity.category || activity.activity?.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Botón completar */}
              <Button
                size="sm"
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                onClick={() => onMarkComplete?.(activity.id)}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                Hecho
              </Button>
            </div>
          ))}

          {/* Link a todas las actividades */}
          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-gray-500 hover:text-blue-600"
              asChild
            >
              <Link to="/dashboard/my-activities">
                {remainingCount > 0
                  ? `Ver ${remainingCount} más y todas mis actividades`
                  : 'Ver todas mis actividades'
                }
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TodayPlan;