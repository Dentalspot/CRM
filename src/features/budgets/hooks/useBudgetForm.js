import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';

const emptyItem = () => ({
  uid: crypto.randomUUID(), // local key, no se manda a BD
  service_id: null,
  description: '',
  quantity: 1,
  unit_price: 0,
});

/**
 * Hook con toda la lógica del formulario de presupuesto.
 * Reutilizable por modal y futura página.
 *
 * @param {string} therapistId - dueño del catálogo de servicios
 */
export const useBudgetForm = (therapistId) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountPct, setDiscountPct] = useState(0);
  const [clinicId, setClinicId] = useState(null);
  const [items, setItems] = useState([emptyItem()]);

  /**
   * Precargar el formulario con datos existentes (modo edición).
   * @param {{ budget: object, items: array }} data
   */
  const loadFromBudget = useCallback((data) => {
    if (!data || !data.budget) return;
    setTitle(data.budget.title || '');
    setDescription(data.budget.description || '');
    setDiscountPct(Number(data.budget.discount_percentage) || 0);
    setClinicId(data.budget.clinic_id || null);
    setItems(
      (data.items || []).length === 0
        ? [emptyItem()]
        : data.items.map(it => ({
            uid: crypto.randomUUID(),
            service_id: it.service_id,
            description: it.description,
            quantity: it.quantity,
            unit_price: Number(it.unit_price),
          }))
    );
  }, []);

  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Cargar catálogo de servicios del dentista
  useEffect(() => {
    if (!therapistId) return;
    let mounted = true;
    setLoadingServices(true);
    supabase
      .from('services')
      .select('id, name, price, duration_minutes')
      .eq('therapist_id', therapistId)
      .eq('is_active', true)
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          logger.warn('[useBudgetForm] error fetching services:', error);
          setServices([]);
        } else {
          setServices(data || []);
        }
        setLoadingServices(false);
      });
    return () => { mounted = false; };
  }, [therapistId]);

  // Cálculos derivados
  const subtotal = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0),
    [items]
  );
  const discountAmount = useMemo(
    () => Math.round(subtotal * (Number(discountPct) || 0) / 100),
    [subtotal, discountPct]
  );
  const total = useMemo(() => Math.max(subtotal - discountAmount, 0), [subtotal, discountAmount]);

  // Item ops
  const addItem = useCallback(() => setItems(prev => [...prev, emptyItem()]), []);
  const removeItem = useCallback((uid) => setItems(prev => prev.filter(it => it.uid !== uid)), []);
  const updateItem = useCallback((uid, patch) => {
    setItems(prev => prev.map(it => it.uid === uid ? { ...it, ...patch } : it));
  }, []);

  // Cuando elige un servicio del catálogo, autocompletar precio y descripción
  const selectServiceForItem = useCallback((uid, serviceId) => {
    if (!serviceId) {
      updateItem(uid, { service_id: null });
      return;
    }
    const svc = services.find(s => s.id === serviceId);
    if (svc) {
      updateItem(uid, {
        service_id: svc.id,
        description: svc.name,
        unit_price: Number(svc.price) || 0,
      });
    }
  }, [services, updateItem]);

  // Validación
  const validation = useMemo(() => {
    const errors = [];
    if (!title.trim()) errors.push('El título es obligatorio.');
    if (items.length === 0) errors.push('Debes agregar al menos un item.');
    items.forEach((it, idx) => {
      if (!it.description?.trim()) errors.push(`Item ${idx + 1}: descripción requerida.`);
      if (!it.quantity || it.quantity < 1) errors.push(`Item ${idx + 1}: cantidad debe ser ≥ 1.`);
      if (it.unit_price < 0) errors.push(`Item ${idx + 1}: precio no puede ser negativo.`);
    });
    if (discountPct < 0 || discountPct > 100) errors.push('Descuento debe estar entre 0 y 100%.');
    return { valid: errors.length === 0, errors };
  }, [title, items, discountPct]);

  const reset = useCallback(() => {
    setTitle('');
    setDescription('');
    setDiscountPct(0);
    setClinicId(null);
    setItems([emptyItem()]);
  }, []);

  // Payload listo para createBudget
  const buildPayload = useCallback(() => ({
    title: title.trim(),
    description: description.trim() || null,
    discount_percentage: Number(discountPct) || 0,
    clinic_id: clinicId || null,
    items: items.map(it => ({
      service_id: it.service_id,
      description: it.description.trim(),
      quantity: Number(it.quantity),
      unit_price: Number(it.unit_price),
    })),
  }), [title, description, discountPct, clinicId, items]);

  return {
    // state
    title, setTitle,
    description, setDescription,
    discountPct, setDiscountPct,
    clinicId, setClinicId,
    items,
    // services catalog
    services, loadingServices,
    // ops
    addItem, removeItem, updateItem, selectServiceForItem,
    reset, buildPayload, loadFromBudget,
    // derived
    subtotal, discountAmount, total,
    validation,
  };
};
