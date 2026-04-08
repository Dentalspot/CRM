import React, { useState, useEffect } from 'react';
import { specialtiesAdminApi } from '@/features/admin/api/specialtiesAdminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import logger from '@/lib/utils/logger';
import { Plus, Edit, Trash, BookOpen, GraduationCap, Link as LinkIcon, Trophy } from 'lucide-react';

export default function SuggestedCoursesAdminView() {
  const [courses, setCourses] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    institution: '',
    specialty_id: '',
    course_type: 'diplomado',
    url: '',
    description: '',
    estimated_score_boost: 5,
    is_active: true
  });

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [specs, courseData] = await Promise.all([
        specialtiesAdminApi.getAllSpecialties(),
        specialtiesAdminApi.getSuggestedCourses()
      ]);
      setSpecialties(specs);
      setCourses(courseData);
    } catch (error) {
      logger.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Fallo al cargar cursos' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        title: course.title,
        institution: course.institution || '',
        specialty_id: course.specialty_id,
        course_type: course.course_type || 'curso',
        url: course.url || '',
        description: course.description || '',
        estimated_score_boost: course.estimated_score_boost || 0,
        is_active: course.is_active
      });
    } else {
      setEditingCourse(null);
      setFormData({
        title: '',
        institution: '',
        specialty_id: '',
        course_type: 'curso',
        url: '',
        description: '',
        estimated_score_boost: 5,
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await specialtiesAdminApi.updateSuggestedCourse(editingCourse.id, formData);
        toast({ title: 'Actualizado', description: 'Curso actualizado correctamente' });
      } else {
        await specialtiesAdminApi.createSuggestedCourse(formData);
        toast({ title: 'Creado', description: 'Curso sugerido creado' });
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el curso' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este curso?')) return;
    try {
      await specialtiesAdminApi.deleteSuggestedCourse(id);
      setCourses(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Eliminado' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error al eliminar' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cursos Sugeridos (Gamification)</h2>
          <p className="text-muted-foreground">Administra la oferta educativa para subir de nivel a los dentistas.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Curso
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-10">Cargando cursos...</div>
        ) : courses.length === 0 ? (
          <div className="col-span-full text-center py-10 text-muted-foreground bg-slate-50 rounded-xl border border-dashed">
            No hay cursos sugeridos registrados.
          </div>
        ) : (
          courses.map((course) => (
            <Card key={course.id} className="relative overflow-hidden hover:shadow-lg transition-shadow duration-200">
              <div className="absolute top-0 right-0 p-3 flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 backdrop-blur-sm hover:bg-white" onClick={() => handleOpenModal(course)}>
                  <Edit className="h-4 w-4 text-slate-600" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 backdrop-blur-sm hover:bg-white hover:text-red-600" onClick={() => handleDelete(course.id)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">{course.course_type}</Badge>
                  {!course.is_active && <Badge variant="destructive">Inactivo</Badge>}
                </div>
                <CardTitle className="text-lg leading-tight line-clamp-2 min-h-[3.5rem]">{course.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <GraduationCap className="h-4 w-4" />
                  <span className="truncate">{course.institution}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 line-clamp-3 min-h-[4.5rem]">
                    {course.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      <span className="font-bold text-amber-600">+{course.estimated_score_boost} pts</span>
                    </div>
                    <div className="text-xs text-slate-400 font-medium px-2 py-1 bg-slate-50 rounded-md">
                      {course.specialties?.name}
                    </div>
                  </div>
                  
                  {course.url && (
                    <a href={course.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full py-2 text-sm text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors mt-2">
                      <LinkIcon className="h-3 w-3 mr-2" />
                      Ver Curso
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'Editar Curso' : 'Nuevo Curso Sugerido'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Título del Curso</Label>
              <Input 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Institución</Label>
              <Input 
                value={formData.institution} 
                onChange={e => setFormData({...formData, institution: e.target.value})} 
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select 
                value={formData.course_type} 
                onValueChange={val => setFormData({...formData, course_type: val})}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="curso">Curso</SelectItem>
                  <SelectItem value="diplomado">Diplomado</SelectItem>
                  <SelectItem value="magister">Magíster</SelectItem>
                  <SelectItem value="seminario">Seminario</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Especialidad Objetivo</Label>
              <Select 
                value={formData.specialty_id} 
                onValueChange={val => setFormData({...formData, specialty_id: val})}
                required
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {specialties.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Puntos Estimados (+Boost)</Label>
              <Input 
                type="number"
                value={formData.estimated_score_boost} 
                onChange={e => setFormData({...formData, estimated_score_boost: parseFloat(e.target.value)})} 
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>URL Externa</Label>
              <Input 
                value={formData.url} 
                onChange={e => setFormData({...formData, url: e.target.value})} 
                placeholder="https://..."
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Descripción</Label>
              <Textarea 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                rows={3}
              />
            </div>

            <DialogFooter className="col-span-2 pt-4">
              <Button type="submit">Guardar Curso</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}