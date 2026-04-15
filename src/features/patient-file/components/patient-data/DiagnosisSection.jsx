import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Stethoscope, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import OdontogramSummary from '@/features/odontogram/components/OdontogramSummary';

const DiagnosisSection = ({
  patientId,
  patientDiagnoses,
  filteredCodes,
  selectedSystem,
  setSelectedSystem,
  diagnosisSearch,
  setDiagnosisSearch,
  showDiagnosisList,
  setShowDiagnosisList,
  loadingDiagnoses,
  addingDiagnosis,
  handleAddDiagnosis,
  handleRemoveDiagnosis,
  handleSetPrimary,
  diagnosis,
  onDiagnosisChange,
}) => {
  // Load diagnostic odontogram data directly from DB
  const [odontogramTeethData, setOdontogramTeethData] = useState(null);

  useEffect(() => {
    if (!patientId) return;
    const loadOdontogram = async () => {
      const { data } = await supabase
        .from('odontograms')
        .select('teeth_data')
        .eq('patient_id', patientId)
        .eq('odontogram_type', 'diagnostico')
        .maybeSingle();
      if (data?.teeth_data) setOdontogramTeethData(data.teeth_data);
    };
    loadOdontogram();

    // Listen for odontogram updates via realtime or custom event
    const channel = supabase
      .channel(`odontogram-${patientId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'odontograms',
        filter: `patient_id=eq.${patientId}`,
      }, (payload) => {
        if (payload.new?.odontogram_type === 'diagnostico') {
          setOdontogramTeethData(payload.new.teeth_data);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [patientId]);

  return (
    <Card className="shadow-sm border-teal-100">
      <CardHeader className="pb-4 border-b border-teal-100 bg-teal-50/30">
        <CardTitle className="text-lg text-teal-800 font-bold flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-teal-600" />
          Diagnósticos Odontológicos
          <Badge variant="outline" className="ml-2 text-xs">CIE-11</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Odontogram findings - auto-generated from diagnostic odontogram */}
        {odontogramTeethData && (
          <>
            <OdontogramSummary teethData={odontogramTeethData} />
            <Separator className="my-5" />
          </>
        )}
        {/* Current Diagnoses */}
        {patientDiagnoses.length > 0 && (
          <div className="space-y-3 mb-6">
            <Label className="text-teal-700 font-medium">Diagnósticos Asignados</Label>
            {patientDiagnoses.map((pd) => (
              <div
                key={pd.id}
                className={cn(
                  "flex items-start justify-between p-3 rounded-lg border transition-colors",
                  pd.is_primary ? "bg-teal-50 border-teal-200" : "bg-gray-50 border-gray-200"
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-teal-600 text-white font-mono text-xs">
                      {pd.diagnosis_code}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {pd.diagnosis_system}
                    </Badge>
                    {pd.is_primary && (
                      <Badge className="bg-pink-500 text-white text-[10px]">Principal</Badge>
                    )}
                  </div>
                  <p className="font-medium mt-1 text-gray-900">{pd.diagnosis_name}</p>
                  {pd.clinical_description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{pd.clinical_description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {!pd.is_primary && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetPrimary(pd.id)}
                      className="text-xs h-7"
                    >
                      Marcar principal
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveDiagnosis(pd.id)}
                    className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Diagnosis */}
        <div className="space-y-3">
          <Label className="text-teal-700 font-medium">Agregar Diagnóstico</Label>

          <div className="flex gap-2">
            <Button
              type="button"
              variant={selectedSystem === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSystem('all')}
              className={selectedSystem === 'all' ? 'bg-teal-600 hover:bg-teal-700' : ''}
            >
              Todos
            </Button>
            <Button
              type="button"
              variant={selectedSystem === 'CIE-11' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSystem('CIE-11')}
              className={selectedSystem === 'CIE-11' ? 'bg-teal-600 hover:bg-teal-700' : ''}
            >
              CIE-11
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar diagnóstico por código o nombre..."
              value={diagnosisSearch}
              onChange={(e) => {
                setDiagnosisSearch(e.target.value);
                setShowDiagnosisList(true);
              }}
              onFocus={() => setShowDiagnosisList(true)}
              className="pl-10 h-11"
            />
          </div>

          {showDiagnosisList && (
            <div className="border rounded-lg max-h-[250px] overflow-y-auto bg-white shadow-sm">
              {loadingDiagnoses ? (
                <div className="p-4 text-center text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Cargando catálogo...
                </div>
              ) : filteredCodes.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No se encontraron diagnósticos
                </div>
              ) : (
                filteredCodes.slice(0, 30).map((code) => (
                  <button
                    key={code.id}
                    type="button"
                    onClick={() => handleAddDiagnosis(code)}
                    disabled={addingDiagnosis}
                    className="w-full text-left p-3 hover:bg-teal-50 border-b last:border-b-0 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono text-xs bg-white">
                        {code.code}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {code.diagnosis_systems?.code}
                      </Badge>
                    </div>
                    <p className="font-medium text-gray-900 text-sm">{code.name}</p>
                    {code.description && (
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                        {code.description}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {showDiagnosisList && (
            <div
              className="fixed inset-0 z-[-1]"
              onClick={() => setShowDiagnosisList(false)}
            />
          )}
        </div>

        <div className="mt-6 space-y-2">
          <Label htmlFor="diagnosis" className="text-teal-700 font-medium">
            Notas Adicionales del Diagnóstico
          </Label>
          <Textarea
            id="diagnosis"
            value={diagnosis}
            onChange={(e) => onDiagnosisChange(e.target.value)}
            placeholder="Observaciones clínicas adicionales..."
            rows={3}
            className="resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default DiagnosisSection;
