import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

/**
 * @file ClinicalHistoryFilters.jsx
 * @description Provides advanced filtering options for the clinical history list.
 */
const ClinicalHistoryFilters = () => {
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 mb-6 border rounded-lg bg-card">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por paciente o terapeuta..." className="pl-8" />
      </div>
      <div className="flex gap-2">
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo de Registro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Tipos</SelectItem>
            <SelectItem value="sesion_terapia">Sesión de Terapia</SelectItem>
            <SelectItem value="evaluacion_inicial">Evaluación Inicial</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado Cumplimiento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Estados</SelectItem>
            <SelectItem value="compliant">Cumple</SelectItem>
            <SelectItem value="pending_review">Pendiente</SelectItem>
            <SelectItem value="non_compliant">No Cumple</SelectItem>
          </SelectContent>
        </Select>
        <Button>Aplicar</Button>
      </div>
    </div>
  );
};

export default ClinicalHistoryFilters;