import React, { useState } from 'react';
import { useMarketplaceAccess } from '@/features/marketplace/hooks/useMarketplaceAccess';
import MarketplaceAccessAlert from '@/components/MarketplaceAccessAlert';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft, Download, Briefcase, CalendarCheck, Heart,
  Gift, Printer, Package, ChevronRight, Loader2, Save,
  Upload, X, ImageIcon, FileText as FileTextIcon, Plus, Sparkles
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import RichTextEditor from '@/components/shared/RichTextEditor';
import AiDescriptionButton from '@/features/marketplace/components/AiDescriptionButton';

// ─── Product Types ───
const PRODUCT_TYPES = [
  {
    value: 'material',
    label: 'Producto Físico',
    description: 'Productos tangibles — el comprador coordina la entrega directamente con el vendedor',
    icon: Package,
    subtype: 'physical',
  },
  {
    value: 'material',
    label: 'Descargable',
    description: 'Productos que se pueden descargar a través de un link después de la compra',
    icon: Download,
    subtype: 'digital',
  },
  {
    value: 'material',
    label: 'Plantilla',
    description: 'Material imprimible o de referencia para terapeutas y familias',
    icon: Package,
    subtype: 'template',
  },
  {
    value: 'evaluation',
    label: 'Planificación / Evaluación',
    description: 'Planes estructurados con sesiones, objetivos clínicos o evaluaciones',
    icon: Briefcase,
  },
  {
    value: 'course',
    label: 'Curso',
    description: 'Contenido educativo con módulos y lecciones',
    icon: CalendarCheck,
  },
  {
    value: 'service',
    label: 'Mentoría',
    description: 'Ofrece tu experiencia o habilidades como un producto',
    icon: Briefcase,
  },
  {
    value: 'print_on_demand',
    label: 'Impresión bajo demanda',
    description: 'Crea un producto con tu diseño personalizado — se imprime y envía al comprador',
    icon: Printer,
    badge: 'Nuevo',
  },
  {
    value: 'donation',
    label: 'Donación',
    description: 'Recoge donaciones para tu campaña o causa',
    icon: Heart,
  },
];

const SUGGESTED_CATEGORIES = [
  'Articulación', 'Lenguaje', 'TEL', 'TEA', 'Motricidad Orofacial',
  'Deglución', 'Voz', 'Fluencia', 'Lectoescritura', 'Cursos',
  'Evaluación', 'Estimulación Temprana', 'Otro'
];

