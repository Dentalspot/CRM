import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Check, ChevronDown, User, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * @file src/components/ui/patient-combobox.jsx
 *
 * Combobox de pacientes con autocomplete client-side. Filtra por nombre,
 * email o teléfono a medida que el user escribe.
 *
 * Props:
 *  - patients: array de objetos con shape { id, profile?: {full_name, email, phone}, full_name?, email?, phone? }
 *    (acepta tanto el patient con profile anidado como el denormalizado)
 *  - value: id del paciente seleccionado actualmente (o '')
 *  - onChange(patientId): callback
 *  - placeholder: string default "Selecciona paciente"
 *  - disabled
 *  - loading
 *
 * Comportamiento:
 *  - Click en input → abre dropdown con todos los pacientes
 *  - Escribir → filtra la lista en vivo (nombre / email / phone)
 *  - Click en una opción → selecciona y cierra
 *  - Click afuera → cierra
 *  - Si value está seteado, muestra el nombre del paciente seleccionado
 */

const getPatientLabel = (p) => {
  return p?.profile?.full_name || p?.full_name || 'Paciente sin nombre';
};

const getPatientSubtext = (p) => {
  const email = p?.profile?.email || p?.email;
  const phone = p?.profile?.phone || p?.phone;
  return [email, phone].filter(Boolean).join(' · ');
};

const PatientCombobox = ({
  patients = [],
  value,
  onChange,
  placeholder = 'Selecciona paciente',
  disabled = false,
  loading = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === value) || null,
    [patients, value]
  );

  // Cuando cambia el value externo, limpiar searchTerm para mostrar el label
  useEffect(() => {
    setSearchTerm('');
  }, [value]);

  // Close al click outside
  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return patients;
    const q = searchTerm.toLowerCase().trim();
    return patients.filter((p) => {
      const name = getPatientLabel(p).toLowerCase();
      const email = (p?.profile?.email || p?.email || '').toLowerCase();
      const phone = (p?.profile?.phone || p?.phone || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [patients, searchTerm]);

  const handleSelect = (patientId) => {
    onChange?.(patientId);
    setOpen(false);
    setSearchTerm('');
  };

  // Display: si hay paciente seleccionado y user no está escribiendo, mostrar nombre.
  // Si user está escribiendo (open + searchTerm), mostrar input con search.
  const displayValue = open ? searchTerm : (selectedPatient ? getPatientLabel(selectedPatient) : '');

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          value={displayValue}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={loading ? 'Cargando...' : placeholder}
          disabled={disabled || loading}
          className="pl-9 pr-9"
        />
        <ChevronDown
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 transition-transform pointer-events-none',
            open && 'rotate-180'
          )}
        />
      </div>

      {open && !disabled && !loading && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-64 overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground italic">
              {searchTerm
                ? `Sin resultados para "${searchTerm}"`
                : 'Sin pacientes registrados'}
            </div>
          ) : (
            <ul className="py-1">
              {filtered.map((p) => {
                const isSelected = p.id === value;
                const label = getPatientLabel(p);
                const subtext = getPatientSubtext(p);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(p.id)}
                      className={cn(
                        'flex w-full items-start gap-2 px-3 py-2 text-sm hover:bg-muted/60 transition-colors text-left',
                        isSelected && 'bg-primary/5'
                      )}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {isSelected ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn('font-medium truncate', isSelected && 'text-primary')}>
                          {label}
                        </div>
                        {subtext && (
                          <div className="text-xs text-muted-foreground truncate">{subtext}</div>
                        )}
                      </div>
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

export default PatientCombobox;
