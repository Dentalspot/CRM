
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Clock, Calendar as CalendarIcon, ClipboardList, CheckCircle2, Loader2, PlayCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import logger from '@/lib/utils/logger';
import { motion, AnimatePresence } from 'framer-motion';

const PatientActivitiesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchActivities();
    }
  }, [user?.id]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      // 1. Obtener patient_id
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('profile_id', user.id)
        .limit(1)
        .maybeSingle();

      if (patientError) throw patientError;
      if (!patientData) {
        setLoading(false);
        return;
      }

      // 2. Obtener actividades de la sesión (session_activities)
      const { data: sessionActivities, error: activitiesError } = await supabase
        .from('session_activities')
        .select(`
          *,
          plan_sessions!inner(
            scheduled_date,
            patient_assigned_plans!inner(patient_id)
          ),
          exercise:therapist_exercises!session_activities_exercise_id_fkey(name, description, category),
          activity_rel:plan_objective_activities!session_activities_activity_id_fkey(name, description)
        `)
        .eq('plan_sessions.patient_assigned_plans.patient_id', patientData.id);

      if (activitiesError) throw activitiesError;

      // 3. Formatear y ordenar
      const formattedActivities = (sessionActivities || []).map(item => {
        // Fallbacks por si la data viene de distintas relaciones según cómo armó el terapeuta el plan
        const relData = item.exercise || item.activity_rel || {};
        const dueDate = item.plan_sessions?.scheduled_date || item.created_at;
        
        return {
          id: item.id,
          name: item.name || relData.name || 'Actividad sin nombre',
          description: item.description || relData.description || 'No hay descripción disponible para esta actividad.',
          category: relData.category || 'General',
          status: item.status || 'pending',
          dueDate: dueDate,
          duration: item.duration_minutes
        };
      });

      // Ordenar por due_date ascendente
      formattedActivities.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

      setActivities(formattedActivities);
    } catch (error) {
      logger.error('Error fetching activities:', error);
      toast({
        variant: "destructive",
        title: "Error al cargar",
        description: "No pudimos cargar tus actividades. Intenta nuevamente."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async (activityId) => {
    setUpdatingId(activityId);
    try {
      const { error } = await supabase
        .from('session_activities')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', activityId);

      if (error) throw error;

      setActivities(prev => prev.map(act => 
        act.id === activityId ? { ...act, status: 'completed' } : act
      ));

      toast({
        title: "¡Excelente trabajo! 🎉",
        description: "Has marcado la actividad como completada.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: "No se pudo actualizar el estado de la actividad."
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingActivities = activities.filter(a => a.status === 'pending');
  const completedActivities = activities.filter(a => a.status === 'completed');

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: es });
    } catch (e) {
      return dateString;
    }
  };

  const renderActivityCard = (activity, isPending) => (
    <motion.div
      key={activity.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`border-l-4 ${isPending ? 'border-l-blue-500 hover:border-l-blue-600 shadow-sm' : 'border-l-green-500 bg-slate-50/50'} transition-all`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                {isPending ? <PlayCircle className="h-5 w-5 text-blue-500" /> : <CheckCircle2 className="h-5 w-5 text-green-500" />}
                {activity.name}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CalendarIcon className="h-4 w-4" />
                <span>Fecha: {formatDate(activity.dueDate)}</span>
                {activity.duration && (
                  <>
                    <span>•</span>
                    <Clock className="h-4 w-4 ml-1" />
                    <span>{activity.duration} min</span>
                  </>
                )}
              </div>
            </div>
            {activity.category && (
              <Badge variant="outline" className="bg-white">
                {activity.category}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 text-sm">
            {truncateText(activity.description, 120)}
          </p>
        </CardContent>
        {isPending && (
          <CardFooter className="pt-0">
            <Button 
              onClick={() => handleMarkCompleted(activity.id)} 
              disabled={updatingId === activity.id}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              {updatingId === activity.id ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
              ) : (
                <><CheckCircle className="mr-2 h-4 w-4" /> Marcar completada</>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <Helmet>
        <title>Mis Actividades | DentalSpot</title>
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-blue-600" />
            Mis Actividades Asignadas
          </h1>
          <p className="text-slate-500 mt-2">
            Revisa y completa los ejercicios indicados por tu dentista para avanzar en tu tratamiento.
          </p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="pending">
              Pendientes 
              {pendingActivities.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">{pendingActivities.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completadas
              {completedActivities.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-slate-200">{completedActivities.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-40 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <>
                <TabsContent value="pending" className="m-0 focus-visible:outline-none">
                  <AnimatePresence mode="popLayout">
                    {pendingActivities.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-xl"
                      >
                        <CheckCircle2 className="mx-auto h-16 w-16 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">¡Todo al día!</h3>
                        <p className="text-slate-500 mt-1">No tienes actividades pendientes por el momento.</p>
                      </motion.div>
                    ) : (
                      <div className="space-y-4">
                        {pendingActivities.map(activity => renderActivityCard(activity, true))}
                      </div>
                    )}
                  </AnimatePresence>
                </TabsContent>

                <TabsContent value="completed" className="m-0 focus-visible:outline-none">
                  <AnimatePresence mode="popLayout">
                    {completedActivities.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-xl"
                      >
                        <ClipboardList className="mx-auto h-16 w-16 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">Sin historial</h3>
                        <p className="text-slate-500 mt-1">Aún no has completado ninguna actividad.</p>
                      </motion.div>
                    ) : (
                      <div className="space-y-4">
                        {completedActivities.map(activity => renderActivityCard(activity, false))}
                      </div>
                    )}
                  </AnimatePresence>
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default PatientActivitiesPage;
