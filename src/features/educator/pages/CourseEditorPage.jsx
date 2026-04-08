import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  Save,
  Send,
  ArrowLeft,
  GraduationCap,
  PlusCircle,
  Trash2,
  GripVertical,
  Upload,
} from 'lucide-react';
import {
  createCourse,
  updateCourse,
  submitForReview,
  fetchCourseById,
  upsertModule,
  deleteModule,
} from '@/features/educator/api/courseApi';

const COURSE_TYPES = [
  { value: 'curso', label: 'Curso' },
  { value: 'taller', label: 'Taller' },
  { value: 'diplomado', label: 'Diplomado' },
  { value: 'certificacion', label: 'Certificación' },
  { value: 'masterclass', label: 'Masterclass' },
  { value: 'mentoria', label: 'Mentoría' },
];

const LEVELS = [
  { value: 'basico', label: 'Básico' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
  { value: 'experto', label: 'Experto' },
];

const FORMATS = [
  { value: 'vivo', label: 'Vivo (en directo)' },
  { value: 'grabado', label: 'Grabado (asíncrono)' },
  { value: 'mixto', label: 'Mixto' },
];

const MODALITIES = [
  { value: 'online', label: 'Online' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'hibrido', label: 'Híbrido' },
];

const emptyModule = () => ({ id: null, title: '', video_url: '', duration_minutes: '', is_free_preview: false });

const CourseEditorPage = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [courseStatus, setCourseStatus] = useState('draft');
  const [specialties, setSpecialties] = useState([]);
  const [coverUploading, setCoverUploading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    short_description: '',
    description: '',
    specialty_id: '',
    course_type: 'curso',
    level: 'intermedio',
    format: 'grabado',
    modality: 'online',
    hours: '',
    price: '',
    cover_image_url: '',
    start_date: '',
    end_date: '',
    external_platform_url: '',
  });

  const [modules, setModules] = useState([emptyModule()]);

  useEffect(() => {
    supabase.from('specialties').select('id, name').order('name').then(({ data }) => {
      setSpecialties(data || []);
    });
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    fetchCourseById(id)
      .then(course => {
        setCourseStatus(course.status);
        setForm({
          title: course.title || '',
          short_description: course.short_description || '',
          description: course.description || '',
          specialty_id: course.specialty_id?.toString() || '',
          course_type: course.course_type || 'curso',
          level: course.level || 'intermedio',
          format: course.format || 'grabado',
          modality: course.modality || 'online',
          hours: course.hours?.toString() || '',
          price: course.price?.toString() || '',
          cover_image_url: course.cover_image_url || '',
          start_date: course.start_date || '',
          end_date: course.end_date || '',
          external_platform_url: course.external_platform_url || '',
        });
        if (course.modules?.length > 0) {
          setModules(course.modules.sort((a, b) => a.sort_order - b.sort_order));
        }
      })
      .catch(err => toast({ title: 'Error al cargar', description: err.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [id, isEdit, toast]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('course-images').upload(path, file, { upsert: true });
    if (error) {
      toast({ title: 'Error al subir imagen', description: error.message, variant: 'destructive' });
    } else {
      const { data: { publicUrl } } = supabase.storage.from('course-images').getPublicUrl(path);
      handleChange('cover_image_url', publicUrl);
    }
    setCoverUploading(false);
  };

  const buildPayload = () => ({
    instructor_id: user.id,
    title: form.title,
    short_description: form.short_description || null,
    description: form.description || null,
    specialty_id: form.specialty_id ? Number(form.specialty_id) : null,
    course_type: form.course_type,
    level: form.level,
    format: form.format,
    modality: form.modality,
    hours: form.hours ? Number(form.hours) : null,
    price: form.price !== '' ? Number(form.price) : 0,
    cover_image_url: form.cover_image_url || null,
    start_date: (form.format === 'vivo' || form.format === 'mixto') ? form.start_date || null : null,
    end_date: (form.format === 'vivo' || form.format === 'mixto') ? form.end_date || null : null,
    external_platform_url: (form.format === 'grabado' || form.format === 'mixto') ? form.external_platform_url || null : null,
  });

  const saveModules = async (courseId) => {
    const validModules = modules.filter(m => m.title.trim());
    for (let i = 0; i < validModules.length; i++) {
      const m = validModules[i];
      await upsertModule({
        ...(m.id ? { id: m.id } : {}),
        course_id: courseId,
        title: m.title,
        video_url: m.video_url || null,
        duration_minutes: m.duration_minutes ? Number(m.duration_minutes) : null,
        is_free_preview: m.is_free_preview || false,
        sort_order: i + 1,
      });
    }
  };

  const handleSaveDraft = async () => {
    if (!form.title) return toast({ title: 'El título es obligatorio', variant: 'destructive' });
    setSaving(true);
    try {
      let courseId = id;
      if (isEdit) {
        await updateCourse(id, { ...buildPayload(), status: 'draft' });
      } else {
        const created = await createCourse(buildPayload());
        courseId = created.id;
      }
      if (form.format === 'grabado' || form.format === 'mixto') {
        await saveModules(courseId);
      }
      toast({ title: '✅ Borrador guardado' });
      if (!isEdit) navigate(`/dashboard/therapist/educator/${courseId}/edit`);
    } catch (err) {
      toast({ title: 'Error al guardar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!form.title) return toast({ title: 'El título es obligatorio', variant: 'destructive' });
    setSaving(true);
    try {
      let courseId = id;
      if (!isEdit) {
        const created = await createCourse(buildPayload());
        courseId = created.id;
      } else {
        await updateCourse(id, buildPayload());
      }
      if (form.format === 'grabado' || form.format === 'mixto') {
        await saveModules(courseId);
      }
      await submitForReview(courseId);
      setCourseStatus('pending_review');
      toast({ title: '📤 Enviado a revisión', description: 'DentalSpot revisará tu curso en 24-48h.' });
      navigate('/dashboard/therapist/educator');
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await updateCourse(id, buildPayload());
      if (form.format === 'grabado' || form.format === 'mixto') await saveModules(id);
      toast({ title: '✅ Curso actualizado' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Module handlers
  const addModule = () => setModules(prev => [...prev, emptyModule()]);
  const updateModuleField = (idx, field, value) => {
    setModules(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };
  const removeModule = async (idx, moduleId) => {
    if (moduleId) {
      try { await deleteModule(moduleId); } catch { /* ignore */ }
    }
    setModules(prev => prev.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const showDateFields = form.format === 'vivo' || form.format === 'mixto';
  const showPlatformUrl = form.format === 'grabado' || form.format === 'mixto';
  const showModules = form.format === 'grabado' || form.format === 'mixto';
  const isApproved = courseStatus === 'approved';

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/therapist/educator')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <GraduationCap className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{isEdit ? 'Editar Curso' : 'Nuevo Curso'}</h1>
            <p className="text-sm text-muted-foreground">Completa todos los campos antes de enviar a revisión.</p>
          </div>
        </div>
      </div>

      {/* Información Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-emerald-700">Información Principal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label style={{ color: '#ff74c3' }}>Título del Curso *</Label>
            <Input value={form.title} onChange={e => handleChange('title', e.target.value)} placeholder="Ej: Evaluación del Lenguaje en Preescolares" />
          </div>
          <div className="space-y-2">
            <Label style={{ color: '#ff74c3' }}>Descripción Corta <span className="text-xs text-muted-foreground">(máx. 200 chars — aparece en cards)</span></Label>
            <Input
              value={form.short_description}
              onChange={e => handleChange('short_description', e.target.value.slice(0, 200))}
              placeholder="Breve descripción para mostrar en la tienda..."
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">{form.short_description.length}/200</p>
          </div>
          <div className="space-y-2">
            <Label style={{ color: '#ff74c3' }}>Descripción Completa</Label>
            <Textarea
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Descripción detallada: objetivos, a quién va dirigido, requisitos previos..."
              rows={5}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clasificación */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-emerald-700">Clasificación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label style={{ color: '#ff74c3' }}>Especialidad</Label>
              <Select value={form.specialty_id} onValueChange={v => handleChange('specialty_id', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {specialties.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#ff74c3' }}>Tipo</Label>
              <Select value={form.course_type} onValueChange={v => handleChange('course_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{COURSE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#ff74c3' }}>Nivel</Label>
              <Select value={form.level} onValueChange={v => handleChange('level', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#ff74c3' }}>Formato</Label>
              <Select value={form.format} onValueChange={v => handleChange('format', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FORMATS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#ff74c3' }}>Modalidad</Label>
              <Select value={form.modality} onValueChange={v => handleChange('modality', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MODALITIES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#ff74c3' }}>Horas Totales</Label>
              <Input type="number" min="0" value={form.hours} onChange={e => handleChange('hours', e.target.value)} placeholder="Ej: 8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Precio e Imagen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-emerald-700">Precio e Imagen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label style={{ color: '#ff74c3' }}>Precio CLP <span className="text-xs text-muted-foreground">(0 = gratuito)</span></Label>
              <Input type="number" min="0" value={form.price} onChange={e => handleChange('price', e.target.value)} placeholder="Ej: 25000" />
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#ff74c3' }}>Imagen de Portada</Label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      {coverUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      {coverUploading ? 'Subiendo...' : 'Subir imagen'}
                    </span>
                  </Button>
                </label>
                {form.cover_image_url && (
                  <img src={form.cover_image_url} alt="portada" className="h-12 w-20 object-cover rounded-lg border" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fechas (vivo/mixto) */}
      {showDateFields && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-emerald-700">Fechas del Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label style={{ color: '#ff74c3' }}>Fecha de Inicio</Label>
                <Input type="date" value={form.start_date} onChange={e => handleChange('start_date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label style={{ color: '#ff74c3' }}>Fecha de Fin</Label>
                <Input type="date" value={form.end_date} onChange={e => handleChange('end_date', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plataforma externa (grabado/mixto) */}
      {showPlatformUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-emerald-700">Plataforma del Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label style={{ color: '#ff74c3' }}>URL de la plataforma</Label>
              <Input
                value={form.external_platform_url}
                onChange={e => handleChange('external_platform_url', e.target.value)}
                placeholder="Ej: https://teachable.com/mi-curso o https://hotmart.com/mi-curso"
              />
              <p className="text-xs text-muted-foreground">Link donde los alumnos accederán al contenido (Teachable, Hotmart, Zoom, etc.)</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Módulos (grabado/mixto) */}
      {showModules && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base text-emerald-700">Módulos / Lecciones</CardTitle>
            <Button variant="outline" size="sm" onClick={addModule} className="border-emerald-400 text-emerald-700 hover:bg-emerald-50">
              <PlusCircle className="mr-2 h-4 w-4" /> Agregar módulo
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {modules.map((mod, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <GripVertical className="h-5 w-5 text-muted-foreground mt-2 flex-shrink-0" />
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr,1fr,auto,auto] gap-2 items-center">
                  <Input
                    placeholder="Título del módulo"
                    value={mod.title}
                    onChange={e => updateModuleField(idx, 'title', e.target.value)}
                  />
                  <Input
                    placeholder="URL de video (opcional)"
                    value={mod.video_url}
                    onChange={e => updateModuleField(idx, 'video_url', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Min."
                    className="w-20"
                    value={mod.duration_minutes}
                    onChange={e => updateModuleField(idx, 'duration_minutes', e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={mod.is_free_preview}
                      onCheckedChange={v => updateModuleField(idx, 'is_free_preview', v)}
                      id={`preview-${idx}`}
                    />
                    <Label htmlFor={`preview-${idx}`} className="text-xs text-muted-foreground whitespace-nowrap">Gratis</Label>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 flex-shrink-0"
                  onClick={() => removeModule(idx, mod.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" onClick={() => navigate('/dashboard/therapist/educator')} disabled={saving}>
          Cancelar
        </Button>

        {isApproved ? (
          <Button onClick={handleUpdate} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? 'Actualizando...' : 'Actualizar'}
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={handleSaveDraft} disabled={saving} className="border-gray-400">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar borrador
            </Button>
            <Button onClick={handleSubmitForReview} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Enviar a revisión
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default CourseEditorPage;
