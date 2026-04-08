
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { updateQuestionStatus } from '@/features/therapist/api/therapistQuestionsApi';
import { fetchArticleById } from '@/features/therapist/api/therapistBlogApi';
import { 
  Save, 
  ArrowLeft, 
  Image as ImageIcon, 
  Upload, 
  X, 
  Eye, 
  Edit3, 
  Bold, 
  Italic, 
  List, 
  Link as LinkIcon, 
  Heading as HeadingIcon, 
  Quote, 
  CheckCircle2,
  AlertCircle,
  Globe,
  Search,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import logger from '@/lib/utils/logger';
import { cn } from '@/lib/utils';


const ToolbarButton = ({ icon: Icon, onClick, tooltip, active }) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onClick}
    className={cn("h-8 w-8 p-0", active && "bg-muted text-foreground")}
    title={tooltip}
  >
    <Icon className="h-4 w-4" />
  </Button>
);

const BlogArticleEditorPage = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const questionId = searchParams.get('questionId');
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [question, setQuestion] = useState(null);
  
  const [activeTab, setActiveTab] = useState('write');
  const [coverImage, setCoverImage] = useState(null);
  const textareaRef = useRef(null);

  const isEditMode = !!id;

  const { register, handleSubmit, setValue, watch, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      title: '',
      content: '',
      status: 'draft',
      category: '',
      excerpt: '',
      metaTitle: '',
      metaDescription: '',
      keywords: ''
    }
  });

  const content = watch('content');
  const title = watch('title');

  // Load article if in edit mode
  useEffect(() => {
    if (!isEditMode) return;
    setLoading(true);
    fetchArticleById(id)
      .then(data => {
        setValue('title', data.title || '');
        setValue('content', data.content || '');
        setValue('excerpt', data.excerpt || '');
        setValue('status', data.status || 'draft');
        setValue('category', data.category || '');
        setValue('keywords', data.keywords || '');
        if (data.cover_url) setCoverImage(data.cover_url);
      })
      .catch(err => logger.error('Error loading article:', err))
      .finally(() => setLoading(false));
  }, [id, isEditMode, setValue]);

  // Load question data if questionId is present
  useEffect(() => {
    const fetchQ = async () => {
      if (!questionId) return;
      setLoadingQuestion(true);
      try {
        const { data, error } = await supabase
          .from('patient_questions')
          .select('id, title, body, patient:profiles!patient_questions_patient_id_fkey(full_name)')
          .eq('id', questionId)
          .single();

        if (error) throw error;
        if (data) {
          setQuestion(data);
          const patientName = data.patient?.full_name || 'Paciente';
          setValue('title', `Respuesta a: ${data.title}`);
          setValue('content', `> **Consulta de ${patientName}:** ${data.body}\n\n`);
        }
      } catch (err) {
        logger.error('Error fetching question:', err);
      } finally {
        setLoadingQuestion(false);
      }
    };
    fetchQ();
  }, [questionId, setValue]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverImage(url);
      toast({
        title: "Imagen cargada",
        description: "La imagen de portada se ha actualizado correctamente.",
      });
    }
  };

  const removeCoverImage = () => {
    setCoverImage(null);
  };

  const insertFormat = (format) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    let newText = '';
    let newCursorPos = start;

    switch (format) {
      case 'bold':
        newText = `${before}**${selection || 'texto en negrita'}**${after}`;
        newCursorPos = start + 2;
        break;
      case 'italic':
        newText = `${before}*${selection || 'texto en cursiva'}*${after}`;
        newCursorPos = start + 1;
        break;
      case 'h2':
        newText = `${before}\n## ${selection || 'Subtítulo'}\n${after}`;
        newCursorPos = start + 4;
        break;
      case 'h3':
        newText = `${before}\n### ${selection || 'Sección'}\n${after}`;
        newCursorPos = start + 5;
        break;
      case 'list':
        newText = `${before}\n- ${selection || 'Elemento de lista'}${after}`;
        newCursorPos = start + 3;
        break;
      case 'quote':
        newText = `${before}\n> ${selection || 'Cita'}\n${after}`;
        newCursorPos = start + 3;
        break;
      case 'link':
        newText = `${before}[${selection || 'texto del enlace'}](url)${after}`;
        newCursorPos = start + 1;
        break;
      default:
        return;
    }

    setValue('content', newText, { shouldDirty: true });
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos + (selection.length || (newText.length - text.length - (format === 'h2' ? 5 : 2)))); 
    }, 0);
  };

  const onSubmit = async (data) => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
      
      const payload = {
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        status: 'pending_review',
        question_id: questionId || null,
        author_id: user.id
      };

      if (isEditMode) {
        const { error } = await supabase.from('blog_posts').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        // Check if a post already exists for this question (unique constraint on question_id)
        if (questionId) {
          const { data: existing } = await supabase
            .from('blog_posts')
            .select('id')
            .eq('question_id', questionId)
            .maybeSingle();

          if (existing) {
            // Update existing post instead of inserting
            const { error } = await supabase.from('blog_posts').update(payload).eq('id', existing.id);
            if (error) throw error;
          } else {
            payload.slug = slug;
            const { error } = await supabase.from('blog_posts').insert([payload]);
            if (error) throw error;
          }
        } else {
          payload.slug = slug;
          const { error } = await supabase.from('blog_posts').insert([payload]);
          if (error) throw error;
        }
      }

      if (questionId) {
        await updateQuestionStatus(questionId, 'answered');
      }

      toast({
        title: isEditMode ? "Artículo actualizado" : "Artículo creado",
        description: "El artículo ha sido enviado a revisión (pending_review).",
      });

      if (!isEditMode) {
        navigate('/dashboard/therapist/blog');
      }
    } catch (err) {
      logger.error('Error saving blog post:', err);
      toast({
        title: "Error al guardar",
        description: err?.message || "Hubo un problema al guardar tu artículo. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const autoGenerateSEO = () => {
    const currentTitle = watch('title');
    const currentExcerpt = watch('excerpt');
    
    if (currentTitle) setValue('metaTitle', currentTitle);
    if (currentExcerpt) setValue('metaDescription', currentExcerpt);
    
    toast({
      title: "SEO Autocompletado",
      description: "Se han generado sugerencias basadas en tu contenido.",
    });
  };

  if ((loading && isEditMode && !content) || loadingQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10 bg-background/95 backdrop-blur py-4 border-b">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" onClick={() => navigate('/dashboard/therapist/blog')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditMode ? 'Editar Artículo' : 'Nuevo Artículo'}
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span className={cn(
                "inline-block w-2 h-2 rounded-full",
                watch('status') === 'published' ? "bg-green-500" : "bg-yellow-500"
              )} />
              {watch('status') === 'published' ? 'Publicado' : 'Borrador'} 
              {isDirty && <span className="text-xs italic">(Cambios sin guardar)</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setActiveTab(activeTab === 'write' ? 'preview' : 'write')}>
            {activeTab === 'write' ? <Eye className="mr-2 h-4 w-4" /> : <Edit3 className="mr-2 h-4 w-4" />}
            {activeTab === 'write' ? 'Vista Previa' : 'Editar'}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isEditMode ? 'Guardar Cambios' : 'Guardar Artículo'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Title Section */}
          <Card className="border-none shadow-none bg-transparent">
            <CardContent className="p-0 space-y-4">
              <div className="space-y-2">
                <Input
                  {...register('title', { required: 'El título es obligatorio' })}
                  placeholder="Título del artículo..."
                  className="text-2xl md:text-3xl font-bold h-auto py-3 px-4 border-none bg-white shadow-sm ring-offset-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
                />
                {errors.title && <span className="text-red-500 text-sm ml-4">{errors.title.message}</span>}
              </div>
            </CardContent>
          </Card>

          {/* Editor Section */}
          <Card className="min-h-[500px] flex flex-col overflow-hidden border shadow-sm">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="border-b bg-slate-50/50 px-4 py-2 flex items-center justify-between">
                <TabsList className="bg-transparent p-0 h-auto">
                  <TabsTrigger value="write" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-3 py-1.5 h-auto text-xs font-medium">Escribir</TabsTrigger>
                  <TabsTrigger value="preview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-3 py-1.5 h-auto text-xs font-medium">Vista Previa</TabsTrigger>
                </TabsList>
                
                {activeTab === 'write' && (
                  <div className="flex items-center gap-1 bg-white rounded-md border p-1 shadow-sm">
                    <ToolbarButton icon={Bold} onClick={() => insertFormat('bold')} tooltip="Negrita (Ctrl+B)" />
                    <ToolbarButton icon={Italic} onClick={() => insertFormat('italic')} tooltip="Cursiva (Ctrl+I)" />
                    <Separator orientation="vertical" className="h-4 mx-1" />
                    <ToolbarButton icon={HeadingIcon} onClick={() => insertFormat('h2')} tooltip="Título" />
                    <ToolbarButton icon={Quote} onClick={() => insertFormat('quote')} tooltip="Cita" />
                    <ToolbarButton icon={List} onClick={() => insertFormat('list')} tooltip="Lista" />
                    <Separator orientation="vertical" className="h-4 mx-1" />
                    <ToolbarButton icon={LinkIcon} onClick={() => insertFormat('link')} tooltip="Enlace" />
                  </div>
                )}
              </div>

              <div className="flex-1 bg-white relative">
                <TabsContent value="write" className="h-full mt-0 absolute inset-0">
                  <Textarea
                    {...register('content', { required: 'El contenido es obligatorio' })}
                    ref={(e) => {
                      register('content').ref(e);
                      textareaRef.current = e;
                    }}
                    className="h-full w-full resize-none border-none focus-visible:ring-0 p-6 text-base leading-relaxed font-mono"
                    placeholder="Escribe tu artículo aquí... Usa Markdown para dar formato."
                  />
                </TabsContent>
                <TabsContent value="preview" className="h-full mt-0 overflow-y-auto p-8 prose prose-slate max-w-none">
                  {content ? (
                    <ReactMarkdown>{content}</ReactMarkdown>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                      <Edit3 className="h-12 w-12 mb-4" />
                      <p>Escribe contenido para ver la vista previa</p>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </Card>

          {/* Excerpt Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Extracto</CardTitle>
              <CardDescription>Un breve resumen que aparecerá en las tarjetas de blog.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                {...register('excerpt')} 
                placeholder="Escribe un resumen atractivo de 1-2 oraciones..."
                className="resize-none" 
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings Column */}
        <div className="space-y-6">
          
          {/* Publication Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-4 h-4" /> Publicación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select 
                  onValueChange={(val) => setValue('status', val)} 
                  defaultValue={watch('status')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="archived">Archivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select 
                  onValueChange={(val) => setValue('category', val)} 
                  defaultValue={watch('category')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lenguaje-infantil">Lenguaje Infantil</SelectItem>
                    <SelectItem value="habla-adultos">Habla Adultos</SelectItem>
                    <SelectItem value="neurorehabilitacion">Neurorehabilitación</SelectItem>
                    <SelectItem value="voz">Voz</SelectItem>
                    <SelectItem value="deglucion">Deglución</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Imagen Destacada
              </CardTitle>
            </CardHeader>
            <CardContent>
              {coverImage ? (
                <div className="relative rounded-lg overflow-hidden group border aspect-video">
                  <img src={coverImage} alt="Portada" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button type="button" variant="destructive" size="sm" onClick={removeCoverImage}>
                      <X className="w-4 h-4 mr-2" /> Quitar imagen
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleImageUpload}
                  />
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                    <Upload className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">Subir imagen</p>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF hasta 2MB</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="w-4 h-4" /> SEO
                </CardTitle>
                <Button type="button" variant="ghost" size="xs" onClick={autoGenerateSEO} className="h-6 text-xs">
                  Autogenerar
                </Button>
              </div>
              <CardDescription>Optimiza tu artículo para buscadores.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Meta Título</Label>
                <Input {...register('metaTitle')} placeholder="Título para Google..." className="h-8 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Meta Descripción</Label>
                <Textarea {...register('metaDescription')} placeholder="Descripción corta para resultados de búsqueda..." className="h-20 text-sm resize-none" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Palabras Clave</Label>
                <Input {...register('keywords')} placeholder="Ej: odontología, niños..." className="h-8 text-sm" />
                <p className="text-[10px] text-muted-foreground">Separa las palabras con comas.</p>
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="p-4">
              <h4 className="font-medium text-blue-800 flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4" /> Tips de escritura
              </h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Usa títulos claros y cortos.</li>
                <li>Divide el texto en párrafos pequeños.</li>
                <li>Incluye listas para facilitar la lectura.</li>
                <li>Revisa la ortografía antes de publicar.</li>
              </ul>
            </CardContent>
          </Card>

        </div>
      </div>
    </form>
  );
};

export default BlogArticleEditorPage;
