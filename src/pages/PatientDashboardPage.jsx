
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  FileText,
  User,
  Sparkles,
  CheckCircle,
  PlayCircle,
  ShoppingBag,
  Search,
  CalendarCheck,
  ClipboardList,
  Download,
  AlertCircle,
  ChevronRight,
  Loader2,
  MapPin,
  Video,
  Stethoscope,
  Bot
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

import MotivationalPhrase from '@/components/MotivationalPhrase';
import SymptomForm from '@/features/recommendations/components/SymptomForm';
import RecommendedTherapistsWidget from '@/features/recommendations/components/RecommendedTherapistsWidget';
import FloatingAssistant from '@/features/chatbot/components/FloatingAssistant';
import { getRecommendations } from '@/features/recommendations/api/therapistApi';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import logger from '@/lib/utils/logger';

const PatientDashboardPage = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const firstName = profile?.full_name?.split(' ')[0] || 'Paciente';

  // Data states
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [myTherapist, setMyTherapist] = useState(null);

  // Recommendations
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [showRecs, setShowRecs] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Get patient record
      // FIX: Changed .single() to .limit(1).maybeSingle() to prevent "multiple rows" error
      // if a patient has inadvertently been assigned multiple therapists in the patients table
      const { data: patientData, error: patientDataError } = await supabase
        .from('patients')
        .select('id, therapist_id')
        .eq('profile_id', user.id)
        .limit(1)
        .maybeSingle();

      if (patientDataError) {
        logger.warn('Warning fetching patient record:', patientDataError);
      }

      if (!patientData) {
        setLoading(false);
        return;
      }

      // 2. Load therapist info (Including branding)
      if (patientData.therapist_id) {
        const { data: therapist, error: therapistError } = await supabase
          .from('profiles')
          .select(`
            id, full_name,
            therapist_details!therapist_details_user_id_fkey(specialization_areas),
            therapist_branding(avatar_url)
          `)
          .eq('id', patientData.therapist_id)
          .maybeSingle();

        if (therapistError) {
          logger.warn('Warning fetching therapist profile:', therapistError);
        }

        if (therapist) {
          const branding = Array.isArray(therapist.therapist_branding) 
            ? therapist.therapist_branding[0] 
            : therapist.therapist_branding;
          const details = Array.isArray(therapist.therapist_details)
            ? therapist.therapist_details[0]
            : therapist.therapist_details;

          setMyTherapist({
            ...therapist,
            avatar_url: branding?.avatar_url,
            specialty: details?.specialization_areas?.[0] || 'Dentista'
          });
        }
      }

      // 3. Load upcoming appointments
      const today = new Date().toISOString().split('T')[0];
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select(`
          *,
          therapist:profiles!appointments_therapist_id_fkey(full_name, therapist_branding(avatar_url)),
          service:therapist_services!appointments_service_id_fkey(service_name, duration_minutes)
        `)
        .eq('patient_id', patientData.id)
        .gte('date', today)
        .in('status', ['scheduled', 'confirmed'])
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(5);

      const mappedAppointments = (appointmentsData || []).map(apt => {
        const branding = Array.isArray(apt.therapist?.therapist_branding) 
          ? apt.therapist.therapist_branding[0] 
          : apt.therapist?.therapist_branding;
        return {
          ...apt,
          therapist: {
            full_name: apt.therapist?.full_name,
            avatar_url: branding?.avatar_url
          },
          service: apt.service ? {
            name: apt.service.service_name,
            duration_minutes: apt.service.duration_minutes
          } : null
        };
      });
      setAppointments(mappedAppointments);

      // 4. Load pending activities/exercises
      const { data: activitiesData } = await supabase
        .from('session_activities')
        .select(`
          *,
          plan_sessions!inner(
            patient_assigned_plans!inner(patient_id)
          ),
          activity:plan_objective_activities!session_activities_activity_id_fkey(name, description)
        `)
        .eq('plan_sessions.patient_assigned_plans.patient_id', patientData.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(5);

      setActivities(activitiesData || []);

      // 5. Load recent documents/reports
      const { data: docsData } = await supabase
        .from('clinical_reports')
        .select('*')
        .eq('patient_id', patientData.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setDocuments(docsData || []);

      // 6. Load pending payments
      const { data: paymentsData } = await supabase
        .from('patient_payments')
        .select('*')
        .eq('patient_id', patientData.id)
        .eq('status', 'pending')
        .order('payment_date', { ascending: false })
        .limit(3);

      setPayments(paymentsData || []);

    } catch (error) {
      logger.error('Error loading dashboard:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar la información'
      });
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // RECOMMENDATIONS HANDLER
  // =====================================================

  const handleGetRecommendations = async ({ symptoms, additionalInfo }) => {
    setIsLoadingRecs(true);
    try {
      const data = await getRecommendations(symptoms, additionalInfo, user?.id);
      setRecommendations(data || []);
      setShowRecs(true);
      setDialogOpen(false);
    } catch (error) {
      logger.error("Failed to get recs", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron obtener recomendaciones'
      });
    } finally {
      setIsLoadingRecs(false);
    }
  };

  // =====================================================
  // HELPERS
  // =====================================================

  const formatAppointmentDate = (date) => {
    const d = parseISO(date);
    if (isToday(d)) return 'Hoy';
    if (isTomorrow(d)) return 'Mañana';
    return format(d, "EEEE d 'de' MMMM", { locale: es });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getActivityStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      default: return 'bg-orange-100 text-orange-700';
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Mi Panel | DentalSpot</title>
        <meta name="description" content="Panel de control del paciente - Citas, actividades y documentos." />
      </Helmet>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
          ¡Hola, <span className="text-primary">{firstName}</span>!
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Aquí tienes un resumen de tu actividad en DentalSpot.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ==================== COLUMNA PRINCIPAL ==================== */}
        <div className="lg:col-span-2 space-y-6">

          {/* Frase Motivacional */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <MotivationalPhrase type="patient" />
          </motion.div>

          {/* Mi Terapeuta + Próxima Cita */}
          {myTherapist && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-l-4 border-l-teal-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-teal-600" />
                    Mi Dentista
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden">
                      <ProfileAvatar 
                        profile={myTherapist}
                        src={myTherapist.avatar_url}
                        alt={myTherapist.full_name}
                        className="h-14 w-14"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{myTherapist.full_name}</p>
                      <p className="text-sm text-gray-500">{myTherapist.specialty || 'Dentista'}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/dentista/${myTherapist.id}`}>
                        Ver perfil
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ==================== PRÓXIMAS CITAS ==================== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-primary" />
                  Mis Próximas Sesiones
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard/calendar">
                    Ver todas <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                    <Calendar className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No tienes citas agendadas</p>
                    <Button variant="link" className="mt-2" asChild>
                      <Link to="/dashboard/find-therapist">Buscar dentista</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="h-12 w-12 rounded-lg bg-primary flex flex-col items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {format(parseISO(apt.date), 'MMM', { locale: es }).toUpperCase()}
                          </span>
                          <span className="text-lg font-bold text-primary">
                            {format(parseISO(apt.date), 'd')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 truncate">
                              {apt.service?.name || 'Sesión de terapia'}
                            </p>
                            {isToday(parseISO(apt.date)) && (
                              <Badge className="bg-primary text-white text-xs">Hoy</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {apt.start_time?.slice(0, 5)}
                            </span>
                            <span className="flex items-center gap-1">
                              {apt.location_type === 'online' ? (
                                <><Video className="h-3.5 w-3.5" /> Online</>
                              ) : (
                                <><MapPin className="h-3.5 w-3.5" /> Presencial</>
                              )}
                            </span>
                          </div>
                        </div>
                        {apt.location_type === 'online' && apt.meeting_url && (
                          <Button size="sm" className="bg-teal-600 hover:bg-teal-700" asChild>
                            <a href={apt.meeting_url} target="_blank" rel="noopener noreferrer">
                              <Video className="h-4 w-4 mr-1" /> Unirse
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ==================== MIS ACTIVIDADES / EJERCICIOS ==================== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-500" />
                  Mis Ejercicios Pendientes
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard/my-activities">
                    Ver todos <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                    <CheckCircle className="h-10 w-10 mx-auto text-green-300 mb-3" />
                    <p className="text-gray-500">¡No tienes ejercicios pendientes!</p>
                    <p className="text-sm text-gray-400 mt-1">Sigue así 💪</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border border-blue-100"
                      >
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <PlayCircle className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {activity.activity?.name || 'Ejercicio asignado'}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {activity.activity?.description || 'Sin descripción'}
                          </p>
                        </div>
                        <Badge variant="outline" className={getActivityStatusColor(activity.status)}>
                          {activity.status === 'pending' ? 'Pendiente' : activity.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ==================== MIS DOCUMENTOS ==================== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-500" />
                  Mis Documentos
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard/my-documents">
                    Ver todos <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                    <FileText className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Aún no tienes documentos</p>
                    <p className="text-sm text-gray-400 mt-1">Tus informes y certificados aparecerán aquí</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate text-sm">
                            {doc.title || 'Documento'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(parseISO(doc.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                          </p>
                        </div>
                        {doc.file_url && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 text-gray-500" />
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recomendaciones de Terapeutas */}
          {showRecs && recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <RecommendedTherapistsWidget therapists={recommendations} />
            </motion.div>
          )}
        </div>

        {/* ==================== COLUMNA LATERAL ==================== */}
        <div className="lg:col-span-1 space-y-6">

          {/* Buscar Dentista con IA */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-xl border-none overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-32 h-32" />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Bot className="h-6 w-6" />
                  Buscar Especialista
                </CardTitle>
                <CardDescription className="text-indigo-100">
                  Encuentra al terapeuta perfecto según tus necesidades con ayuda de IA.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-white text-indigo-700 hover:bg-indigo-50 font-semibold shadow-lg">
                      <Search className="w-4 h-4 mr-2" />
                      Buscar Dentista
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-transparent border-none shadow-none">
                    <SymptomForm
                      onRecommend={handleGetRecommendations}
                      isLoading={isLoadingRecs}
                    />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pagos Pendientes */}
          {payments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-orange-800">
                    <AlertCircle className="h-5 w-5" />
                    Pagos Pendientes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-2 bg-white rounded border border-orange-200">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{payment.concept}</p>
                        <p className="text-xs text-gray-500">
                          {format(parseISO(payment.payment_date), "d MMM", { locale: es })}
                        </p>
                      </div>
                      <span className="font-semibold text-orange-700">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Marketplace - Productos */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-primary bg-gradient-to-br from-primary to-primary">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <ShoppingBag className="h-5 w-5" />
                  Tienda de Productos
                </CardTitle>
                <CardDescription className="text-primary">
                  Materiales terapéuticos, juegos y recursos para tu tratamiento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-primary hover:bg-primary text-white" asChild>
                  <Link to="/marketplace/productos">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Ver Productos
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Mi Perfil / Ficha Clínica */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-teal-700">
                  <Stethoscope className="h-5 w-5" />
                  Mi Ficha Clínica
                </CardTitle>
                <CardDescription className="text-teal-600">
                  Revisa y actualiza tus datos personales y médicos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" asChild>
                  <Link to="/dashboard/my-clinical-file">
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Mi Ficha
                  </Link>
                </Button>
                <Button variant="outline" className="w-full border-teal-300 text-teal-700 hover:bg-teal-50" asChild>
                  <Link to="/dashboard/settings">
                    <User className="w-4 h-4 mr-2" />
                    Configuración de Cuenta
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Floating Assistant */}
      <FloatingAssistant />
    </div>
  );
};

export default PatientDashboardPage;
