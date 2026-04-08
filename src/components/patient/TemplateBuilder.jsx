import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
  clinical: { label: 'Clínico', color: 'bg-pink-100 text-pink-700' },
};

// Generate ID from label
const generateId = (label) => {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '') || `field_${Date.now()}`;
};

const TemplateBuilder = ({ elements = [], onChange }) => {

  const handleAddElement = (type) => {
    const fieldType = FIELD_TYPES.find(t => t.value === type);
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
                      fieldType?.category === 'clinical' ? "border-l-pink-400" :
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

      {/* Summary */}
      {elements.length > 0 && (
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          {elements.filter(e => e.type === 'header').length} secciones · {elements.filter(e => !['header', 'info'].includes(e.type)).length} campos
        </div>
      )}
    </div>
  );
};

export default TemplateBuilder;