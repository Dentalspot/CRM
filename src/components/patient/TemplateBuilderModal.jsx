import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  Type,
  AlignLeft,
  CheckSquare,
  Heading,
  ArrowUp,
  ArrowDown,
  Calendar,
  Hash,
  CircleDot,
  ToggleLeft,
  Gauge,
  Target,
  Info,
  Save,
  Loader2,
  ShoppingBag,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { useToast } from '@/components/ui/use-toast';

// Extended field types for clinical protocols
const FIELD_TYPES = [
  { value: 'header', label: 'Título de Sección', icon: Heading, category: 'structure' },
  { value: 'info', label: 'Texto Informativo', icon: Info, category: 'structure' },
  { value: 'text', label: 'Texto Corto', icon: Type, category: 'input' },
  { value: 'textarea', label: 'Texto Largo', icon: AlignLeft, category: 'input' },
  { value: 'number', label: 'Número', icon: Hash, category: 'input' },
  { value: 'date', label: 'Fecha', icon: Calendar, category: 'input' },
  { value: 'checkbox', label: 'Casilla Sí/No', icon: CheckSquare, category: 'selection' },
  { value: 'yesno', label: 'Sí / No (Radio)', icon: ToggleLeft, category: 'selection' },
  { value: 'radio', label: 'Opciones Múltiples', icon: CircleDot, category: 'selection' },
  { value: 'severity', label: 'Severidad (L/M/S)', icon: Gauge, category: 'clinical' },
  { value: 'loglp', label: 'Logra / Parcial / No', icon: Target, category: 'clinical' },
];

const CATEGORIES = {
  structure: { label: 'Estructura', color: 'bg-blue-100 text-blue-700' },
  input: { label: 'Entrada de Datos', color: 'bg-green-100 text-green-700' },
  selection: { label: 'Selección', color: 'bg-purple-100 text-purple-700' },
  clinical: { label: 'Clínico', color: 'bg-primary text-primary' },
};

const DOC_CATEGORIES = [
  { value: 'anamnesis', label: 'Anamnesis' },
  { value: 'evaluacion', label: 'Evaluación' },
  { value: 'informe', label: 'Informe' },
  { value: 'evolucion', label: 'Evolución' },
  { value: 'consentimiento', label: 'Consentimiento' },
  { value: 'certificado', label: 'Certificado' },
  { value: 'otro', label: 'Otro' },
];

// Generate ID from label
const generateId = (label) => {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '') || `field_${Date.now()}`;
};

