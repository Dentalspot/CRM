import React, { useState, useEffect, useRef } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ArrowLeft, AlertTriangle, Loader2, Save, Upload, X, ImageIcon,
  FileText as FileTextIcon, Plus, Trash2, TrendingUp, TrendingDown,
  PackageOpen, Link2, Eye, Search, Sparkles
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useMarketplaceAccess } from '@/features/marketplace/hooks/useMarketplaceAccess';
import MarketplaceAccessAlert from '@/components/MarketplaceAccessAlert';
import RichTextEditor from '@/components/shared/RichTextEditor';
import AiDescriptionButton from '@/features/marketplace/components/AiDescriptionButton';
import AiImageButton from '@/features/marketplace/components/AiImageButton';
import logger from '@/lib/utils/logger';

const ITEM_TYPES = [
  { value: 'material', label: 'Material' },
  { value: 'template', label: 'Plantilla' },
  { value: 'plan', label: 'Plan Terapéutico' },
  { value: 'course', label: 'Curso' },
];

const SUGGESTED_CATEGORIES = [
  'Articulación', 'Lenguaje', 'TEL', 'TEA', 'Motricidad Orofacial',
  'Deglución', 'Voz', 'Fluencia', 'Lectoescritura', 'Cursos',
  'Evaluación', 'Estimulación Temprana', 'Otro'
];

