import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Send, Upload, X, ImageIcon, Loader2, FolderOpen, Plus, Trash2, HelpCircle, ChevronDown, Search as SearchIcon, Globe, Quote } from 'lucide-react';
import { useBlogEditor } from '../hooks/useBlogEditor';
import { useBlogCategories } from '../hooks/useBlogCategories';
import { blogApi } from '../api/blogApi';
import BlogEditor from '../components/BlogEditor';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/utils/logger';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const BlogEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [initialLoading, setInitialLoading] = useState(!!id);
  const { categories } = useBlogCategories();
  const { toast } = useToast();
  const { user } = useAuth();

  // Pre-fill from question if coming from Q&A
  useEffect(() => {
    if (!id) {
      const questionId = searchParams.get('question_id');
      const questionTitle = searchParams.get('title');
      const questionBody = searchParams.get('body');
      if (questionTitle) updateField('title', questionTitle);
      if (questionBody) updateField('content', questionBody);
      if (questionId) updateField('question_id', questionId);
    }
  }, []);

  // Image upload & library state
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryImages, setLibraryImages] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(path);
      updateField('featured_image', publicUrl);
      toast({ title: 'Imagen subida' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error al subir imagen', description: err.message });
    } finally {
      setUploading(false);
    }
  };

  const loadLibrary = async () => {
    setLibraryLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('blog-images')
        .list(user.id, { limit: 50, sortBy: { column: 'created_at', order: 'desc' } });
      if (error) throw error;
      const images = (data || [])
        .filter(f => !f.name.startsWith('.'))
        .map(f => {
          const { data: { publicUrl } } = supabase.storage
            .from('blog-images')
            .getPublicUrl(`${user.id}/${f.name}`);
          return { name: f.name, url: publicUrl, created: f.created_at };
        });
      setLibraryImages(images);
    } catch (err) {
      logger.error('Error loading library:', err);
    } finally {
      setLibraryLoading(false);
    }
  };

  const openLibrary = () => {
    setLibraryOpen(true);
    loadLibrary();
  };

  const selectFromLibrary = (url) => {
    updateField('featured_image', url);
    setLibraryOpen(false);
    toast({ title: 'Imagen seleccionada' });
  };

  const {
    formData, 
    updateField, 
    validate, 
    isSaving, 
    setIsSaving,
    reset
  } = useBlogEditor();

  useEffect(() => {
    if (id) {
      const loadPost = async () => {
        try {
          const post = await blogApi.fetchPostById(id);
          reset(post); // Reset hook state with fetched data but passing it as initialData logic
          // Actually useBlogEditor takes initialData in constructor, but to update it dynamically we might need a reset effect or setFormData exposed
          // My hook exposed 'reset' but reset usually resets to initial.
          // Let's just manually update fields or fix hook. 
          // Simplified: manually update state via a batch update if available or one by one.
          // Better: The hook's useEffect watches initialData if passed as prop. 
          // But here we fetch it inside the component.
          // Let's assume reset works or update manually.
          // Workaround for this implementation:
          Object.keys(post).forEach(key => updateField(key, post[key]));
        } catch (err) {
          toast({ variant: "destructive", title: "Error", description: "No se pudo cargar el artículo." });
          navigate('/admin/blog');
        } finally {
          setInitialLoading(false);
        }
      };
      loadPost();
    }
  }, [id, navigate, toast]); // Removed updateField from deps to avoid loop if unstable ref

  const handleSave = async (status = 'draft') => {
    if (!validate()) return;
    
    setIsSaving(true);
    try {
      const dataToSave = { ...formData, status };
      
      // Asegurar author_id en posts nuevos
      if (!id && user?.id) {
        dataToSave.author_id = user.id;
      }

      if (id) {
        await blogApi.updatePost(id, dataToSave);
        toast({ title: "Artículo actualizado" });
      } else {
        const newPost = await blogApi.createPost(dataToSave);
        toast({ title: "Artículo creado" });
        if (status === 'draft') {
          navigate(`/admin/blog/${newPost.id}`);
        } else {
          navigate('/admin/blog');
        }
      }
    } catch (err) {
      logger.error('[BlogEditor] Save error:', err);
      toast({ variant: "destructive", title: "Error", description: err.message || "No se pudo guardar el artículo." });
    } finally {
      setIsSaving(false);
    }
  };

  if (initialLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/blog')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{id ? 'Editar Artículo' : 'Nuevo Artículo'}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave('draft')} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" /> Guardar Borrador
          </Button>
          <Button onClick={() => handleSave('published')} disabled={isSaving}>
            <Send className="mr-2 h-4 w-4" /> Publicar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título del artículo</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => {
                const title = e.target.value;
                updateField('title', title);
                // Auto-generar slug si no fue editado manualmente
                if (!formData._slugManuallyEdited) {
                  const slug = title
                    .toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '')
                    .slice(0, 80);
                  updateField('slug', slug);
                }
              }}
              placeholder="Ej: Los beneficios de la terapia..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtítulo</Label>
            <Input
              id="subtitle"
              value={formData.subtitle || ''}
              onChange={(e) => updateField('subtitle', e.target.value)}
              placeholder="Breve descripción que acompaña al título"
            />
          </div>

          <BlogEditor
            value={formData.content}
            onChange={(val) => updateField('content', val)}
            isSaving={isSaving}
          />

          {/* FAQ Section (AEO - Answer Engine Optimization) */}
          <div className="p-4 border rounded-lg bg-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-teal-600" />
                <div>
                  <h3 className="font-medium">Preguntas Frecuentes (FAQ)</h3>
                  <p className="text-xs text-muted-foreground">Mejora tu SEO y posicionamiento en motores de respuesta (AEO)</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const faq = [...(formData.faq || []), { question: '', answer: '' }];
                  updateField('faq', faq);
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Agregar pregunta
              </Button>
            </div>

            {(formData.faq || []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
                Sin preguntas FAQ. Agrega preguntas para mejorar tu posicionamiento.
              </p>
            )}

            <div className="space-y-3">
              {(formData.faq || []).map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3 bg-slate-50/50">
                  <div className="flex items-start gap-2">
                    <ChevronDown className="h-4 w-4 text-slate-400 mt-2.5 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Input
                        value={item.question}
                        onChange={(e) => {
                          const faq = [...(formData.faq || [])];
                          faq[index] = { ...faq[index], question: e.target.value };
                          updateField('faq', faq);
                        }}
                        placeholder="¿Pregunta frecuente?"
                        className="font-medium"
                      />
                      <textarea
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={item.answer}
                        onChange={(e) => {
                          const faq = [...(formData.faq || [])];
                          faq[index] = { ...faq[index], answer: e.target.value };
                          updateField('faq', faq);
                        }}
                        placeholder="Respuesta concisa..."
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 shrink-0"
                      onClick={() => {
                        const faq = (formData.faq || []).filter((_, i) => i !== index);
                        updateField('faq', faq);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="p-4 border rounded-lg bg-card space-y-4">
             <h3 className="font-medium">Configuración</h3>
             
             <div className="space-y-2">
               <Label>Categoría</Label>
               <Select 
                 value={formData.category_id} 
                 onValueChange={(val) => updateField('category_id', val)}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Seleccionar..." />
                 </SelectTrigger>
                 <SelectContent>
                   {categories.map(cat => (
                     <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

             <div className="space-y-2">
               <Label>Slug URL</Label>
               <Input 
                 value={formData.slug} 
                 onChange={(e) => {
                   updateField('slug', e.target.value);
                   updateField('_slugManuallyEdited', true);
                 }} 
                 placeholder="url-amigable-articulo"
               />
             </div>

             <div className="space-y-2">
               <Label>Descripción Corta (SEO)</Label>
               <textarea 
                 className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                 value={formData.description}
                 onChange={(e) => updateField('description', e.target.value)}
               />
             </div>
             
             <div className="space-y-2">
               <Label>Imagen Destacada</Label>
               {formData.featured_image ? (
                 <div className="relative rounded-lg overflow-hidden border">
                   <img src={formData.featured_image} alt="Destacada" className="w-full h-40 object-cover" />
                   <button
                     type="button"
                     onClick={() => updateField('featured_image', '')}
                     className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                   >
                     <X className="h-3 w-3" />
                   </button>
                 </div>
               ) : (
                 <div className="space-y-2">
                   <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                     {uploading ? (
                       <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                     ) : (
                       <>
                         <Upload className="h-6 w-6 text-slate-400 mb-1" />
                         <span className="text-xs text-slate-500">Subir imagen</span>
                       </>
                     )}
                     <input
                       type="file"
                       className="hidden"
                       accept="image/*"
                       onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                       disabled={uploading}
                     />
                   </label>
                   <Button variant="outline" size="sm" className="w-full" onClick={openLibrary}>
                     <FolderOpen className="h-4 w-4 mr-2" /> Biblioteca de imágenes
                   </Button>
                 </div>
               )}
             </div>
           </div>

           {/* Shareable Quote */}
           <div className="p-4 border rounded-lg bg-card space-y-3">
             <div className="flex items-center gap-2">
               <Quote className="h-4 w-4 text-pink-500" />
               <h3 className="font-medium">Frase Compartible</h3>
             </div>
             <textarea
               className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm italic"
               value={formData.shareable_quote || ''}
               onChange={(e) => updateField('shareable_quote', e.target.value)}
               placeholder="Una frase potente del artículo para compartir en redes..."
               maxLength={280}
             />
             <p className="text-[10px] text-muted-foreground text-right">{(formData.shareable_quote || '').length}/280</p>
             {formData.shareable_quote && (
               <div className="border rounded-lg p-4 bg-gradient-to-br from-pink-50 to-purple-50">
                 <p className="text-sm italic text-gray-700 leading-relaxed">"{formData.shareable_quote}"</p>
                 <p className="text-[10px] text-muted-foreground mt-2">— vía dentalspot.cl</p>
               </div>
             )}
           </div>

           {/* SEO Metadata */}
           <div className="p-4 border rounded-lg bg-card space-y-4">
             <div className="flex items-center gap-2">
               <Globe className="h-4 w-4 text-blue-600" />
               <h3 className="font-medium">SEO & Metadata</h3>
             </div>

             <div className="space-y-2">
               <Label className="text-xs text-muted-foreground">Meta Título <span className="text-[10px]">({(formData.meta_title || formData.title || '').length}/60)</span></Label>
               <Input
                 value={formData.meta_title || ''}
                 onChange={(e) => updateField('meta_title', e.target.value)}
                 placeholder={formData.title || 'Título para buscadores'}
                 maxLength={60}
               />
             </div>

             <div className="space-y-2">
               <Label className="text-xs text-muted-foreground">Meta Descripción <span className="text-[10px]">({(formData.meta_description || formData.description || '').length}/160)</span></Label>
               <textarea
                 className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                 value={formData.meta_description || ''}
                 onChange={(e) => updateField('meta_description', e.target.value)}
                 placeholder={formData.description || 'Descripción para resultados de búsqueda'}
                 maxLength={160}
               />
             </div>

             <div className="space-y-2">
               <Label className="text-xs text-muted-foreground">Keywords <span className="text-[10px]">(separadas por coma)</span></Label>
               <Input
                 value={(formData.keywords || []).join(', ')}
                 onChange={(e) => updateField('keywords', e.target.value.split(',').map(k => k.trim()).filter(Boolean))}
                 placeholder="odontología, terapia, lenguaje"
               />
             </div>

             {/* Preview Google */}
             <div className="border rounded-lg p-3 bg-white space-y-1">
               <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Vista previa en Google</p>
               <p className="text-blue-700 text-sm font-medium truncate">
                 {formData.meta_title || formData.title || 'Título del artículo'}
               </p>
               <p className="text-green-700 text-xs truncate">
                 dentalspot.cl/blog/{formData.slug || 'url-del-articulo'}
               </p>
               <p className="text-xs text-gray-600 line-clamp-2">
                 {formData.meta_description || formData.description || 'Descripción del artículo que aparecerá en los resultados de búsqueda...'}
               </p>
             </div>
           </div>
        </div>
      </div>

      {/* Image Library Modal */}
      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Biblioteca de Imágenes</DialogTitle>
          </DialogHeader>
          {libraryLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : libraryImages.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No hay imágenes en tu biblioteca</p>
              <p className="text-xs text-slate-400 mt-1">Sube imágenes usando el botón de upload</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {libraryImages.map((img) => (
                <button
                  key={img.name}
                  onClick={() => selectFromLibrary(img.url)}
                  className="group relative rounded-lg overflow-hidden border hover:border-primary hover:shadow-md transition-all aspect-square"
                >
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Seleccionar
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogEditorPage;