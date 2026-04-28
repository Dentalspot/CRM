import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Loader2, CheckCircle2, Plus, Sparkles } from 'lucide-react';
import { DIFFICULTY_LEVELS, DIFFICULTY_LABELS, getEnumOptions } from '@/lib/constants/enums';

const DIFFICULTY_OPTIONS = getEnumOptions(DIFFICULTY_LEVELS, DIFFICULTY_LABELS);

const CustomActivityForm = ({
  customForm,
  setCustomForm,
  categories,
  editingActivity,
  saving,
  onSave,
  onCancel
}) => {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-teal-600" />
            {editingActivity ? 'Editar Actividad' : 'Nueva Actividad Personalizada'}
          </h3>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Nombre <span className="text-primary">*</span></Label>
          <Input
            value={customForm.name}
            onChange={(e) => setCustomForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ej: Ejercicios de respiración diafragmática"
          />
        </div>

        <div className="space-y-2">
          <Label>Categoría</Label>
          <Select
            value={customForm.category}
            onValueChange={(v) => setCustomForm(prev => ({ ...prev, category: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar categoría..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Nivel de Dificultad</Label>
          <Select
            value={customForm.difficulty}
            onValueChange={(v) => setCustomForm(prev => ({ ...prev, difficulty: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Descripción</Label>
          <Textarea
            value={customForm.description}
            onChange={(e) => setCustomForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Descripción breve de la actividad..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Instrucciones</Label>
          <Textarea
            value={customForm.instructions}
            onChange={(e) => setCustomForm(prev => ({ ...prev, instructions: e.target.value }))}
            placeholder="Pasos detallados para realizar la actividad..."
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Duración (min)</Label>
            <Input
              type="number"
              value={customForm.default_duration_minutes}
              onChange={(e) => setCustomForm(prev => ({ ...prev, default_duration_minutes: e.target.value }))}
              min={1}
              max={120}
            />
          </div>
          <div className="space-y-2">
            <Label>Materiales</Label>
            <Input
              value={customForm.materials}
              onChange={(e) => setCustomForm(prev => ({ ...prev, materials: e.target.value }))}
              placeholder="Ej: Tarjetas, espejo, pajitas"
            />
          </div>
        </div>

        <Button
          onClick={onSave}
          disabled={saving || !customForm.name.trim()}
          className="w-full bg-teal-600 hover:bg-teal-700 mt-4"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : editingActivity ? (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {editingActivity ? 'Guardar Cambios' : 'Crear y Seleccionar'}
        </Button>
      </div>
    </div>
  );
};

export default CustomActivityForm;
