/**
 * ActivityLibrarySelector Component
 *
 * Modal para seleccionar actividades de la biblioteca del terapeuta.
 * Permite buscar, filtrar, crear, editar y eliminar actividades personales.
 *
 * @module features/activities/components/ActivityLibrarySelector
 */

import React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Filter, Loader2, BookOpen, CheckCircle2, Star,
  Plus, Edit, Package, Target, Trash2
} from 'lucide-react';

import useActivityLibrary from '../hooks/useActivityLibrary';
import ActivityCard from './activity-library/ActivityCard';
import CustomActivityForm from './activity-library/CustomActivityForm';

const ActivityLibrarySelector = ({
  isOpen,
  onClose,
  onSelect,
  planActivities = [],
  maxSelectable = null,
  title = "Biblioteca de Actividades",
  excludeIds = []
}) => {
  const {
    user,
    categories, favorites, loading,
    groupedActivities,
    activeTab, setActiveTab,
    searchTerm, setSearchTerm,
    selectedCategory, setSelectedCategory,
    selectedIds,
    showCustomForm, setShowCustomForm,
    editingActivity, setEditingActivity,
    customForm, setCustomForm,
    saving,
    deletingActivityId, setDeletingActivityId,
    deleting,
    toggleSelection,
    handleToggleFavorite,
    handleConfirm,
    handleOpenCreateForm,
    handleEditActivity,
    handleSaveActivity,
    handleDeleteActivity,
    confirmDeleteActivity,
  } = useActivityLibrary({ isOpen, onClose, onSelect, planActivities, maxSelectable, excludeIds });

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-teal-600" />
                  {title}
                </DialogTitle>
                <DialogDescription>
                  Selecciona actividades para agregar a la sesión
                </DialogDescription>
              </div>
              {maxSelectable && (
                <Badge
                  variant={selectedIds.size >= maxSelectable ? "destructive" : "secondary"}
                  className="mr-8"
                >
                  {selectedIds.size} / {maxSelectable} seleccionadas
                </Badge>
              )}
            </div>
          </DialogHeader>

          {showCustomForm ? (
            <CustomActivityForm
              customForm={customForm}
              setCustomForm={setCustomForm}
              categories={categories}
              editingActivity={editingActivity}
              saving={saving}
              onSave={handleSaveActivity}
              onCancel={() => {
                setShowCustomForm(false);
                setEditingActivity(null);
              }}
            />
          ) : (
            <>
              {/* Search & Filters */}
              <div className="px-6 py-3 border-b bg-gray-50/50 space-y-3">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Buscar por nombre, descripción..."
                      className="pl-9 bg-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[200px] bg-white">
                      <Filter className="h-4 w-4 mr-2 text-gray-500" />
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={handleOpenCreateForm}
                    className="shrink-0 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Crear Nueva
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <div className="px-6 pt-3">
                  <TabsList className="w-full justify-start">
                    {planActivities.length > 0 && (
                      <TabsTrigger value="plan" className="gap-1.5">
                        <Target className="h-4 w-4" />
                        Del Plan
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                          {planActivities.filter(a => !excludeIds.includes(a.id)).length}
                        </Badge>
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="biblioteca" className="gap-1.5">
                      <BookOpen className="h-4 w-4" />
                      Biblioteca
                    </TabsTrigger>
                    <TabsTrigger value="favoritos" className="gap-1.5">
                      <Star className="h-4 w-4" />
                      Favoritos
                      {favorites.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                          {favorites.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="mis-actividades" className="gap-1.5">
                      <Edit className="h-4 w-4" />
                      Mis Actividades
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-hidden">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                    </div>
                  ) : (
                    <ScrollArea className="h-full">
                      <div className="p-6">
                        {Object.keys(groupedActivities).length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p className="font-medium">No se encontraron actividades</p>
                            <p className="text-sm mt-1">Prueba cambiando los filtros o crea una nueva</p>
                            <Button
                              variant="outline"
                              className="mt-4"
                              onClick={handleOpenCreateForm}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Crear Actividad
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {Object.entries(groupedActivities).map(([category, items]) => (
                              <div key={category} className="space-y-3">
                                <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider flex items-center gap-2 pl-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                  {category}
                                  <span className="text-xs font-normal text-gray-400">({items.length})</span>
                                </h3>
                                <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
                                  {items.map((activity) => (
                                    <ActivityCard
                                      key={activity.id}
                                      activity={activity}
                                      isSelected={selectedIds.has(activity.id)}
                                      isFavorite={favorites.includes(activity.id)}
                                      isOwn={activity.therapist_id === user?.id}
                                      isFromPlan={activity._source === 'plan'}
                                      onToggle={toggleSelection}
                                      onToggleFavorite={handleToggleFavorite}
                                      onEdit={handleEditActivity}
                                      onDelete={handleDeleteActivity}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </Tabs>
            </>
          )}

          {/* Footer */}
          {!showCustomForm && (
            <DialogFooter className="px-6 py-4 border-t bg-white shrink-0">
              <div className="flex items-center justify-between w-full">
                <span className="text-sm text-gray-500">
                  {selectedIds.size} actividad{selectedIds.size !== 1 ? 'es' : ''} seleccionada{selectedIds.size !== 1 ? 's' : ''}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={selectedIds.size === 0}
                    className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Agregar {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingActivityId} onOpenChange={() => setDeletingActivityId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta actividad?</AlertDialogTitle>
            <AlertDialogDescription>
              La actividad será removida de tu biblioteca personal. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteActivity}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ActivityLibrarySelector;
