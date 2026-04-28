/**
 * ActivityInputWithLibrary Component
 * 
 * Componente para gestionar actividades en sesiones y plantillas.
 * Permite agregar manualmente, desde biblioteca, reordenar y editar.
 * 
 * @module features/activities/components/ActivityInputWithLibrary
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  BookOpen,
  Plus,
  Clock,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  Package,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ✅ Imports centralizados
import {
  DIFFICULTY_LEVELS,
  DIFFICULTY_LABELS,
  getEnumOptions
} from '@/lib/constants/enums';
import { DIFFICULTY_BADGE_STYLES } from '@/lib/constants/config';
import { normalizeDifficulty } from '@/lib/utils/normalizers';

// Componente de biblioteca
import ActivityLibrarySelector from './ActivityLibrarySelector';

// ============================================
// CONSTANTS
// ============================================

// ✅ Opciones dinámicas desde enums
const DIFFICULTY_OPTIONS = getEnumOptions(DIFFICULTY_LEVELS, DIFFICULTY_LABELS);

// Default form values
const DEFAULT_EDIT_FORM = {
  name: '',
  description: '',
  instructions: '',
  duration_minutes: 15,
  materials: '',
  difficulty: DIFFICULTY_LEVELS.ADECUADO
};

// ============================================
// COMPONENT
// ============================================

const ActivityInputWithLibrary = ({
  value = [],
  onChange,
  maxActivities = 3,
  planActivities = [],
  placeholder = "Escribe una actividad o busca en la biblioteca...",
  className,
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Edit modal state
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState(DEFAULT_EDIT_FORM);

  // Expanded activities (to show details)
  const [expandedIndex, setExpandedIndex] = useState(null);

  // ============================================
  // HANDLERS
  // ============================================

  // Quick add from input
  const handleManualAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || value.length >= maxActivities) return;

    const newActivity = {
      id: `manual-${Date.now()}`,
      name: trimmed,
      duration_minutes: 15,
      description: '',
      instructions: '',
      materials: '',
      is_manual: true,
      difficulty: DIFFICULTY_LEVELS.ADECUADO,
      source_type: 'manual'
    };

    onChange([...value, newActivity]);
    setInputValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualAdd();
    }
  };

  // Library selection
  const handleLibrarySelect = (selectedItems) => {
    const remainingSlots = maxActivities - value.length;
    if (remainingSlots <= 0) return;

    const itemsToAdd = selectedItems.slice(0, remainingSlots).map((item, idx) => ({
      id: item.id || `lib-${Date.now()}-${idx}`,
      name: item.name,
      description: item.description || '',
      instructions: item.instructions || '',
      duration_minutes: item.duration_minutes || item.default_duration_minutes || 15,
      materials: item.materials || '',
      difficulty: normalizeDifficulty(item.difficulty),
      source_activity_id: item.source_activity_id || item.id,
      source_type: item.source_type || 'library', // FIX: Ensure source_type is passed
      is_manual: false
    }));

    onChange([...value, ...itemsToAdd]);
  };

  // Remove activity
  const handleRemove = (indexToRemove) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
    if (expandedIndex === indexToRemove) setExpandedIndex(null);
  };

  // Edit activity
  const handleStartEdit = (index, e) => {
    e?.stopPropagation();
    const activity = value[index];
    setEditForm({
      name: activity.name || '',
      description: activity.description || '',
      instructions: activity.instructions || '',
      duration_minutes: activity.duration_minutes || 15,
      materials: activity.materials || '',
      difficulty: normalizeDifficulty(activity.difficulty)
    });
    setEditingIndex(index);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    const updated = [...value];
    updated[editingIndex] = {
      ...updated[editingIndex],
      ...editForm,
      duration_minutes: parseInt(editForm.duration_minutes) || 15
    };
    onChange(updated);
    setEditingIndex(null);
  };

  // Reorder
  const handleMove = (fromIndex, direction) => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= value.length) return;

    const updated = [...value];
    [updated[fromIndex], updated[toIndex]] = [updated[toIndex], updated[fromIndex]];
    onChange(updated);

    if (expandedIndex === fromIndex) setExpandedIndex(toIndex);
    else if (expandedIndex === toIndex) setExpandedIndex(fromIndex);
  };

  const toggleExpanded = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const isMaxReached = value.length >= maxActivities;
  const excludeIds = value.map(a => a.source_activity_id || a.id).filter(Boolean);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={cn("space-y-3", className)}>
      {/* Activity List */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((activity, index) => {
            const isExpanded = expandedIndex === index;
            const hasDetails = activity.description || activity.instructions || activity.materials;

            // ✅ Usar normalizeDifficulty y estilos centralizados
            const diffKey = normalizeDifficulty(activity.difficulty);
            const diffStyle = DIFFICULTY_BADGE_STYLES[diffKey] || DIFFICULTY_BADGE_STYLES[DIFFICULTY_LEVELS.ADECUADO];

            return (
              <Card
                key={activity.id || index}
                className={cn(
                  "transition-all",
                  isExpanded && "ring-1 ring-teal-200"
                )}
              >
                <CardContent className="p-0">
                  {/* Main row */}
                  <div className="flex items-center gap-2 p-3">
                    {/* Order controls */}
                    <div className="flex flex-col items-center shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0 || disabled}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <span className="text-xs font-medium text-gray-400 w-5 text-center">
                        {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === value.length - 1 || disabled}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Activity info */}
                    <div
                      className={cn(
                        "flex-1 min-w-0",
                        hasDetails && "cursor-pointer"
                      )}
                      onClick={() => hasDetails && toggleExpanded(index)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {activity.name}
                        </span>
                        {hasDetails && (
                          <ChevronRight className={cn(
                            "h-4 w-4 text-gray-400 transition-transform",
                            isExpanded && "rotate-90"
                          )} />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                          <Clock className="h-3 w-3 mr-1" />
                          {activity.duration_minutes} min
                        </Badge>

                        {/* ✅ Badge con estilos centralizados */}
                        <Badge className={cn("h-5 px-1.5 text-[10px] border", diffStyle.color)}>
                          {diffStyle.label}
                        </Badge>

                        {activity.source_type === 'library' && (
                          <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-teal-600 border-teal-200">
                            <Package className="h-3 w-3 mr-1" />
                            Biblioteca
                          </Badge>
                        )}
                        {activity.source_type === 'plan' && (
                          <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-blue-600 border-blue-200">
                            Plan
                          </Badge>
                        )}
                        {activity.is_manual && (
                          <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-purple-600 border-purple-200">
                            Manual
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => handleStartEdit(index, e)}
                        disabled={disabled}
                      >
                        <Edit className="h-3.5 w-3.5 text-gray-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleRemove(index)}
                        disabled={disabled}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && hasDetails && (
                    <div className="px-3 pb-3 pt-0 ml-9 border-t bg-gray-50/50">
                      <div className="pt-3 space-y-2 text-sm">
                        {activity.description && (
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase">Descripción</span>
                            <p className="text-gray-700 mt-0.5">{activity.description}</p>
                          </div>
                        )}
                        {activity.instructions && (
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase">Instrucciones</span>
                            <p className="text-gray-700 mt-0.5 whitespace-pre-wrap">{activity.instructions}</p>
                          </div>
                        )}
                        {activity.materials && (
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase">Materiales</span>
                            <p className="text-gray-700 mt-0.5">{activity.materials}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Input Area */}
      {!isMaxReached ? (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="pr-9"
              disabled={disabled}
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1 h-7 w-7 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
              onClick={handleManualAdd}
              disabled={!inputValue.trim() || disabled}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            className="shrink-0 gap-2 text-teal-700 border-teal-200 hover:bg-teal-50 hover:text-teal-800"
            onClick={() => setIsLibraryOpen(true)}
            type="button"
            disabled={disabled}
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Biblioteca</span>
          </Button>
        </div>
      ) : (
        <div className="text-xs text-amber-600 flex items-center gap-1.5 bg-amber-50 px-3 py-2 rounded-md border border-amber-100">
          <span className="font-medium">Límite alcanzado ({maxActivities}/{maxActivities}).</span>
          <span>Elimina una actividad para agregar otra.</span>
        </div>
      )}

      {/* Activity Library Selector */}
      <ActivityLibrarySelector
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelect={handleLibrarySelect}
        planActivities={planActivities}
        maxSelectable={maxActivities - value.length}
        excludeIds={excludeIds}
      />

      {/* Edit Activity Modal */}
      <Dialog open={editingIndex !== null} onOpenChange={() => setEditingIndex(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Actividad</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre <span className="text-primary">*</span></Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {/* ✅ Select con opciones dinámicas desde enums */}
            <div className="space-y-2">
              <Label>Nivel de Dificultad</Label>
              <Select
                value={editForm.difficulty}
                onValueChange={(v) => setEditForm(prev => ({ ...prev, difficulty: v }))}
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
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Instrucciones</Label>
              <Textarea
                value={editForm.instructions}
                onChange={(e) => setEditForm(prev => ({ ...prev, instructions: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duración (min)</Label>
                <Input
                  type="number"
                  value={editForm.duration_minutes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, duration_minutes: e.target.value }))}
                  min={1}
                  max={120}
                />
              </div>
              <div className="space-y-2">
                <Label>Materiales</Label>
                <Input
                  value={editForm.materials}
                  onChange={(e) => setEditForm(prev => ({ ...prev, materials: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingIndex(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} className="bg-teal-600 hover:bg-teal-700">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActivityInputWithLibrary;