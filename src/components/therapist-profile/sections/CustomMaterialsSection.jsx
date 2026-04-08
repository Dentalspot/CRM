import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileSectionCard from '@/components/therapist-profile/ProfileSectionCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Edit, PlusCircle, Save, Tag, FileText, Trash2, Loader2, Upload, X, Store, CheckCircle2, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

// Import ListingForm for marketplace publishing
import ListingForm from '@/features/marketplace/components/ListingForm';
import logger from '@/lib/utils/logger';

const MATERIAL_CATEGORIES = [
  { value: 'articulacion', label: 'Articulación' },
  { value: 'lenguaje_comprensivo', label: 'Lenguaje Comprensivo' },
  { value: 'lenguaje_expresivo', label: 'Lenguaje Expresivo' },
  { value: 'deglucion', label: 'Deglución' },
  { value: 'voz', label: 'Voz' },
  { value: 'fluidez', label: 'Fluidez' },
  { value: 'lectoescritura', label: 'Lectoescritura' },
  { value: 'motricidad_orofacial', label: 'Motricidad Orofacial' },
  { value: 'estimulacion', label: 'Estimulación Temprana' },
  { value: 'otros', label: 'Otros' },
];

const CATEGORY_COLORS = {
  articulacion: 'bg-red-100 text-red-700',
  lenguaje_comprensivo: 'bg-blue-100 text-blue-700',
  lenguaje_expresivo: 'bg-green-100 text-green-700',
  deglucion: 'bg-orange-100 text-orange-700',
  voz: 'bg-purple-100 text-purple-700',
  fluidez: 'bg-pink-100 text-pink-700',
  lectoescritura: 'bg-yellow-100 text-yellow-700',
  motricidad_orofacial: 'bg-teal-100 text-teal-700',
  estimulacion: 'bg-indigo-100 text-indigo-700',
  otros: 'bg-gray-100 text-gray-700',
};

