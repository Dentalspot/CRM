import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { DIFFICULTY_LEVELS } from '@/lib/constants/enums';
import logger from '@/lib/utils/logger';
import { normalizeDifficulty } from '@/lib/utils/normalizers';

const DEFAULT_ACTIVITY_FORM = {
  name: '',
  description: '',
  instructions: '',
  default_duration_minutes: 15,
  materials: '',
  category: '',
  difficulty: DIFFICULTY_LEVELS.ADECUADO
};

const useActivityLibrary = ({ isOpen, onClose, onSelect, planActivities = [], maxSelectable = null, excludeIds = [] }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Data state
  const [libraryActivities, setLibraryActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState(planActivities.length > 0 ? 'plan' : 'biblioteca');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Form state
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [customForm, setCustomForm] = useState(DEFAULT_ACTIVITY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deletingActivityId, setDeletingActivityId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ============================================
  // DATA LOADING
  // ============================================

  const resetState = useCallback(() => {
    setSelectedIds(new Set());
    setSearchTerm('');
    setSelectedCategory('all');
    setActiveTab(planActivities.length > 0 ? 'plan' : 'biblioteca');
  }, [planActivities.length]);

  const loadFavorites = useCallback(async () => {
    try {
      const { data: favsData } = await supabase
        .from('therapist_favorite_activities')
        .select('activity_id')
        .eq('therapist_id', user?.id);
      setFavorites((favsData || []).map(f => f.activity_id));
    } catch (favError) {
      logger.log('Favorites table not available:', favError);
      setFavorites([]);
    }
  }, [user?.id]);

  const loadLibraryData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: catsData } = await supabase
        .from('planification_types')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      setCategories(catsData || []);

      const { data: actData } = await supabase
        .from('therapist_exercises')
        .select('*')
        .or(`is_public.eq.true,therapist_id.eq.${user?.id}`)
        .eq('is_active', true)
        .order('name');

      const activitiesWithNormalizedData = (actData || []).map(act => ({
        ...act,
        category_name: act.category || 'Sin categoría',
        difficulty: normalizeDifficulty(act.difficulty)
      }));
      setLibraryActivities(activitiesWithNormalizedData);

      await loadFavorites();
    } catch (error) {
      logger.error('Error loading library:', error);
      toast({ variant: "destructive", title: "Error al cargar biblioteca", description: error.message });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast, loadFavorites]);

  useEffect(() => {
    if (isOpen) {
      resetState();
      loadLibraryData();
    }
  }, [isOpen, planActivities.length]);

  // ============================================
  // MEMOIZED DATA
  // ============================================

  const currentActivities = useMemo(() => {
    let activities = [];
    switch (activeTab) {
      case 'plan':
        activities = planActivities.map(a => ({
          ...a, _source: 'plan',
          category_name: a.objective_title || a.category_name || 'Del Plan',
          difficulty: normalizeDifficulty(a.difficulty)
        }));
        break;
      case 'favoritos':
        activities = libraryActivities
          .filter(a => favorites.includes(a.id))
          .map(a => ({ ...a, _source: 'library' }));
        break;
      case 'mis-actividades':
        activities = libraryActivities
          .filter(a => a.therapist_id === user?.id)
          .map(a => ({ ...a, _source: 'library' }));
        break;
      default:
        activities = libraryActivities.map(a => ({ ...a, _source: 'library' }));
    }
    return activities.filter(a => !excludeIds.includes(a.id));
  }, [activeTab, planActivities, libraryActivities, favorites, excludeIds, user?.id]);

  const filteredActivities = useMemo(() => {
    return currentActivities.filter(act => {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = (act.name || '').toLowerCase().includes(searchLower);
      const descMatch = (act.description || '').toLowerCase().includes(searchLower);
      const categoryMatch = selectedCategory === 'all' ||
        act.category === selectedCategory ||
        act.category_name === selectedCategory;
      return (nameMatch || descMatch) && categoryMatch;
    });
  }, [currentActivities, searchTerm, selectedCategory]);

  const groupedActivities = useMemo(() => {
    const groups = {};
    filteredActivities.forEach(act => {
      const key = act.category_name || act.category || 'General';
      if (!groups[key]) groups[key] = [];
      groups[key].push(act);
    });
    return groups;
  }, [filteredActivities]);

  // ============================================
  // HANDLERS
  // ============================================

  const toggleSelection = (activity) => {
    const id = activity.id;
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      if (maxSelectable && newSet.size >= maxSelectable) {
        toast({ title: `Máximo ${maxSelectable} actividades`, description: "Deselecciona una para agregar otra" });
        return;
      }
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleToggleFavorite = async (activityId, e) => {
    e.stopPropagation();
    const isFavorite = favorites.includes(activityId);
    try {
      if (isFavorite) {
        await supabase.from('therapist_favorite_activities').delete()
          .eq('therapist_id', user.id).eq('activity_id', activityId);
        setFavorites(prev => prev.filter(id => id !== activityId));
        toast({ title: "Removido de favoritos" });
      } else {
        await supabase.from('therapist_favorite_activities')
          .insert({ therapist_id: user.id, activity_id: activityId });
        setFavorites(prev => [...prev, activityId]);
        toast({ title: "⭐ Agregado a favoritos" });
      }
    } catch (error) {
      logger.error('Error toggling favorite:', error);
      toast({ variant: "destructive", title: "Función no disponible", description: "La tabla de favoritos aún no está configurada" });
    }
  };

  const handleConfirm = () => {
    const allActivities = [...currentActivities, ...libraryActivities];
    const selectedItems = Array.from(selectedIds).map(id => {
      const activity = allActivities.find(a => a.id === id);
      return {
        id: activity.id,
        name: activity.name,
        description: activity.description || '',
        instructions: activity.instructions || '',
        duration_minutes: activity.default_duration_minutes || activity.duration_minutes || 15,
        materials: activity.materials || '',
        difficulty: normalizeDifficulty(activity.difficulty),
        source_activity_id: activity.id,
        source_type: activity._source
      };
    });

    selectedItems.forEach(item => {
      if (item.source_type === 'library') {
        (async () => {
          try { await supabase.rpc('increment_activity_usage', { activity_id: item.source_activity_id }); } catch { /* silent */ }
        })();
      }
    });

    onSelect(selectedItems);
    onClose();
  };

  // ============================================
  // FORM HANDLERS
  // ============================================

  const handleOpenCreateForm = () => {
    setEditingActivity(null);
    setCustomForm(DEFAULT_ACTIVITY_FORM);
    setShowCustomForm(true);
  };

  const handleEditActivity = (activity, e) => {
    e?.stopPropagation();
    setEditingActivity(activity);
    setCustomForm({
      name: activity.name || '',
      description: activity.description || '',
      instructions: activity.instructions || '',
      default_duration_minutes: activity.default_duration_minutes || 15,
      materials: activity.materials || '',
      category: activity.category || '',
      difficulty: normalizeDifficulty(activity.difficulty)
    });
    setShowCustomForm(true);
  };

  const handleSaveActivity = async () => {
    if (!customForm.name.trim()) {
      toast({ variant: "destructive", title: "El nombre es requerido" });
      return;
    }

    setSaving(true);
    try {
      const activityData = {
        name: customForm.name,
        description: customForm.description || null,
        instructions: customForm.instructions || null,
        default_duration_minutes: parseInt(customForm.default_duration_minutes) || 15,
        materials: customForm.materials || null,
        category: customForm.category || null,
        difficulty: customForm.difficulty || DIFFICULTY_LEVELS.ADECUADO,
        updated_at: new Date().toISOString()
      };

      if (editingActivity) {
        const { error } = await supabase.from('therapist_exercises')
          .update(activityData).eq('id', editingActivity.id).eq('therapist_id', user.id);
        if (error) throw error;
        toast({ title: "✓ Actividad actualizada" });
      } else {
        const { data, error } = await supabase.from('therapist_exercises')
          .insert({ ...activityData, therapist_id: user.id, is_public: false, is_active: true })
          .select().single();
        if (error) throw error;
        toast({ title: "✓ Actividad creada exitosamente" });
        if (data) {
          const newActivity = { ...data, _source: 'library', category_name: data.category || 'Sin categoría' };
          setLibraryActivities(prev => [...prev, newActivity]);
          setSelectedIds(prev => new Set([...prev, data.id]));
        }
      }

      setShowCustomForm(false);
      setEditingActivity(null);
      setCustomForm(DEFAULT_ACTIVITY_FORM);
      setActiveTab('mis-actividades');
    } catch (error) {
      logger.error('Error saving activity:', error);
      toast({ variant: "destructive", title: "Error al guardar actividad", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // DELETE HANDLERS
  // ============================================

  const handleDeleteActivity = (activityId, e) => {
    e?.stopPropagation();
    setDeletingActivityId(activityId);
  };

  const confirmDeleteActivity = async () => {
    if (!deletingActivityId) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('therapist_exercises')
        .update({ is_active: false }).eq('id', deletingActivityId).eq('therapist_id', user.id);
      if (error) throw error;
      toast({ title: "✓ Actividad eliminada" });
      setSelectedIds(prev => { const newSet = new Set(prev); newSet.delete(deletingActivityId); return newSet; });
      loadLibraryData();
    } catch (error) {
      logger.error('Error deleting activity:', error);
      toast({ variant: "destructive", title: "Error al eliminar", description: error.message });
    } finally {
      setDeleting(false);
      setDeletingActivityId(null);
    }
  };

  return {
    user,
    // Data
    categories, favorites, loading,
    groupedActivities, currentActivities,
    // UI state
    activeTab, setActiveTab,
    searchTerm, setSearchTerm,
    selectedCategory, setSelectedCategory,
    selectedIds,
    // Form
    showCustomForm, setShowCustomForm,
    editingActivity, setEditingActivity,
    customForm, setCustomForm,
    saving,
    // Delete
    deletingActivityId, setDeletingActivityId,
    deleting,
    // Handlers
    toggleSelection,
    handleToggleFavorite,
    handleConfirm,
    handleOpenCreateForm,
    handleEditActivity,
    handleSaveActivity,
    handleDeleteActivity,
    confirmDeleteActivity,
  };
};

export default useActivityLibrary;
