import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  TrendingUp, FileBarChart, ClipboardList, CheckCircle, CheckCircle2,
  Clock, Calendar as CalendarIcon, PlayCircle, Loader2
} from 'lucide-react';
import ProgressReportPage from '@/features/progress/pages/ProgressReportPage';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import logger from '@/lib/utils/logger';
import { motion, AnimatePresence } from 'framer-motion';

const MyProgressPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Reports
  const [reports, setReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [loadingReports, setLoadingReports] = useState(true);

  // Activities
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (user?.id) {
      loadReports();
      loadActivities();
    }
  }, [user?.id]);

  // ─── Reports ───
  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const { data, error } = await supabase
        .from('progress_reports')
        .select('*, therapist:profiles!therapist_id(full_name)')
        .eq('patient_id', user.id)
        .eq('shared_with_patient', true)
        .order('generated_at', { ascending: false });
      if (error) throw error;
      setReports(data || []);
      if (data?.length > 0) setCurrentReport(data[0]);
    } catch (error) {
      logger.error('Error loading reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  // ─── Activities ───
  const loadActivities = async () => {
    setLoadingActivities(true);
    try {
      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('profile_id', user.id)
        .limit(1)
        .maybeSingle();

      if (!patientData) { setLoadingActivities(false); return; }

      const { data: sessionActivities, error } = await supabase
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

      if (error) throw error;

      const formatted = (sessionActivities || []).map(item => {
        const relData = item.exercise || item.activity_rel || {};
        return {
          id: item.id,
          name: item.name || relData.name || 'Actividad sin nombre',
          description: item.description || relData.description || '',
          category: relData.category || 'General',
          status: item.status || 'pending',
          dueDate: item.plan_sessions?.scheduled_date || item.created_at,
          duration: item.duration_minutes
        };
      }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

      setActivities(formatted);
    } catch (error) {
      logger.error('Error fetching activities:', error);
    } finally {
      setLoadingActivities(false);
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
      setActivities(prev => prev.map(a => a.id === activityId ? { ...a, status: 'completed' } : a));
      toast({ title: "Actividad completada" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error al actualizar" });
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingActivities = activities.filter(a => a.status === 'pending');
  const completedActivities = activities.filter(a => a.status === 'completed');

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    try { return format(parseISO(dateString), 'dd/MM/yyyy', { locale: es }); }
    catch { return dateString; }
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-teal-600" />
          Mi Progreso
        </h1>
        <p className="text-muted-foreground">Tus actividades asignadas e informes de evolución.</p>
      </div>

      <Tabs defaultValue="activities" className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-2">
          <TabsTrigger value="activities">
            <ClipboardList className="h-4 w-4 mr-2" />
            Actividades
            {pendingActivities.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">{pendingActivities.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileBarChart className="h-4 w-4 mr-2" />
            Informes
            {reports.length > 0 && (
              <Badge variant="secondary" className="ml-2">{reports.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ─── Activities Tab ─── */}
        <TabsContent value="activities" className="mt-6">
          {loadingActivities ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : activities.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <CheckCircle2 className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900">Sin actividades asignadas</h3>
                <p className="text-gray-500 mt-2">Tu terapeuta te asignará ejercicios cuando lo considere necesario.</p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="pending">
              <TabsList className="grid w-full max-w-sm grid-cols-2 mb-4">
                <TabsTrigger value="pending">
                  Pendientes
                  {pendingActivities.length > 0 && <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">{pendingActivities.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completadas
                  {completedActivities.length > 0 && <Badge variant="secondary" className="ml-2 bg-slate-200">{completedActivities.length}</Badge>}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                <AnimatePresence mode="popLayout">
                  {pendingActivities.length === 0 ? (
                    <div className="text-center py-12 bg-white border border-dashed rounded-xl">
                      <CheckCircle2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                      <h3 className="font-medium text-slate-900">¡Todo al día!</h3>
                      <p className="text-sm text-slate-500 mt-1">No tienes actividades pendientes.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingActivities.map(activity => (
                        <motion.div key={activity.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                          <Card className="border-l-4 border-l-blue-500 shadow-sm">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    <PlayCircle className="h-5 w-5 text-blue-500" />
                                    {activity.name}
                                  </CardTitle>
                                  <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <CalendarIcon className="h-4 w-4" />
                                    <span>{formatDate(activity.dueDate)}</span>
                                    {activity.duration && <><span>·</span><Clock className="h-4 w-4" /><span>{activity.duration} min</span></>}
                                  </div>
                                </div>
                                {activity.category && <Badge variant="outline">{activity.category}</Badge>}
                              </div>
                            </CardHeader>
                            {activity.description && <CardContent><p className="text-sm text-slate-600">{activity.description}</p></CardContent>}
                            <CardFooter className="pt-0">
                              <Button onClick={() => handleMarkCompleted(activity.id)} disabled={updatingId === activity.id} className="bg-blue-600 hover:bg-blue-700">
                                {updatingId === activity.id ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : <><CheckCircle className="mr-2 h-4 w-4" /> Marcar completada</>}
                              </Button>
                            </CardFooter>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="completed">
                <AnimatePresence mode="popLayout">
                  {completedActivities.length === 0 ? (
                    <div className="text-center py-12 bg-white border border-dashed rounded-xl">
                      <ClipboardList className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                      <h3 className="font-medium text-slate-900">Sin historial</h3>
                      <p className="text-sm text-slate-500 mt-1">Aún no has completado ninguna actividad.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {completedActivities.map(activity => (
                        <motion.div key={activity.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                          <Card className="border-l-4 border-l-green-500 bg-slate-50/50">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                {activity.name}
                              </CardTitle>
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <CalendarIcon className="h-4 w-4" />
                                <span>{formatDate(activity.dueDate)}</span>
                              </div>
                            </CardHeader>
                            {activity.description && <CardContent><p className="text-sm text-slate-600">{activity.description}</p></CardContent>}
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>

        {/* ─── Reports Tab ─── */}
        <TabsContent value="reports" className="mt-6">
          {loadingReports ? (
            <div className="space-y-4">{[1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
          ) : reports.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileBarChart className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900">Aún no hay reportes disponibles</h3>
                <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                  Tu terapeuta aún no ha compartido reportes de progreso contigo.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <h3 className="font-semibold text-gray-700 mb-2">Historial de Reportes</h3>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                  {reports.map((report) => (
                    <Card
                      key={report.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        currentReport?.id === report.id ? 'border-teal-500 bg-teal-50' : 'hover:border-teal-300'
                      }`}
                      onClick={() => setCurrentReport(report)}
                    >
                      <CardHeader className="p-4">
                        <CardTitle className="text-sm font-bold text-gray-800">
                          {format(new Date(report.generated_at), 'PPP', { locale: es })}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Por: {report.therapist?.full_name}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-3">
                {currentReport && (
                  <ProgressReportPage
                    report={currentReport}
                    patientName={user.user_metadata?.full_name || 'Mí mismo'}
                  />
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyProgressPage;
