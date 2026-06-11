import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Baby, User, Loader2, Check, Plus, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ADULT_TEETH, CHILD_TEETH } from '@/constants/dentalConstants';
import { useOdontogram } from '../hooks/useOdontogram';
import DentalArch from './DentalArch';
import ConditionLegend from './ConditionLegend';
import AddBudgetItemModal from './AddBudgetItemModal';
import TreatmentSuggestionsPanel from './TreatmentSuggestionsPanel';
import useOdontogramSuggestions from '../hooks/useOdontogramSuggestions';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Componente principal del Odontograma.
 * Orquesta arcos dentales, toolbar y leyenda.
 */
/**
 * @param {string} patientId - ID del paciente (modo standalone con persistencia DB)
 * @param {object} externalTeethData - Datos de dientes externos (modo evaluación)
 * @param {function} onTeethChange - Callback cuando cambian los dientes (modo evaluación)
 * @param {boolean} evaluationMode - Si true, usa datos externos en vez de DB
 */
const Odontogram = ({ patientId, odontogramType = 'diagnostico', externalTeethData, onTeethChange, evaluationMode = false, onSave }) => {
  const { user } = useAuth();
  const hook = useOdontogram(evaluationMode ? null : patientId, odontogramType, { onSave });
  const {
    teethData: hookTeethData,
    toothType,
    loading,
    saving,
    lastSaved,
    updateSurface: hookUpdateSurface,
    changeToothType,
    save,
    reset: hookReset,
  } = hook;

  // In evaluation mode, use external data; otherwise use hook data
  const teethData = evaluationMode ? (externalTeethData || {}) : hookTeethData;

  const updateSurface = evaluationMode
    ? (toothNumber, surface, conditionId) => {
        const updated = {
          ...teethData,
          [toothNumber]: { ...teethData[toothNumber], [surface]: conditionId },
        };
        onTeethChange?.(updated);
      }
    : hookUpdateSurface;

  const reset = evaluationMode
    ? () => {
        const teeth = toothType === 'adult' ? ADULT_TEETH : CHILD_TEETH;
        const allTeeth = [...teeth.upperRight, ...teeth.upperLeft, ...teeth.lowerLeft, ...teeth.lowerRight];
        const data = {};
        allTeeth.forEach((t) => { data[t] = { mesial: 'healthy', distal: 'healthy', oclusal: 'healthy', vestibular: 'healthy', lingual: 'healthy' }; });
        onTeethChange?.(data);
      }
    : hookReset;

  const [selectedCondition, setSelectedCondition] = useState('caries');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Spec 030 US3: estado para modal "Agregar tratamiento al presupuesto"
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [patientFullName, setPatientFullName] = useState(null);
  const [addedItemsThisSession, setAddedItemsThisSession] = useState([]);

  // Spec 030 followup mejora 1: sugerencias automáticas desde diagnóstico
  const { suggestions, dismissSuggestion } = useOdontogramSuggestions(
    teethData,
    !evaluationMode && patientId ? user?.id : null
  );
  const showSuggestionsPanel = !evaluationMode && patientId;

  const teeth = toothType === 'adult' ? ADULT_TEETH : CHILD_TEETH;
  const allToothNumbers = [
    ...teeth.upperRight,
    ...teeth.upperLeft,
    ...teeth.lowerLeft,
    ...teeth.lowerRight,
  ];

  // Lookup nombre del paciente para el title del budget
  useEffect(() => {
    if (!patientId || evaluationMode) return;
    supabase
      .from('patients')
      .select('full_name, profile_id, profile:profiles!patients_profile_id_fkey(full_name)')
      .eq('id', patientId)
      .maybeSingle()
      .then(({ data }) => {
        const name = data?.profile?.full_name || data?.full_name || null;
        setPatientFullName(name);
      });
  }, [patientId, evaluationMode]);

  const handleSave = async () => {
    if (evaluationMode) return; // Saving handled by parent
    try {
      await save();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {
      // Error ya se logea en el hook
    }
  };

  if (!evaluationMode && loading) {
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

        <div className="flex items-center gap-2 flex-wrap">
          {/* Spec 030 US3: solo en modo standalone con patientId */}
          {!evaluationMode && patientId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBudgetModalOpen(true)}
              className="text-teal-700 border-teal-300 hover:bg-teal-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar al presupuesto
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={reset} className="text-slate-600">
            <RotateCcw className="w-4 h-4 mr-1" />
            Limpiar
          </Button>
          {!evaluationMode && (
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
          )}
        </div>
      </div>

      {/* Leyenda / Selector de condicion */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Selecciona condicion y haz clic en la superficie del diente
        </p>
        <ConditionLegend selectedCondition={selectedCondition} onSelect={setSelectedCondition} />
      </div>

      {/* Spec 030 followup mejora 1: split layout odontograma (izquierda) +
          panel sugerencias (derecha) en xl, stack en mobile/tablet. */}
      <div className={showSuggestionsPanel ? 'flex flex-col xl:flex-row gap-4' : ''}>
        {/* Odontograma */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 overflow-x-auto flex-1">
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

        {/* Panel lateral de sugerencias */}
        {showSuggestionsPanel && (
          <div className="xl:w-[340px] xl:flex-shrink-0">
            <TreatmentSuggestionsPanel
              suggestions={suggestions}
              onDismiss={dismissSuggestion}
              patientId={patientId}
              patientFullName={patientFullName}
              onSaved={() => {
                // El padre puede observar via onSave si necesita refrescar
                // BudgetsTab. No hacemos nada extra acá — los chips visuales
                // verdes ya cubren feedback inmediato.
              }}
            />
          </div>
        )}
      </div>

      {/* Spec 030 US3: lista de items agregados al presupuesto en esta sesión */}
      {!evaluationMode && patientId && addedItemsThisSession.length > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="w-4 h-4 text-teal-700" />
            <h4 className="text-sm font-semibold text-teal-800">
              Agregado al presupuesto en esta sesión ({addedItemsThisSession.length})
            </h4>
          </div>
          <ul className="space-y-1 text-sm">
            {addedItemsThisSession.map((row) => (
              <li
                key={row.item.id}
                className="flex items-center justify-between text-teal-900"
              >
                <span>{row.item.description}</span>
                <span className="font-medium">
                  ${Number(row.item.unit_price).toLocaleString('es-CL')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-slate-400 text-center">
        Odontograma digital - Sistema FDI. Los datos se almacenan de forma segura y encriptada.
      </p>

      {/* Spec 030 US3: modal para agregar tratamiento al presupuesto */}
      {!evaluationMode && patientId && (
        <AddBudgetItemModal
          isOpen={budgetModalOpen}
          onClose={() => setBudgetModalOpen(false)}
          patientId={patientId}
          patientFullName={patientFullName}
          toothNumbers={allToothNumbers}
          onItemAdded={(row) =>
            setAddedItemsThisSession((prev) => [...prev, row])
          }
        />
      )}
    </div>
  );
};

export default Odontogram;