// Internal Builder Component (Controlled)
const TemplateBuilder = ({ elements, onChange }) => {
  const handleAddElement = (type) => {
    const defaultLabel = type === 'header' ? 'Nueva Sección' :
      type === 'info' ? '' : 'Nuevo Campo';

    const newElement = {
      id: `field_${Date.now()}`,
      type,
      label: defaultLabel,
      placeholder: '',
      required: false,
      content: '', // For info blocks
      options: type === 'radio' ? ['Opción 1', 'Opción 2'] : [],
      inline: false // For compact display
    };
    onChange([...elements, newElement]);
  };

  const handleUpdateElement = (id, field, value) => {
    const newElements = elements.map(el => {
      if (el.id !== id) return el;

      const updated = { ...el, [field]: value };

      // Auto-generate ID from label
      if (field === 'label' && el.type !== 'header' && el.type !== 'info') {
        updated.id = generateId(value);
      }

      return updated;
    });
    onChange(newElements);
  };

  const handleRemoveElement = (id) => {
    onChange(elements.filter(el => el.id !== id));
  };

  const handleMoveElement = (index, direction) => {
    if (
      (direction === -1 && index === 0) ||
      (direction === 1 && index === elements.length - 1)
    ) return;

    const newElements = [...elements];
    const temp = newElements[index];
    newElements[index] = newElements[index + direction];
    newElements[index + direction] = temp;
    onChange(newElements);
  };

  const handleUpdateOptions = (id, optionsString) => {
    const options = optionsString.split(',').map(o => o.trim()).filter(Boolean);
    handleUpdateElement(id, 'options', options);
  };

  // Group field types by category
  const groupedTypes = FIELD_TYPES.reduce((acc, type) => {
    if (!acc[type.category]) acc[type.category] = [];
    acc[type.category].push(type);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Add Element Panel */}
      <div className="p-4 bg-muted/30 rounded-lg border border-dashed space-y-3">
        <span className="text-sm font-medium text-muted-foreground">Agregar elemento:</span>

        {Object.entries(groupedTypes).map(([category, types]) => (
          <div key={category} className="flex flex-wrap gap-2 items-center">
            <Badge variant="outline" className={cn("text-xs", CATEGORIES[category]?.color)}>
              {CATEGORIES[category]?.label}
            </Badge>
            {types.map((type) => (
              <Button
                key={type.value}
                variant="outline"
                size="sm"
                onClick={() => handleAddElement(type.value)}
                className="flex items-center gap-1.5 bg-background hover:bg-muted hover:text-primary transition-colors text-xs h-8"
              >
                <type.icon className="h-3.5 w-3.5" />
                {type.label}
              </Button>
            ))}
          </div>
        ))}
      </div>

      {/* Elements List */}
      <div className="space-y-3">
        {elements.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
            <p className="font-medium">La plantilla está vacía</p>
            <p className="text-sm mt-1">Agrega elementos desde el panel superior para comenzar.</p>
          </div>
        ) : (
          elements.map((element, index) => {
            const fieldType = FIELD_TYPES.find(t => t.value === element.type);
            const Icon = fieldType?.icon || Type;
            const categoryInfo = CATEGORIES[fieldType?.category];

            return (
              <div key={element.id} className="group relative flex items-start gap-2">
                {/* Move Buttons */}
                <div className="flex flex-col gap-0.5 pt-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-primary"
                    onClick={() => handleMoveElement(index, -1)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-primary"
                    onClick={() => handleMoveElement(index, 1)}
                    disabled={index === elements.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>

                {/* Element Card */}
                <Card className={cn(
                  "flex-1 transition-all duration-200 border-l-4",
                  element.type === 'header' ? "border-l-primary bg-primary/5" :
                    element.type === 'info' ? "border-l-blue-400 bg-blue-50/50" :
                      fieldType?.category === 'clinical' ? "border-l-primary" :
                        "border-l-muted-foreground/40 hover:border-l-primary/50"
                )}>
                  <CardContent className="p-4 space-y-3">
                    {/* Header Row */}
                    <div className="flex justify-between items-start gap-4">
                      <Badge variant="outline" className={cn("text-xs flex items-center gap-1", categoryInfo?.color)}>
                        <Icon className="h-3 w-3" />
                        {fieldType?.label}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-1"
                        onClick={() => handleRemoveElement(element.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Field Configuration */}
                    <div className="grid gap-3">
                      {/* Label / Content */}
                      {element.type === 'info' ? (
                        <div className="space-y-1.5">
                          <Label className="text-xs">Contenido Informativo</Label>
                          <Textarea
                            value={element.content}
                            onChange={(e) => handleUpdateElement(element.id, 'content', e.target.value)}
                            placeholder="Escribe instrucciones o información relevante..."
                            className="bg-background text-sm"
                            rows={2}
                          />
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <Label className="text-xs">
                            {element.type === 'header' ? 'Texto del Título' : 'Etiqueta del Campo'}
                          </Label>
                          <Input
                            value={element.label}
                            onChange={(e) => handleUpdateElement(element.id, 'label', e.target.value)}
                            placeholder={element.type === 'header' ? "Ej: Antecedentes Mórbidos" : "Ej: ¿Presenta dificultades?"}
                            className={cn("bg-background", element.type === 'header' && "font-semibold")}
                          />
                        </div>
                      )}

                      {/* Placeholder for text fields */}
                      {['text', 'textarea', 'number'].includes(element.type) && (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Placeholder</Label>
                          <Input
                            value={element.placeholder}
                            onChange={(e) => handleUpdateElement(element.id, 'placeholder', e.target.value)}
                            placeholder="Texto de ayuda..."
                            className="bg-background text-sm h-8"
                          />
                        </div>
                      )}

                      {/* Options for radio type */}
                      {element.type === 'radio' && (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Opciones (separadas por coma)</Label>
                          <Input
                            value={(element.options || []).join(', ')}
                            onChange={(e) => handleUpdateOptions(element.id, e.target.value)}
                            placeholder="Opción 1, Opción 2, Opción 3"
                            className="bg-background text-sm h-8"
                          />
                        </div>
                      )}

                      {/* Options Row */}
                      {!['header', 'info'].includes(element.type) && (
                        <div className="flex items-center gap-4 pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`required-${element.id}`}
                              checked={element.required}
                              onCheckedChange={(checked) => handleUpdateElement(element.id, 'required', checked)}
                              className="scale-90"
                            />
                            <Label htmlFor={`required-${element.id}`} className="text-xs font-normal cursor-pointer">
                              Obligatorio
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`inline-${element.id}`}
                              checked={element.inline}
                              onCheckedChange={(checked) => handleUpdateElement(element.id, 'inline', checked)}
                              className="scale-90"
                            />
                            <Label htmlFor={`inline-${element.id}`} className="text-xs font-normal cursor-pointer">
                              En línea
                            </Label>
                          </div>
                          {element.type !== 'header' && element.type !== 'info' && (
                            <span className="text-[10px] text-muted-foreground ml-auto font-mono">
                              ID: {element.id}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Main Modal Component
const TemplateBuilderModal = ({ isOpen, onClose, therapistId, existingTemplate, onSaved }) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('otro');
  const [elements, setElements] = useState([]);
  const [saving, setSaving] = useState(false);

  // Marketplace publish state
  const [publishToMarketplace, setPublishToMarketplace] = useState(false);
  const [withAuthorship, setWithAuthorship] = useState(false);
  const [marketplacePrice, setMarketplacePrice] = useState('');
  const [marketplaceDescription, setMarketplaceDescription] = useState('');

  // Reset state when modal opens or template changes
  useEffect(() => {
    if (isOpen) {
      if (existingTemplate) {
        setName(existingTemplate.name || '');
        setCategory(existingTemplate.category || 'otro');

        // Parse elements from variables JSON
        let parsedElements = [];
        try {
          const vars = typeof existingTemplate.variables === 'string'
            ? JSON.parse(existingTemplate.variables)
            : existingTemplate.variables;

          parsedElements = vars?.fields || [];
        } catch (e) {
          logger.error("Error parsing template elements", e);
          parsedElements = [];
        }
        setElements(parsedElements);
      } else {
        // New template defaults
        setName('');
        setCategory('otro');
        setElements([]);
      }
      setPublishToMarketplace(false);
      setWithAuthorship(false);
      setMarketplacePrice('');
      setMarketplaceDescription('');
    }
  }, [isOpen, existingTemplate]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ variant: "destructive", title: "El nombre es obligatorio" });
      return;
    }

    if (elements.length === 0) {
      toast({ variant: "destructive", title: "Agrega al menos un elemento" });
      return;
    }

    try {
      setSaving(true);

      const templateData = {
        therapist_id: therapistId,
        name: name.trim(),
        category,
        variables: { fields: elements }, // Store structure in variables column
        content: `${elements.length} campos configurados`, // Simple description
        is_global: false,
        updated_at: new Date().toISOString()
      };

      let error;
      
      if (existingTemplate?.id) {
        // Update
        const { error: updateError } = await supabase
          .from('patient_document_templates')
          .update(templateData)
          .eq('id', existingTemplate.id);
        error = updateError;
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('patient_document_templates')
          .insert([templateData]);
        error = insertError;
      }

      if (error) throw error;

      // Publish to marketplace if requested
      if (publishToMarketplace) {
        try {
          // Get the saved template ID for linking
          let templateId = existingTemplate?.id;
          if (!templateId) {
            const { data: newT } = await supabase
              .from('patient_document_templates')
              .select('id')
              .eq('therapist_id', therapistId)
              .eq('name', name.trim())
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            templateId = newT?.id;
          }

          const price = withAuthorship ? parseInt(marketplacePrice) || 0 : 0;
          const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

          await supabase.from('marketplace_items').insert({
            seller_id: therapistId,
            therapist_plan_template_id: templateId,
            item_type: 'evaluation',
            title: name.trim(),
            description: marketplaceDescription || `Plantilla de ${category}: ${name.trim()}`,
            price: price,
            currency: 'CLP',
            is_active: false,
            is_approved: false,
            slug: `${slug}-${Date.now()}`,
            category: category,
          });

          toast({ title: "📦 Plantilla enviada a Marketplace", description: "Será revisada antes de publicarse." });
        } catch (mpError) {
          logger.error('Error publishing to marketplace:', mpError);
          toast({ variant: "destructive", title: "Plantilla guardada, pero hubo un error al publicar en Marketplace" });
        }
      } else {
        toast({ title: "✅ Plantilla guardada exitosamente" });
      }

      if (onSaved) onSaved();
      onClose();
    } catch (error) {
      logger.error('Error saving template:', error);
      toast({ 
        variant: "destructive", 
        title: "Error al guardar", 
        description: error.message 
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>
            {existingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
          </DialogTitle>
          <DialogDescription>
            Configura la estructura de tu documento arrastrando elementos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg border">
                <div className="md:col-span-2 space-y-2">
                  <Label>Nombre de la Plantilla</Label>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Ej: Evaluación de Voz" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOC_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Builder Area */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Estructura del Documento</Label>
                <TemplateBuilder elements={elements} onChange={setElements} />
              </div>

              {/* Marketplace Publish Section */}
              <div className="p-4 rounded-lg border-2 border-dashed border-purple-200 bg-purple-50/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-purple-600" />
                    <div>
                      <Label className="text-sm font-semibold text-purple-900">Publicar en Marketplace</Label>
                      <p className="text-xs text-purple-600">Comparte tu plantilla con otros profesionales</p>
                    </div>
                  </div>
                  <Switch
                    checked={publishToMarketplace}
                    onCheckedChange={setPublishToMarketplace}
                  />
                </div>

                {publishToMarketplace && (
                  <div className="space-y-4 pt-2 border-t border-purple-200">
                    {/* Authorship toggle */}
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-gray-600" />
                        <div>
                          <Label className="text-sm font-medium">Con autoría</Label>
                          <p className="text-xs text-gray-500">Tu nombre aparece como autor y puedes cobrar</p>
                        </div>
                      </div>
                      <Switch
                        checked={withAuthorship}
                        onCheckedChange={(checked) => {
                          setWithAuthorship(checked);
                          if (!checked) setMarketplacePrice('');
                        }}
                      />
                    </div>

                    {withAuthorship ? (
                      <div className="p-3 bg-white rounded-lg border space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-sm flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" /> Precio (CLP)
                          </Label>
                          <Input
                            type="number"
                            value={marketplacePrice}
                            onChange={(e) => setMarketplacePrice(e.target.value)}
                            placeholder="Ej: 5000"
                            min="0"
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Al comprar, la plantilla se agrega automáticamente a los documentos del profesional.
                          Si el comprador la modifica, la autoría pasa a ser de quien hizo los cambios.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800 font-medium">Gratis — $0 CLP</p>
                        <p className="text-xs text-green-600 mt-1">
                          Sin autoría, la plantilla se comparte de forma gratuita.
                          Esto evita disputas por derechos de autor.
                        </p>
                      </div>
                    )}

                    {/* Description */}
                    <div className="space-y-1.5">
                      <Label className="text-sm">Descripción para Marketplace</Label>
                      <Textarea
                        value={marketplaceDescription}
                        onChange={(e) => setMarketplaceDescription(e.target.value)}
                        placeholder="Describe para qué sirve esta plantilla, en qué contexto se usa..."
                        rows={2}
                        className="bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/10">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar Plantilla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateBuilderModal;