import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

export const useBlogEditor = (initialData = null) => {
  const defaultState = {
    title: '',
    subtitle: '',
    description: '',
    content: '',
    category_id: '',
    tags: [],
    featured_image: '',
    status: 'draft',
    slug: '',
    question_id: null,
    faq: [],
    shareable_quote: '',
    meta_title: '',
    meta_description: '',
    keywords: [],
  };

  const [formData, setFormData] = useState(defaultState);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...defaultState,
        ...initialData
      });
    }
  }, [initialData]);

  // Auto-save simulation
  useEffect(() => {
    if (!isDirty || isSaving) return;
    
    const timer = setTimeout(() => {
      // Here you would typically call an API to save draft
    }, 30000);

    return () => clearTimeout(timer);
  }, [formData, isDirty, isSaving]);

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  const reset = useCallback(() => {
    setFormData(initialData || defaultState);
    setIsDirty(false);
  }, [initialData]);

  const validate = useCallback(() => {
    const errors = [];
    if (!formData.title) errors.push("El título es obligatorio");
    if (!formData.content) errors.push("El contenido es obligatorio");
    
    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Validación fallida",
        description: errors[0],
      });
      return false;
    }
    return true;
  }, [formData, toast]);

  return {
    formData,
    updateField,
    reset,
    validate,
    isSaving,
    setIsSaving, // Exposed to allow manual save triggers to update state
    isDirty
  };
};