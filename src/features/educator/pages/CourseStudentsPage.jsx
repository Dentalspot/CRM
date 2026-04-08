import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, CheckCircle, Loader2, GraduationCap } from 'lucide-react';
import { fetchCourseEnrollments, markCourseCompleted } from '@/features/educator/api/courseApi';
import { supabase } from '@/lib/supabaseClient';

const STATUS_BADGE = {
  enrolled: { label: 'Inscrito', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  in_progress: { label: 'En progreso', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  completed: { label: 'Completado', color: 'bg-green-100 text-green-800 border-green-200' },
};

const CourseStudentsPage = () => {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [enrollments, setEnrollments] = useState([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [enrollmentsData, courseData] = await Promise.all([
          fetchCourseEnrollments(courseId),
          supabase.from('courses').select('title, score_boost').eq('id', courseId).single(),
        ]);
        setEnrollments(enrollmentsData);
        if (courseData.data) setCourseTitle(courseData.data.title);
      } catch (err) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, toast]);

  const handleMarkCompleted = async (enrollment) => {
    setCompletingId(enrollment.id);
    try {
      const updated = await markCourseCompleted(enrollment.id);
      setEnrollments(prev => prev.map(e => e.id === enrollment.id ? { ...e, ...updated } : e));

      // Credit DentalLevel boost if not yet credited
      if (!enrollment.dentallevel_credited && enrollment.student?.id) {
        const { data: courseInfo } = await supabase
          .from('courses')
          .select('score_boost')
          .eq('id', courseId)
          .single();

        if (courseInfo?.score_boost) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('dentallevel_score')
            .eq('id', enrollment.student.id)
            .single();

          if (profile) {
            await supabase
              .from('profiles')
              .update({ dentallevel_score: (profile.dentallevel_score || 0) + courseInfo.score_boost })
              .eq('id', enrollment.student.id)
              .catch(() => {});
          }

          await supabase
            .from('course_enrollments')
            .update({ dentallevel_credited: true })
            .eq('id', enrollment.id)
            .catch(() => {});
        }
      }

      toast({ title: '✅ Alumno marcado como completado' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setCompletingId(null);
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
    <div className="container mx-auto max-w-4xl p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/therapist/educator')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Alumnos del Curso</h1>
          {courseTitle && <p className="text-sm text-muted-foreground truncate max-w-md">{courseTitle}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{enrollments.length}</p>
            <p className="text-xs text-muted-foreground">Total inscritos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {enrollments.filter(e => e.status === 'in_progress').length}
            </p>
            <p className="text-xs text-muted-foreground">En progreso</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {enrollments.filter(e => e.status === 'completed').length}
            </p>
            <p className="text-xs text-muted-foreground">Completados</p>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-emerald-700">
            <Users className="h-5 w-5" /> Lista de Alumnos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <div className="p-4 bg-gray-100 rounded-full">
                <GraduationCap className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Aún no hay alumnos inscritos.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.map(enrollment => {
                const student = enrollment.student;
                const statusInfo = STATUS_BADGE[enrollment.status] || STATUS_BADGE.enrolled;
                const isCompleted = enrollment.status === 'completed';

                return (
                  <div
                    key={enrollment.id}
                    className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {student?.full_name || 'Sin nombre'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{student?.email || '—'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Inscrito: {enrollment.enrolled_at
                          ? new Date(enrollment.enrolled_at).toLocaleDateString('es-CL')
                          : '—'}
                      </p>
                    </div>

                    <Badge variant="outline" className={`text-xs py-0 h-5 font-normal flex-shrink-0 ${statusInfo.color}`}>
                      {statusInfo.label}
                    </Badge>

                    {!isCompleted && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={completingId === enrollment.id}
                        onClick={() => handleMarkCompleted(enrollment)}
                        className="border-emerald-400 text-emerald-700 hover:bg-emerald-50 flex-shrink-0"
                      >
                        {completingId === enrollment.id
                          ? <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          : <CheckCircle className="mr-1 h-3 w-3" />
                        }
                        Completado
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseStudentsPage;