const TherapistCreateProductPage = () => {
  const { canSell, restrictions, isLoading: accessLoading } = useMarketplaceAccess();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Step: 'type-select' or 'form'
  const [step, setStep] = useState('type-select');
  const [selectedType, setSelectedType] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    badge_text: '',
    description: '',
    price: '',
    discount_price: '',
    sku: '',
    categories: [],
    target_age_min: '',
    target_age_max: '',
    language: 'Español',
    image_url: '',
    gallery_urls: [],
    sample_pdf_url: '',
    track_quantity: false,
    hide_add_to_cart: false,
    ai_benefits: [],
    ai_target_audience: [],
    ai_use_cases: [],
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [categoryInput, setCategoryInput] = useState('');

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSelectType = (type) => {
    setSelectedType(type);
    setStep('form');
  };

  const handleFileUpload = async (file, type) => {
    const isImage = type === 'image';
    const isGallery = type === 'gallery';
    const setter = isImage ? setUploadingImage : isGallery ? setUploadingGallery : setUploadingPdf;
    setter(true);

    try {
      const ext = file.name.split('.').pop();
      const tempId = Date.now();
      const path = `${user.id}/new-${tempId}/${type}-${tempId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('marketplace')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('marketplace')
        .getPublicUrl(path);

      if (isImage) {
        setForm(prev => ({ ...prev, image_url: publicUrl }));
      } else if (isGallery) {
        setForm(prev => ({ ...prev, gallery_urls: [...prev.gallery_urls, publicUrl] }));
      } else {
        setForm(prev => ({ ...prev, sample_pdf_url: publicUrl }));
      }
      toast({ title: 'Archivo subido' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error al subir', description: err.message });
    } finally {
      setter(false);
    }
  };

  const removeGalleryImage = (index) => {
    setForm(prev => ({ ...prev, gallery_urls: prev.gallery_urls.filter((_, i) => i !== index) }));
  };

  const addCategory = (cat) => {
    const trimmed = cat.trim();
    if (trimmed && !form.categories.includes(trimmed)) {
      setForm(prev => ({ ...prev, categories: [...prev.categories, trimmed] }));
    }
    setCategoryInput('');
  };

  const removeCategory = (cat) => {
    setForm(prev => ({ ...prev, categories: prev.categories.filter(c => c !== cat) }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ variant: 'destructive', title: 'El nombre es obligatorio' });
      return;
    }
    if (!form.price || isNaN(Number(form.price))) {
      toast({ variant: 'destructive', title: 'Ingresa un precio válido' });
      return;
    }

    setSaving(true);
    try {
      const insertData = {
        seller_id: user.id,
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        badge_text: form.badge_text.trim() || null,
        description: form.description || null,
        price: Number(form.price),
        discount_price: form.discount_price ? Number(form.discount_price) : null,
        sku: form.sku.trim() || null,
        item_type: selectedType.value,
        category: form.categories.join(', ') || null,
        target_age_min: form.target_age_min ? Number(form.target_age_min) : null,
        target_age_max: form.target_age_max ? Number(form.target_age_max) : null,
        language: form.language || 'Español',
        image_url: form.image_url || null,
        gallery_urls: form.gallery_urls.length > 0 ? form.gallery_urls : null,
        sample_pdf_url: form.sample_pdf_url || null,
        track_quantity: form.track_quantity,
        hide_add_to_cart: form.hide_add_to_cart,
        ai_benefits: form.ai_benefits?.length > 0 ? form.ai_benefits : null,
        ai_target_audience: form.ai_target_audience?.length > 0 ? form.ai_target_audience : null,
        ai_use_cases: form.ai_use_cases?.length > 0 ? form.ai_use_cases : null,
        ai_generated_at: form.ai_benefits?.length > 0 ? new Date().toISOString() : null,
        status: 'pending',
        is_active: true,
        currency: 'CLP',
      };

      const { error } = await supabase
        .from('marketplace_items')
        .insert(insertData);

      if (error) throw error;

      toast({ title: 'Producto creado y enviado a revisión' });
      navigate('/dashboard/therapist/marketplace/products');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error al crear producto', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  // ═══════════════════════════════════════════
  // STEP 1: Type Selection
  // ═══════════════════════════════════════════
  if (step === 'type-select') {
    return (
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 min-h-screen">
        <DashboardHeader title="Publicar en Tienda" description="Elige el tipo de producto que quieres vender" />
        <main className="p-6 max-w-3xl mx-auto w-full">
          <Button variant="ghost" className="mb-6 pl-0" asChild>
            <Link to="/dashboard/therapist/marketplace/products">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver a mis productos
            </Link>
          </Button>

          {!canSell && !accessLoading && <MarketplaceAccessAlert restrictions={restrictions} className="mb-6" />}

          <h2 className="text-xl font-bold text-gray-900 mb-6">¿Qué quieres vender?</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PRODUCT_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => canSell && handleSelectType(type)}
                disabled={!canSell}
                className={`flex items-start gap-4 p-5 rounded-xl border bg-white text-left transition-all hover:shadow-md hover:border-primary/30 group ${!canSell ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <type.icon className="h-5 w-5 text-slate-600 group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{type.label}</h3>
                      {type.badge && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{type.badge}</Badge>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                </div>
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // STEP 2: Product Form
  // ═══════════════════════════════════════════
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 min-h-screen">
      <DashboardHeader title="Publicar en Tienda" description={`Tipo: ${selectedType.label}`} />

      <main className="p-6 space-y-6 max-w-4xl mx-auto w-full">
        <Button variant="ghost" className="pl-0" onClick={() => setStep('type-select')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Cambiar tipo de producto
        </Button>

        {/* Media */}
        <Card>
          <CardContent className="pt-6">
            <Label className="text-base font-semibold mb-3 block">Multimedia</Label>
            <div className="flex gap-4 flex-wrap">
              {form.image_url ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border group shrink-0">
                  <img src={form.image_url} alt="Principal" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => handleChange('image_url', '')} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                  <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center py-0.5">Principal</span>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 shrink-0">
                  {uploadingImage ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : <><ImageIcon className="h-6 w-6 text-slate-300 mb-1" /><span className="text-[10px] text-slate-500">Imagen principal</span></>}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')} disabled={uploadingImage} />
                </label>
              )}

              {form.gallery_urls.map((url, i) => (
                <div key={i} className="relative w-32 h-32 rounded-lg overflow-hidden border group shrink-0">
                  <img src={url} alt={`Galería ${i + 1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeGalleryImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 shrink-0">
                {uploadingGallery ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : <><Upload className="h-5 w-5 text-slate-300 mb-1" /><span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Añadir</span></>}
                <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'gallery')} disabled={uploadingGallery} />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardContent className="pt-6 space-y-5">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="Nombre de tu producto" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subtítulo</Label>
                <Input value={form.subtitle} onChange={(e) => handleChange('subtitle', e.target.value)} placeholder="Subtítulo de tu producto" />
              </div>
              <div className="space-y-2">
                <Label>Cinta / Badge</Label>
                <Input value={form.badge_text} onChange={(e) => handleChange('badge_text', e.target.value)} placeholder="Por ejemplo, NUEVO" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Descripción</Label>
                <AiDescriptionButton
                  title={form.title}
                  description={form.description}
                  itemType={selectedType}
                  category={form.categories?.[0] || ''}
                  targetAgeMin={form.target_age_min}
                  targetAgeMax={form.target_age_max}
                  onResult={(result) => {
                    handleChange('description', result.description);
                    if (result.benefits?.length) handleChange('ai_benefits', result.benefits);
                    if (result.target_audience?.length) handleChange('ai_target_audience', result.target_audience);
                    if (result.use_cases?.length) handleChange('ai_use_cases', result.use_cases);
                  }}
                />
              </div>
              <RichTextEditor value={form.description} onChange={(val) => handleChange('description', val)} placeholder="Describe tu producto en detalle..." />
            </div>
          </CardContent>
        </Card>

        {/* SEO & Conversión (IA) */}
        {(form.ai_benefits?.length > 0 || form.ai_target_audience?.length > 0 || form.ai_use_cases?.length > 0) && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                SEO y Conversión (IA)
              </Label>
              {form.ai_benefits?.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-700 mb-2 block">✅ Beneficios</Label>
                  <div className="flex flex-wrap gap-2">
                    {form.ai_benefits.map((b, i) => (
                      <Badge key={i} variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs py-1 px-2.5">
                        {b}
                        <button onClick={() => handleChange('ai_benefits', form.ai_benefits.filter((_, j) => j !== i))} className="ml-1.5 text-emerald-400 hover:text-red-500">×</button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {form.ai_target_audience?.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-700 mb-2 block">👥 Audiencia objetivo</Label>
                  <div className="flex flex-wrap gap-2">
                    {form.ai_target_audience.map((a, i) => (
                      <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs py-1 px-2.5">
                        {a}
                        <button onClick={() => handleChange('ai_target_audience', form.ai_target_audience.filter((_, j) => j !== i))} className="ml-1.5 text-blue-400 hover:text-red-500">×</button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {form.ai_use_cases?.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-700 mb-2 block">💡 Casos de uso</Label>
                  <div className="flex flex-wrap gap-2">
                    {form.ai_use_cases.map((u, i) => (
                      <Badge key={i} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs py-1 px-2.5">
                        {u}
                        <button onClick={() => handleChange('ai_use_cases', form.ai_use_cases.filter((_, j) => j !== i))} className="ml-1.5 text-purple-400 hover:text-red-500">×</button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pricing */}
        <Card>
          <CardContent className="pt-6">
            <Label className="text-base font-semibold mb-3 block">Precios</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Precio *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input type="number" className="pl-7" value={form.price} onChange={(e) => handleChange('price', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Precio de descuento</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input type="number" className="pl-7" value={form.discount_price} onChange={(e) => handleChange('discount_price', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e) => handleChange('sku', e.target.value)} placeholder="Código único" />
              </div>
            </div>
            <div className="flex items-center gap-8 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Switch checked={form.track_quantity} onCheckedChange={(v) => handleChange('track_quantity', v)} />
                <Label className="text-sm">Seguimiento de cantidad</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.hide_add_to_cart} onCheckedChange={(v) => handleChange('hide_add_to_cart', v)} />
                <Label className="text-sm">Ocultar "Añadir al carrito"</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-base font-semibold">Categorías</Label>
            <div className="flex flex-wrap gap-2">
              {form.categories.map((cat) => (
                <Badge key={cat} variant="secondary" className="gap-1 pr-1">
                  {cat}
                  <button type="button" onClick={() => removeCategory(cat)} className="ml-1 hover:text-red-600"><X className="h-3 w-3" /></button>
                </Badge>
              ))}
              <div className="flex items-center gap-1">
                <Input value={categoryInput} onChange={(e) => setCategoryInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory(categoryInput); } }} placeholder="Agregar..." className="h-7 w-40 text-sm" />
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => addCategory(categoryInput)} disabled={!categoryInput.trim()}>
                  <Plus className="h-3 w-3 mr-1" /> Agregar
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SUGGESTED_CATEGORIES.filter(c => !form.categories.includes(c)).map(cat => (
                <button key={cat} type="button" onClick={() => addCategory(cat)} className="text-xs px-2 py-1 rounded-full border border-dashed hover:border-primary hover:text-primary transition-colors">
                  + {cat}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardContent className="pt-6">
            <Label className="text-base font-semibold mb-3 block">Detalles adicionales</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Idioma</Label>
                <Input value={form.language} onChange={(e) => handleChange('language', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Edad mínima</Label>
                <Input type="number" value={form.target_age_min} onChange={(e) => handleChange('target_age_min', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Edad máxima</Label>
                <Input type="number" value={form.target_age_max} onChange={(e) => handleChange('target_age_max', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PDF */}
        <Card>
          <CardContent className="pt-6">
            <Label className="text-base font-semibold mb-3 block">Archivo de muestra</Label>
            {form.sample_pdf_url ? (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
                <FileTextIcon className="h-5 w-5 text-red-500 shrink-0" />
                <a href={form.sample_pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate flex-1">Ver PDF</a>
                <button type="button" onClick={() => handleChange('sample_pdf_url', '')} className="text-red-500"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <label className="flex items-center gap-3 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50">
                {uploadingPdf ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : <><Upload className="h-5 w-5 text-slate-400" /><span className="text-sm text-slate-500">Subir PDF de muestra</span></>}
                <input type="file" className="hidden" accept=".pdf" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'pdf')} disabled={uploadingPdf} />
              </label>
            )}
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex justify-between items-center py-4 border-t sticky bottom-0 bg-slate-50/95 backdrop-blur-sm">
          <Button variant="outline" onClick={() => setStep('type-select')}>Volver</Button>
          <Button onClick={handleSave} disabled={saving || !canSell} size="lg">
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando...</> : <><Save className="mr-2 h-4 w-4" /> Crear producto</>}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default TherapistCreateProductPage;