// ─── Reusable Product Linker Component ───
const ProductLinker = ({ label, description, icon, color, selectedIds, products, searchTerm, onAdd, onRemove }) => {
  const available = products.filter(p =>
    !selectedIds.includes(p.id) &&
    (!searchTerm || p.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const selected = products.filter(p => selectedIds.includes(p.id));

  return (
    <div className="space-y-2 pb-4 border-b last:border-b-0 last:pb-0">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <h4 className="font-semibold text-sm text-gray-900">{label}</h4>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>

      {/* Selected */}
      {selected.length > 0 && (
        <div className="space-y-1.5 ml-6">
          {selected.map(p => (
            <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border text-sm">
              {p.image_url ? (
                <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
              ) : (
                <div className="h-8 w-8 rounded bg-slate-200 shrink-0" />
              )}
              <span className="flex-1 truncate text-gray-700">{p.title}</span>
              <span className="text-xs text-gray-400">${(p.price || 0).toLocaleString('es-CL')}</span>
              <button type="button" onClick={() => onRemove(p.id)} className="text-red-400 hover:text-red-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add dropdown */}
      {available.length > 0 && (
        <div className="ml-6">
          <Select onValueChange={(val) => onAdd(val)}>
            <SelectTrigger className="h-8 text-xs w-64">
              <SelectValue placeholder={`+ Agregar ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {available.slice(0, 20).map(p => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <span className="truncate">{p.title}</span>
                    <span className="text-xs text-gray-400 ml-auto">${(p.price || 0).toLocaleString('es-CL')}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

const TherapistEditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { canSell, restrictions, isLoading: accessLoading } = useMarketplaceAccess();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState(null);

  // Form state
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    badge_text: '',
    description: '',
    price: '',
    discount_price: '',
    sku: '',
    item_type: '',
    categories: [],
    target_age_min: '',
    target_age_max: '',
    language: 'Español',
    image_url: '',
    gallery_urls: [],
    sample_pdf_url: '',
    track_quantity: false,
    hide_add_to_cart: false,
    upsell_ids: [],
    downsell_ids: [],
    bundle_ids: [],
    related_ids: [],
    ai_benefits: [],
    ai_target_audience: [],
    ai_use_cases: [],
  });

  // Upload states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Category input
  const [categoryInput, setCategoryInput] = useState('');

  // Cross-selling: all seller products (for linking)
  const [sellerProducts, setSellerProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    if (id && user?.id) loadProduct();
  }, [id, user?.id]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('marketplace_items')
        .select('*')
        .eq('id', id)
        .eq('seller_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast({ variant: 'destructive', title: 'Producto no encontrado' });
        navigate('/dashboard/therapist/marketplace/products');
        return;
      }

      setProduct(data);

      // Load seller's other products for cross-selling
      const { data: otherProducts } = await supabase
        .from('marketplace_items')
        .select('id, title, price, image_url, item_type')
        .eq('seller_id', user.id)
        .neq('id', id)
        .order('title');
      setSellerProducts(otherProducts || []);

      // Parse categories
      let categories = [];
      if (data.category) {
        categories = typeof data.category === 'string'
          ? data.category.split(',').map(c => c.trim()).filter(Boolean)
          : Array.isArray(data.category) ? data.category : [];
      }

      // Parse gallery
      let galleryUrls = [];
      if (data.gallery_urls) {
        galleryUrls = Array.isArray(data.gallery_urls) ? data.gallery_urls : [];
      }

      setForm({
        title: data.title || '',
        subtitle: data.subtitle || '',
        badge_text: data.badge_text || '',
        description: data.description || '',
        price: data.price?.toString() || '',
        discount_price: data.discount_price?.toString() || '',
        sku: data.sku || '',
        item_type: data.item_type || '',
        categories,
        target_age_min: data.target_age_min?.toString() || '',
        target_age_max: data.target_age_max?.toString() || '',
        language: data.language || 'Español',
        image_url: data.image_url || '',
        gallery_urls: galleryUrls,
        sample_pdf_url: data.sample_pdf_url || '',
        track_quantity: data.track_quantity || false,
        hide_add_to_cart: data.hide_add_to_cart || false,
        upsell_ids: data.upsell_ids || [],
        downsell_ids: data.downsell_ids || [],
        bundle_ids: data.bundle_ids || [],
        related_ids: data.related_ids || [],
        ai_benefits: data.ai_benefits || [],
        ai_target_audience: data.ai_target_audience || [],
        ai_use_cases: data.ai_use_cases || [],
      });
    } catch (err) {
      logger.error('Error loading product:', err);
      toast({ variant: 'destructive', title: 'Error al cargar producto' });
    } finally {
      setLoading(false);
    }
  };

  // ─── Save ───
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
      const updateData = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        badge_text: form.badge_text.trim() || null,
        description: form.description || null,
        price: Number(form.price),
        discount_price: form.discount_price ? Number(form.discount_price) : null,
        sku: form.sku.trim() || null,
        item_type: form.item_type || null,
        category: form.categories.join(', ') || null,
        target_age_min: form.target_age_min ? Number(form.target_age_min) : null,
        target_age_max: form.target_age_max ? Number(form.target_age_max) : null,
        language: form.language || null,
        image_url: form.image_url || null,
        gallery_urls: form.gallery_urls.length > 0 ? form.gallery_urls : null,
        sample_pdf_url: form.sample_pdf_url || null,
        track_quantity: form.track_quantity,
        hide_add_to_cart: form.hide_add_to_cart,
        upsell_ids: form.upsell_ids.length > 0 ? form.upsell_ids : null,
        downsell_ids: form.downsell_ids.length > 0 ? form.downsell_ids : null,
        bundle_ids: form.bundle_ids.length > 0 ? form.bundle_ids : null,
        related_ids: form.related_ids.length > 0 ? form.related_ids : null,
        ai_benefits: form.ai_benefits?.length > 0 ? form.ai_benefits : null,
        ai_target_audience: form.ai_target_audience?.length > 0 ? form.ai_target_audience : null,
        ai_use_cases: form.ai_use_cases?.length > 0 ? form.ai_use_cases : null,
        ai_generated_at: form.ai_benefits?.length > 0 ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      if (product.status === 'rejected') {
        updateData.status = 'pending';
      }

      const { error } = await supabase
        .from('marketplace_items')
        .update(updateData)
        .eq('id', id)
        .eq('seller_id', user.id);

      if (error) throw error;

      toast({ title: product.status === 'rejected' ? 'Producto reenviado para revisión' : 'Producto actualizado' });
      navigate('/dashboard/therapist/marketplace/products');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error al guardar', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  // ─── Helpers ───
  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file, type) => {
    const isImage = type === 'image';
    const isGallery = type === 'gallery';
    const setter = isImage ? setUploadingImage : isGallery ? setUploadingGallery : setUploadingPdf;
    setter(true);

    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${id}/${type}-${Date.now()}.${ext}`;

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
    setForm(prev => ({
      ...prev,
      gallery_urls: prev.gallery_urls.filter((_, i) => i !== index)
    }));
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

  // ─── Loading ───
  if (loading) {
    return (
      <div className="flex-1 bg-slate-50/50 min-h-screen p-6 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-[600px] w-full max-w-4xl mx-auto" />
      </div>
    );
  }

  if (!product) return null;

  // ─── Render ───
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 min-h-screen">
      <DashboardHeader title={`Editar producto`} description={form.title || 'Sin título'} />

      <main className="p-6 space-y-6 max-w-4xl mx-auto w-full">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="pl-0" asChild>
            <Link to="/dashboard/therapist/marketplace/products">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver a mis productos
            </Link>
          </Button>
          <div className="flex gap-2">
            <Badge variant={product.status === 'approved' ? 'default' : product.status === 'rejected' ? 'destructive' : 'secondary'}>
              {product.status === 'approved' ? 'Activo' : product.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
            </Badge>
          </div>
        </div>

        {!canSell && !accessLoading && <MarketplaceAccessAlert restrictions={restrictions} />}

        {/* Rejection feedback */}
        {product.status === 'rejected' && product.admin_feedback && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800 font-semibold">Producto Rechazado</AlertTitle>
            <AlertDescription className="text-yellow-800 mt-1">
              <strong>Motivo:</strong> {product.admin_feedback}<br />
              Corrige los problemas y guarda para reenviar a revisión.
            </AlertDescription>
          </Alert>
        )}

        {/* ═══════════════════════════════════════════
            SECTION 1: Media
        ═══════════════════════════════════════════ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Multimedia</CardTitle>
            <CardDescription>Imagen principal y galería del producto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              {/* Main image */}
              {form.image_url ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border group shrink-0">
                  <img src={form.image_url} alt="Principal" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleChange('image_url', '')}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center py-0.5">Principal</span>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors shrink-0">
                  {uploadingImage ? (
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  ) : (
                    <>
                      <ImageIcon className="h-6 w-6 text-slate-300 mb-1" />
                      <span className="text-[10px] text-slate-500 text-center px-2">Imagen principal</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'image')} disabled={uploadingImage} />
                </label>
              )}

              {/* Gallery images */}
              {form.gallery_urls.map((url, i) => (
                <div key={i} className="relative w-32 h-32 rounded-lg overflow-hidden border group shrink-0">
                  <img src={url} alt={`Galería ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {/* Add more gallery */}
              <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors shrink-0">
                {uploadingGallery ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-slate-300 mb-1" />
                    <span className="text-[10px] text-slate-500 text-center px-2 uppercase tracking-wide font-medium">Añadir multimedia</span>
                  </>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'gallery')} disabled={uploadingGallery} />
              </label>
            </div>

            {/* AI Image Generator */}
            {!form.image_url && form.gallery_urls.length === 0 && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200 flex items-center justify-between">
                <p className="text-sm text-purple-700">¿Sin imagen? Genera una con inteligencia artificial</p>
                <AiImageButton
                  item={{ id: itemId, title: form.title, description: form.description, category: form.category, item_type: form.item_type }}
                  onImageGenerated={(url, galleryUrls) => {
                    setForm(prev => ({ ...prev, image_url: url, gallery_urls: galleryUrls || [url] }));
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════
            SECTION 2: Basic Info
        ═══════════════════════════════════════════ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información del producto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
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
                  itemType={form.item_type}
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
              <RichTextEditor
                value={form.description}
                onChange={(val) => handleChange('description', val)}
                placeholder="Describe tu producto en detalle..."
              />
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════
            SECTION: SEO & Conversión (IA)
        ═══════════════════════════════════════════ */}
        {(form.ai_benefits?.length > 0 || form.ai_target_audience?.length > 0 || form.ai_use_cases?.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                SEO y Conversión (IA)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.ai_benefits?.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">✅ Beneficios</Label>
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
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">👥 Audiencia objetivo</Label>
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
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">💡 Casos de uso</Label>
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

        {/* ═══════════════════════════════════════════
            SECTION 3: Pricing
        ═══════════════════════════════════════════ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Precios</CardTitle>
          </CardHeader>
          <CardContent>
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
                {form.discount_price && form.price && Number(form.discount_price) < Number(form.price) && (
                  <p className="text-xs text-green-600">Tu precio final con el descuento aplicado.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e) => handleChange('sku', e.target.value)} placeholder="Código único" />
              </div>
            </div>

            <div className="flex items-center gap-8 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Switch checked={form.track_quantity} onCheckedChange={(v) => handleChange('track_quantity', v)} />
                <Label className="text-sm cursor-pointer">Hacer seguimiento de la cantidad</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.hide_add_to_cart} onCheckedChange={(v) => handleChange('hide_add_to_cart', v)} />
                <Label className="text-sm cursor-pointer">Ocultar botón "Añadir al carrito"</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════
            SECTION 4: Categories
        ═══════════════════════════════════════════ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categorías</CardTitle>
            <CardDescription>Usa categorías para organizar tus productos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {form.categories.map((cat) => (
                <Badge key={cat} variant="secondary" className="gap-1 pr-1">
                  {cat}
                  <button type="button" onClick={() => removeCategory(cat)} className="ml-1 hover:text-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <div className="flex items-center gap-1">
                <Input
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory(categoryInput); } }}
                  placeholder="Agregar categoría..."
                  className="h-7 w-48 text-sm"
                />
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => addCategory(categoryInput)} disabled={!categoryInput.trim()}>
                  <Plus className="h-3 w-3 mr-1" /> Agregar
                </Button>
              </div>
            </div>

            {/* Suggested */}
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-2">Sugerencias:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_CATEGORIES.filter(c => !form.categories.includes(c)).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => addCategory(cat)}
                    className="text-xs px-2 py-1 rounded-full border border-dashed hover:border-primary hover:text-primary transition-colors"
                  >
                    + {cat}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════
            SECTION 5: Details
        ═══════════════════════════════════════════ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalles adicionales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de producto</Label>
                <Select value={form.item_type} onValueChange={(val) => handleChange('item_type', val)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Idioma</Label>
                <Input value={form.language} onChange={(e) => handleChange('language', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
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

        {/* ═══════════════════════════════════════════
            SECTION 6: PDF
        ═══════════════════════════════════════════ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Archivo de muestra</CardTitle>
            <CardDescription>Sube un PDF de muestra para que los compradores puedan previsualizar</CardDescription>
          </CardHeader>
          <CardContent>
            {form.sample_pdf_url ? (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
                <FileTextIcon className="h-5 w-5 text-red-500 shrink-0" />
                <a href={form.sample_pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate flex-1">
                  Ver PDF de muestra
                </a>
                <button type="button" onClick={() => handleChange('sample_pdf_url', '')} className="text-red-500 hover:text-red-700">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-3 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                {uploadingPdf ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-slate-400" />
                    <span className="text-sm text-slate-500">Subir PDF de muestra</span>
                  </>
                )}
                <input type="file" className="hidden" accept=".pdf" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'pdf')} disabled={uploadingPdf} />
              </label>
            )}
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════
            SECTION 7: Cross-selling & Related
        ═══════════════════════════════════════════ */}
        {sellerProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estrategias de venta</CardTitle>
              <CardDescription>Vincula productos para aumentar tus ventas con upselling, downselling y bundles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Buscar entre tus productos..."
                  className="pl-9"
                />
              </div>

              {/* Upselling */}
              <ProductLinker
                label="Upselling"
                description="Ofrece una versión mejor o más completa de este producto"
                icon={<TrendingUp className="h-4 w-4 text-green-600" />}
                color="green"
                selectedIds={form.upsell_ids}
                products={sellerProducts}
                searchTerm={productSearch}
                onAdd={(pid) => handleChange('upsell_ids', [...form.upsell_ids, pid])}
                onRemove={(pid) => handleChange('upsell_ids', form.upsell_ids.filter(i => i !== pid))}
              />

              {/* Downselling */}
              <ProductLinker
                label="Downselling"
                description="Si no compran este, ofrece una alternativa más económica"
                icon={<TrendingDown className="h-4 w-4 text-amber-600" />}
                color="amber"
                selectedIds={form.downsell_ids}
                products={sellerProducts}
                searchTerm={productSearch}
                onAdd={(pid) => handleChange('downsell_ids', [...form.downsell_ids, pid])}
                onRemove={(pid) => handleChange('downsell_ids', form.downsell_ids.filter(i => i !== pid))}
              />

              {/* Bundling */}
              <ProductLinker
                label="Bundle / Paquete"
                description="Agrupa productos complementarios como solución completa"
                icon={<PackageOpen className="h-4 w-4 text-purple-600" />}
                color="purple"
                selectedIds={form.bundle_ids}
                products={sellerProducts}
                searchTerm={productSearch}
                onAdd={(pid) => handleChange('bundle_ids', [...form.bundle_ids, pid])}
                onRemove={(pid) => handleChange('bundle_ids', form.bundle_ids.filter(i => i !== pid))}
              />

              {/* Related Products */}
              <ProductLinker
                label="Productos relacionados"
                description="Muestra productos similares o complementarios en la página del producto"
                icon={<Link2 className="h-4 w-4 text-blue-600" />}
                color="blue"
                selectedIds={form.related_ids}
                products={sellerProducts}
                searchTerm={productSearch}
                onAdd={(pid) => handleChange('related_ids', [...form.related_ids, pid])}
                onRemove={(pid) => handleChange('related_ids', form.related_ids.filter(i => i !== pid))}
              />
            </CardContent>
          </Card>
        )}

        {/* ═══════════════════════════════════════════
            SAVE BAR
        ═══════════════════════════════════════════ */}
        <div className="flex justify-between items-center py-4 border-t sticky bottom-0 bg-slate-50/95 backdrop-blur-sm">
          <Button variant="outline" asChild>
            <Link to="/dashboard/therapist/marketplace/products">Cancelar</Link>
          </Button>
          <Button onClick={handleSave} disabled={saving || !canSell} size="lg">
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> {product.status === 'rejected' ? 'Guardar y reenviar' : 'Guardar cambios'}</>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default TherapistEditProductPage;
