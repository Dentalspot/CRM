import React, { useState } from 'react';
import { Save, RotateCcw, Baby, User, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ADULT_TEETH, CHILD_TEETH } from '@/constants/dentalConstants';
import { useOdontogram } from '../hooks/useOdontogram';
import DentalArch from './DentalArch';
import ConditionLegend from './ConditionLegend';

/**
 * Componente principal del Odontograma.
 * Orquesta arcos dentales, toolbar y leyenda.
 */
const Odontogram = ({ patientId }) => {
  const {
    teethData,
    toothType,
    loading,
    saving,
    lastSaved,
    updateSurface,
    changeToothType,
    save,
    reset,
  } = useOdontogram(patientId);

  const [selectedCondition, setSelectedCondition] = useState('caries');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const teeth = toothType === 'adult' ? ADULT_TEETH : CHILD_TEETH;

  const handleSave = async () => {
    try {
      await save();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {
      // Error ya se logea en el hook
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-slate-500">Cargando odontograma...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => changeToothType('adult')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                toothType === 'adult'
                  ? 'bg-primary text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4" />
              Adulto
            </button>
            <button
              onClick={() => changeToothType('child')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                toothType === 'child'
                  ? 'bg-primary text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Baby className="w-4 h-4" />
              Infantil
            </button>
          </div>
          {lastSaved && (
            <span className="text-xs text-slate-400">
              Guardado: {new Date(lastSaved).toLocaleString('es-CL', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={reset} className="text-slate-600">
            <RotateCcw className="w-4 h-4 mr-1" />
            Limpiar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4 mr-1" />
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            {saving ? 'Guardando...' : saveSuccess ? 'Guardado' : 'Guardar'}
          </Button>
        </div>
      </div>

      {/* Leyenda / Selector de condicion */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Selecciona condicion y haz clic en la superficie del diente
        </p>
        <ConditionLegend selectedCondition={selectedCondition} onSelect={setSelectedCondition} />
      </div>

      {/* Odontograma */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 overflow-x-auto">
        <div className="min-w-[600px] space-y-6">
          {/* Arco Superior */}
          <DentalArch
            label="Superior"
            leftTeeth={teeth.upperRight}
            rightTeeth={teeth.upperLeft}
            teethData={teethData}
            selectedCondition={selectedCondition}
            onSurfaceClick={updateSurface}
          />

          {/* Separador */}
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-dashed border-slate-300" />
            <span className="text-xs text-slate-400 font-medium">Linea oclusal</span>
            <div className="flex-1 border-t border-dashed border-slate-300" />
          </div>

          {/* Arco Inferior */}
          <DentalArch
            label="Inferior"
            leftTeeth={teeth.lowerRight}
            rightTeeth={teeth.lowerLeft}
            teethData={teethData}
            selectedCondition={selectedCondition}
            onSurfaceClick={updateSurface}
          />
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-slate-400 text-center">
        Odontograma digital - Sistema FDI. Los datos se almacenan de forma segura y encriptada.
      </p>
    </div>
  );
};

export default Odontogram;