const CustomMaterialsSection = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, material: null });

  // Marketplace states
  const [listingModalOpen, setListingModalOpen] = useState(false);
  const [selectedMaterialForListing, setSelectedMaterialForListing] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    material_name: '',
    category: '',
    description: '',
    file: null,
    fileName: ''
  });

  useEffect(() => {
    if (user?.id) {
      loadMaterials();
    }
  }, [user?.id]);

  const loadMaterials = async () => {
    try {
      setLoading(true);

      // Load materials with marketplace status
      const { data, error } = await supabase
        .from('therapist_materials')
        .select('*')
        .eq('therapist_id', user.id)
        .order('category')
        .order('material_name');

      if (error) throw error;

      // Try to get marketplace items linked to these materials
      if (data && data.length > 0) {
        const materialIds = data.map(m => m.id);

        const { data: marketplaceData } = await supabase
          .from('marketplace_items')
          .select('id, therapist_material_id, is_active, is_approved')
          .in('therapist_material_id', materialIds);

        // Merge marketplace status
        const materialsWithMarketplace = data.map(material => ({
          ...material,
          marketplace_item: marketplaceData?.find(mp => mp.therapist_material_id === material.id) || null
        }));

        setMaterials(materialsWithMarketplace);
      } else {
        setMaterials(data || []);
      }
    } catch (error) {
      logger.error('Error loading materials:', error);
      toast({ variant: "destructive", title: "Error al cargar materiales" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      material_name: '',
      category: '',
      description: '',
      file: null,
      fileName: ''
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenNew = () => {
    setEditingMaterial(null);
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEdit = (material) => {
    setEditingMaterial(material);
    setFormData({
      material_name: material.material_name || '',
      category: material.category || '',
      description: material.description || '',
      file: null,
      fileName: material.file_name || ''
    });
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Archivo muy grande", description: "Máximo 50MB" });
        return;
      }
      setFormData(prev => ({ ...prev, file, fileName: file.name }));
    }
  };

  const handleSaveMaterial = async () => {
    if (!formData.material_name.trim()) {
      toast({ variant: "destructive", title: "El nombre es requerido" });
      return;
    }

    if (!editingMaterial && !formData.file) {
      toast({ variant: "destructive", title: "Selecciona un archivo" });
      return;
    }

    setSaving(true);
    try {
      let fileUrl = editingMaterial?.file_url;

      // Upload new file if selected
      if (formData.file) {
        const fileExt = formData.file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('therapist_documents')
          .upload(fileName, formData.file);

        if (uploadError) {
           if (uploadError.statusCode === '403' || uploadError.message.includes('row-level security')) {
             throw new Error('Permiso denegado: No puedes subir archivos a este almacenamiento.');
           }
           throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('therapist_documents')
          .getPublicUrl(fileName);

        fileUrl = publicUrl;

        // Delete old file if editing
        if (editingMaterial?.file_url) {
          try {
            const url = new URL(editingMaterial.file_url);
            const pathParts = url.pathname.split('/');
            const bucketIndex = pathParts.indexOf('therapist_documents');
            if (bucketIndex !== -1) {
              const oldPath = pathParts.slice(bucketIndex + 1).join('/');
              await supabase.storage.from('therapist_documents').remove([oldPath]);
            }
          } catch (e) {
            logger.error("Error parsing old file URL for deletion", e);
          }
        }
      }

      const materialData = {
        therapist_id: user.id,
        material_name: formData.material_name.trim(),
        category: formData.category || null,
        description: formData.description.trim() || null,
        file_url: fileUrl,
        updated_at: new Date().toISOString()
      };

      if (editingMaterial?.id) {
        const { error } = await supabase
          .from('therapist_materials')
          .update(materialData)
          .eq('id', editingMaterial.id);
        if (error) throw error;
        toast({ title: "✅ Material actualizado" });
      } else {
        materialData.created_at = new Date().toISOString();
        const { error } = await supabase
          .from('therapist_materials')
          .insert(materialData);
        if (error) throw error;
        toast({ title: "✅ Material agregado" });
      }

      setModalOpen(false);
      loadMaterials();
    } catch (error) {
      logger.error('Error saving material:', error);
      toast({ variant: "destructive", title: "Error al guardar", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMaterial = async () => {
    if (!deleteConfirm.material) return;

    try {
      // Delete file from storage
      if (deleteConfirm.material.file_url) {
        try {
          const url = new URL(deleteConfirm.material.file_url);
          const pathParts = url.pathname.split('/');
          const bucketIndex = pathParts.indexOf('therapist_documents');
          if (bucketIndex !== -1) {
            const storagePath = pathParts.slice(bucketIndex + 1).join('/');
            await supabase.storage.from('therapist_documents').remove([storagePath]);
          }
        } catch (e) {
          logger.error("Error parsing file URL for deletion", e);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('therapist_materials')
        .delete()
        .eq('id', deleteConfirm.material.id);

      if (error) throw error;

      toast({ title: "✅ Material eliminado" });
      loadMaterials();
    } catch (error) {
      toast({ variant: "destructive", title: "Error al eliminar", description: error.message });
    } finally {
      setDeleteConfirm({ open: false, material: null });
    }
  };

  const handleDownload = (material) => {
    if (material.file_url) {
      window.open(material.file_url, '_blank');
    } else {
      toast({ variant: "destructive", title: "Archivo no disponible" });
    }
  };

  // ============================================
  // MARKETPLACE HANDLERS
  // ============================================

  const handlePublishClick = (material) => {
    const listingData = {
      name: material.material_name,
      description: material.description,
      item_type: 'material',
      category: 'material',
      therapist_material_id: material.id,
    };
    setSelectedMaterialForListing(listingData);
    setListingModalOpen(true);
  };

  const handleListingSuccess = () => {
    loadMaterials();
    setListingModalOpen(false);
    toast({ title: "🎉 Material publicado en el Marketplace" });
  };

  const getCategoryLabel = (value) => {
    return MATERIAL_CATEGORIES.find(c => c.value === value)?.label || value || 'Sin categoría';
  };

  // Group materials by category
  const materialsByCategory = materials.reduce((acc, m) => {
    const cat = m.category || 'otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(m);
    return acc;
  }, {});

  return (
    <>
      <ProfileSectionCard
        id="custom-materials"
        title="Descargables"
        description="Sube y organiza tus propios materiales didácticos y terapéuticos."
      >
        <div className="mb-6 flex justify-end">
          <Button onClick={handleOpenNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Agregar Descargable
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">Aún no has subido materiales personalizados.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Sube PDFs, imágenes, documentos y más.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(materialsByCategory).map(([category, categoryMaterials]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={CATEGORY_COLORS[category] || 'bg-gray-100'}>
                    {getCategoryLabel(category)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {categoryMaterials.length} material{categoryMaterials.length !== 1 ? 'es' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryMaterials.map((material) => {
                    const isPublished = material.marketplace_item?.is_active && material.marketplace_item?.is_approved;
                    const isPending = material.marketplace_item && !material.marketplace_item.is_approved;

                    return (
                      <Card key={material.id} className="flex flex-col group">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base flex items-start gap-2 flex-1">
                              <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{material.material_name}</span>
                            </CardTitle>

                            {/* Dropdown Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenEdit(material)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownload(material)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Descargar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {!isPublished && !isPending && (
                                  <DropdownMenuItem onClick={() => handlePublishClick(material)}>
                                    <Store className="h-4 w-4 mr-2" />
                                    Publicar en Marketplace
                                  </DropdownMenuItem>
                                )}
                                {isPublished && (
                                  <DropdownMenuItem onClick={() => navigate(`/dashboard/marketplace/listings/${material.marketplace_item.id}`)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver en Tienda
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteConfirm({ open: true, material })}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-grow pb-2">
                          {material.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {material.description}
                            </p>
                          )}

                          {/* Marketplace Status Badge */}
                          {isPublished && (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              En Marketplace
                            </Badge>
                          )}
                          {isPending && (
                            <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                              Pendiente de aprobación
                            </Badge>
                          )}
                        </CardContent>
                        <CardFooter className="pt-2 border-t flex justify-between gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDownload(material)}
                          >
                            <Download className="mr-1 h-4 w-4" /> Descargar
                          </Button>

                          {/* Publish Button */}
                          {!isPublished && !isPending ? (
                            <Button
                              size="sm"
                              className={cn(
                                "flex-1",
                                "bg-gradient-to-r from-amber-400 to-orange-400",
                                "hover:from-amber-500 hover:to-orange-500",
                                "text-white border-0"
                              )}
                              onClick={() => handlePublishClick(material)}
                            >
                              <Store className="mr-1 h-4 w-4" /> Vender
                            </Button>
                          ) : isPublished ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                              onClick={() => navigate(`/dashboard/marketplace/listings/${material.marketplace_item.id}`)}
                            >
                              <Eye className="mr-1 h-3 w-3" /> Ver en Tienda
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled
                              className="flex-1 bg-yellow-50 text-yellow-700 border border-yellow-200"
                            >
                              Pendiente
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ProfileSectionCard>

      {/* Add/Edit Material Modal */}
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? 'Editar Material' : 'Agregar Nuevo Material'}
            </DialogTitle>
            <DialogDescription>
              Completa los detalles de tu material personalizado.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="material-name">Nombre del Material *</Label>
              <Input
                id="material-name"
                value={formData.material_name}
                onChange={(e) => setFormData(prev => ({ ...prev, material_name: e.target.value }))}
                placeholder="Ej: Láminas de fonema /s/"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="material-category">Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
              >
                <SelectTrigger id="material-category">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="material-description">Descripción</Label>
              <Textarea
                id="material-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Breve descripción del material y su uso."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="material-file">
                Archivo {!editingMaterial && '*'}
              </Label>
              <Input
                id="material-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.mp4,.mp3"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              {formData.fileName && (
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <FileText className="h-3 w-3" />
                  {formData.fileName}
                  {formData.file && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, file: null, fileName: editingMaterial?.file_name || '' }));
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                PDF, Imágenes, Word, Excel, PowerPoint, Audio, Video (máx. 50MB)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMaterial} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {editingMaterial ? 'Guardar Cambios' : 'Agregar Material'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => !open && setDeleteConfirm({ open: false, material: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Material</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar "{deleteConfirm.material?.material_name}"?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMaterial}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Marketplace Listing Modal */}
      <ListingForm
        isOpen={listingModalOpen}
        onClose={() => setListingModalOpen(false)}
        initialData={selectedMaterialForListing}
        onSuccess={handleListingSuccess}
      />
    </>
  );
};

export default CustomMaterialsSection;