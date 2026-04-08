import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  PlusCircle,
  Users,
  DollarSign,
  Star,
  BookOpen,
  Edit,
  Eye,
  Loader2,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { fetchMyCourses, fetchInstructorStats, deleteCourse } from '@/features/educator/api/courseApi';

const STATUS_BADGE = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  pending_review: { label: 'En revisión', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  approved: { label: 'Aprobado', color: 'bg-green-100 text-green-800 border-green-200' },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-800 border-red-200' },
};

const KpiCard = ({ icon: Icon, label, value, color }) => (
  <Card>
    <CardContent className="p-6 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const EducatorDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({ totalCourses: 0, totalStudents: 0, totalRevenue: 0, avgRating: 0 });
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [coursesData, statsData] = await Promise.all([
          fetchMyCourses(user.id),
          fetchInstructorStats(user.id),
        ]);
        setCourses(coursesData);
        setStats(statsData);
      } catch (err) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, toast]);

  const handleDelete = async (courseId, title) => {
    if (!window.confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(courseId);
    try {
      await deleteCourse(courseId);
      setCourses(prev => prev.filter(c => c.id !== courseId));
      toast({ title: '✅ Curso eliminado' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-xl" />
          <div className="absolute -bottom-8 right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-overlay filter blur-xl" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Educador DentalSpot</h1>
                <p className="text-emerald-100 text-sm">Crea y vende cursos para la comunidad odontológica</p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => navigate('/dashboard/therapist/educator/new')}
            className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Curso
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={BookOpen} label="Cursos activos" value={stats.totalCourses} color="bg-emerald-100 text-emerald-700" />
        <KpiCard icon={Users} label="Alumnos totales" value={stats.totalStudents} color="bg-blue-100 text-blue-700" />
        <KpiCard
          icon={DollarSign}
          label="Ingresos netos"
          value={`$${stats.totalRevenue.toLocaleString('es-CL')}`}
          color="bg-teal-100 text-teal-700"
        />
        <KpiCard
          icon={Star}
          label="Rating promedio"
          value={stats.avgRating > 0 ? `${stats.avgRating} ★` : '—'}
          color="bg-amber-100 text-amber-700"
        />
      </div>

      {/* Courses List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mis Cursos</h2>

        {courses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="p-4 bg-emerald-50 rounded-full">
                <GraduationCap className="h-10 w-10 text-emerald-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-700">Aún no has creado cursos</p>
                <p className="text-sm text-muted-foreground mt-1">Crea tu primer curso y comparte tu conocimiento.</p>
              </div>
              <Button onClick={() => navigate('/dashboard/therapist/educator/new')} className="bg-emerald-600 hover:bg-emerald-700">
                <PlusCircle className="mr-2 h-4 w-4" /> Crear mi primer curso
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {courses.map((course, idx) => {
              const statusInfo = STATUS_BADGE[course.status] || STATUS_BADGE.draft;
              const enrollments = course.enrollments?.[0]?.count || 0;

              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {/* Cover */}
                      <div className="h-16 w-24 rounded-lg overflow-hidden bg-emerald-50 flex-shrink-0">
                        {course.cover_image_url ? (
                          <img src={course.cover_image_url} alt={course.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <GraduationCap className="h-8 w-8 text-emerald-300" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 dark:text-white truncate">{course.title}</span>
                          <Badge variant="outline" className={`text-xs py-0 h-5 font-normal ${statusInfo.color}`}>
                            {statusInfo.label}
                          </Badge>
                          {course.is_featured && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs py-0 h-5">Destacado</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {enrollments} alumnos</span>
                          {course.rating > 0 && <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {course.rating}</span>}
                          {course.price > 0
                            ? <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> ${course.price?.toLocaleString('es-CL')}</span>
                            : <span className="text-emerald-600 font-medium">Gratuito</span>
                          }
                          {course.specialty?.name && <span>{course.specialty.name}</span>}
                        </div>
                        {course.status === 'pending_review' && (
                          <p className="text-xs text-amber-700 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" /> DentalSpot revisará tu curso en 24-48h
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/dashboard/therapist/educator/${course.id}/students`)}
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4 mr-1" /> Alumnos
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/dashboard/therapist/educator/${course.id}/edit`)}
                          className="text-emerald-600 hover:bg-emerald-50"
                        >
                          <Edit className="h-4 w-4 mr-1" /> Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deletingId === course.id}
                          onClick={() => handleDelete(course.id, course.title)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          {deletingId === course.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />
                          }
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EducatorDashboardPage;
