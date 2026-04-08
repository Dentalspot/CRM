/**
 * ListingForm.jsx
 * 
 * Modal para publicar recursos en el Marketplace.
 * Soporta: planes, actividades, y materiales del terapeuta.
 * 
 * FIXES:
 * - Categoría ahora es editable
 * - seller_id se asigna correctamente para RLS
 * - Soporte para therapist_materials
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Store,
  DollarSign,
  Tag,
  FileText,
  Package,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import logger from '@/lib/utils/logger';
import { cn } from '@/lib/utils';

// ============================================
// CONSTANTS
// ============================================

const ITEM_CATEGORIES = [
  { value: 'plan', label: 'Plan de Tratamiento', icon: FileText },
  { value: 'activity', label: 'Actividad Terapéutica', icon: Sparkles },
  { value: 'material', label: 'Material Didáctico', icon: Package },
  { value: 'evaluation', label: 'Evaluación / Test', icon: CheckCircle2 },
  { value: 'resource', label: 'Recurso Educativo', icon: Tag },
];

const ITEM_TYPES = [
  { value: 'plan', label: 'Plan de Tratamiento' },
  { value: 'activity', label: 'Actividad' },
  { value: 'material', label: 'Material' },
  { value: 'bundle', label: 'Bundle / Paquete' },
];

const VISIBILITY_OPTIONS = [
  { value: 'draft', label: 'Borrador (Oculto)', description: 'Solo tú puedes verlo' },
  { value: 'active', label: 'Publicado', description: 'Visible en el marketplace' },
];

const COMMISSION_RATE = 0.30; // 30% comisión plataforma

// ============================================
// COMPONENT
// ============================================

const ListingForm = ({
  isOpen,
  onClose,
  initialData = null,
  onSuccess,
  listingId = null // Para edición
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    item_type: 'plan',
    category: 'plan',
    price: 5000,
    visibility: 'draft',
    // Source references
    plan_template_id: null,
    therapist_plan_template_id: null,
    therapist_material_id: null,
  });

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (isOpen && initialData) {
      // Pre-fill form with initial data
      // Note: initialData.name maps to title in DB
      setFormData({
        name: initialData.name || initialData.title || '',
        description: initialData.description || '',
        item_type: initialData.item_type || 'plan',
        category: initialData.category || initialData.item_type || 'plan',
        price: initialData.price || 5000,
        visibility: initialData.visibility || 'draft',
        // Source IDs
        plan_template_id: initialData.plan_template_id || null,
        therapist_plan_template_id: initialData.therapist_plan_template_id || initialData.source_id || null,
        therapist_material_id: initialData.therapist_material_id || null,
      });
    } else if (isOpen && !initialData) {
      // Reset form for new listing
      setFormData({
        name: '',
        description: '',
        item_type: 'plan',
        category: 'plan',
        price: 5000,
        visibility: 'draft',
        plan_template_id: null,
        therapist_plan_template_id: null,
        therapist_material_id: null,
      });
    }
  }, [isOpen, initialData]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateCommission = (price) => {
    const numPrice = parseFloat(price) || 0;
    return Math.round(numPrice * COMMISSION_RATE);
  };

  const calculateNetEarnings = (price) => {
    const numPrice = parseFloat(price) || 0;
    return Math.round(numPrice * (1 - COMMISSION_RATE));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // ============================================
  // SAVE
  // ============================================

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast({ variant: "destructive", title: "El título es obligatorio" });
      return;
    }

    if (!formData.price || formData.price < 0) {
      toast({ variant: "destructive", title: "El precio debe ser válido" });
      return;
    }

    if (!user?.id) {
      toast({ variant: "destructive", title: "Debes iniciar sesión" });
      return;
    }

    setSaving(true);
    try {
      const listingData = {
        // CRITICAL: seller_id debe ser el usuario actual para pasar RLS
        seller_id: user.id,
        title: formData.name.trim(), // La columna en BD es 'title', no 'name'
        description: formData.description.trim() || null,
        item_type: formData.item_type,
        category: formData.category,
        price: parseInt(formData.price) || 0,
        currency: 'CLP',
        is_active: formData.visibility === 'active',
        is_approved: false, // Requiere aprobación manual
        // Source references
        plan_template_id: formData.plan_template_id || null,
        therapist_plan_template_id: formData.therapist_plan_template_id || null,
        therapist_material_id: formData.therapist_material_id || null,
        updated_at: new Date().toISOString()
      };

      let result;

      if (listingId) {
        // Update existing listing
        const { data, error } = await supabase
          .from('marketplace_items')
          .update(listingData)
          .eq('id', listingId)
          .eq('seller_id', user.id) // Extra safety check
          .select()
          .single();

        if (error) throw error;
        result = data;
        toast({ title: "✅ Publicación actualizada" });
      } else {
        // Create new listing
        listingData.created_at = new Date().toISOString();

        const { data, error } = await supabase
          .from('marketplace_items')
          .insert(listingData)
          .select()
          .single();

        if (error) {
          logger.error('Insert error:', error);

          // Mensaje más específico para errores RLS
          if (error.message.includes('row-level security')) {
            throw new Error(
              'Error de permisos. Verifica que tu cuenta tenga rol de terapeuta y que las políticas RLS estén configuradas correctamente.'
            );
          }
          throw error;
        }

        result = data;
        toast({
          title: "🎉 ¡Publicación creada!",
          description: formData.visibility === 'active'
            ? "Tu recurso está pendiente de aprobación."
            : "Guardado como borrador."
        });
      }

      onSuccess?.(result);
      onClose();
    } catch (error) {
      logger.error('Error saving listing:', error);
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: error.message
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  const netEarnings = calculateNetEarnings(formData.price);
  const commission = calculateCommission(formData.price);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-amber-600" />
            Publicar en Marketplace
          </DialogTitle>
          <DialogDescription>
            Configura los detalles para vender tu recurso a otros profesionales.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Source Resource Badge */}
          {initialData && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Recurso seleccionado:
                  </p>
                  <p className="text-sm text-green-700">
                    {initialData.name}
                  </p>
                  {(initialData.duration_weeks || initialData.recommended_sessions) && (
                    <p className="text-xs text-green-600 mt-1">
                      {initialData.duration_weeks && `⏱ ${initialData.duration_weeks} semanas`}
                      {initialData.duration_weeks && initialData.recommended_sessions && ' · '}
                      {initialData.recommended_sessions && `📅 ${initialData.recommended_sessions} sesiones aprox.`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="listing-name">Título de la publicación *</Label>
            <Input
              id="listing-name"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="Ej: Plan de Intervención Fonológica"
            />
          </div>

          {/* Category - AHORA EDITABLE */}
          <div className="space-y-2">
            <Label htmlFor="listing-category">Categoría *</Label>
            <Select
              value={formData.category}
              onValueChange={(val) => handleFieldChange('category', val)}
            >
              <SelectTrigger id="listing-category">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {ITEM_CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-500" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="listing-price">Precio (CLP) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="listing-price"
                type="number"
                min={0}
                step={500}
                value={formData.price}
                onChange={(e) => handleFieldChange('price', e.target.value)}
                className="pl-9"
                placeholder="10000"
              />
            </div>

            {/* Commission Calculator */}
            <div className="flex justify-between items-center text-sm pt-1">
              <span className="text-gray-500">
                Comisión ({Math.round(COMMISSION_RATE * 100)}%):
              </span>
              <span className="text-green-600 font-medium">
                Recibirás: {formatCurrency(netEarnings)}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="listing-description">Descripción para el comprador</Label>
            <Textarea
              id="listing-description"
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Describe qué incluye tu recurso, para qué tipo de pacientes es útil, etc."
              rows={3}
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label>Visibilidad</Label>
            <Select
              value={formData.visibility}
              onValueChange={(val) => handleFieldChange('visibility', val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITY_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div>
                      <span>{opt.label}</span>
                      <span className="text-xs text-gray-400 ml-2">
                        ({opt.description})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Approval Notice */}
          {formData.visibility === 'active' && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-amber-800">
                Tu publicación será revisada antes de aparecer en el marketplace.
                Esto suele tomar 24-48 horas.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "gap-2",
              "bg-gradient-to-r from-amber-500 to-orange-500",
              "hover:from-amber-600 hover:to-orange-600"
            )}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Store className="h-4 w-4" />
                Publicar Ahora
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ListingForm;