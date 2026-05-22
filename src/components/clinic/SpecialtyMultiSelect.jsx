import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import logger from '@/lib/utils/logger';

/**
 * @file src/components/clinic/SpecialtyMultiSelect.jsx
 *
 * Multi-select de especialidades odontológicas con chips.
 *
 * - Carga catálogo desde `specialties` al montar
 * - Renderiza chips seleccionadas con X para quitar
 * - Dropdown con checkboxes para agregar/quitar
 * - Click fuera cierra el dropdown
 *
 * Props:
 *  - value: array de specialty IDs seleccionadas
 *  - onChange(nextIds): handler con el nuevo array
 *  - disabled: boolean — bloquea interacción
 *  - placeholder: string — texto cuando vacío
 *
 * NO hace upserts directos en DB — el componente padre maneja la
 * persistencia (porque el caller puede ser create vs edit, y el momento
 * de guardar varía).
 */
const SpecialtyMultiSelect = ({
  value = [],
  onChange,
  disabled = false,
  placeholder = 'Seleccionar especialidades...',
}) => {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Cargar catálogo de especialidades
  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('specialties')
          .select('id, name, slug')
          .order('name');
        if (error) throw error;
        setCatalog(data || []);
      } catch (err) {
        logger.error('[SpecialtyMultiSelect] error cargando catálogo:', err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Cerrar dropdown al click afuera
  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const toggle = (id) => {
    if (disabled) return;
    const next = value.includes(id)
      ? value.filter(v => v !== id)
      : [...value, id];
    onChange?.(next);
  };

  const remove = (id, e) => {
    e?.stopPropagation();
    if (disabled) return;
    onChange?.(value.filter(v => v !== id));
  };

  const selectedItems = catalog.filter(s => value.includes(s.id));

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger / Selected chips */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled || loading}
        className={cn(
          'w-full flex items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-sm shadow-sm transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'hover:bg-muted/40 cursor-pointer'
        )}
      >
        <div className="flex flex-wrap gap-1 flex-1 min-h-[20px]">
          {loading ? (
            <span className="text-muted-foreground inline-flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Cargando...
            </span>
          ) : selectedItems.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selectedItems.map(s => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium"
              >
                {s.name}
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => remove(s.id, e)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                  aria-label={`Quitar ${s.name}`}
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))
          )}
        </div>
        <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform flex-shrink-0', open && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {open && !loading && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-64 overflow-auto">
          {catalog.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Sin especialidades disponibles.</div>
          ) : (
            <ul className="py-1">
              {catalog.map(s => {
                const isSelected = value.includes(s.id);
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => toggle(s.id)}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted/60 transition-colors text-left',
                        isSelected && 'bg-primary/5'
                      )}
                    >
                      <div className={cn(
                        'h-4 w-4 rounded-sm border flex items-center justify-center flex-shrink-0',
                        isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'
                      )}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <span className={cn(isSelected && 'font-medium')}>{s.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SpecialtyMultiSelect;
