import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, ArrowLeft, AlertCircle, MapPin } from 'lucide-react';
import { DentalSpot_FIELDS as DEFAULT_FIELDS } from '../constants/fieldConfig';
const MappingStep = ({ headers, rawData, columnMap, setColumnMap, hasRequired, fileName, onNext, onBack, fieldsConfig }) => {
  const DentalSpot_FIELDS = fieldsConfig || DEFAULT_FIELDS;
  return (
    
    <Card>
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <MapPin className="h-5 w-5 text-teal-600" />
        Mapear columnas
      </CardTitle>
      <CardDescription>
        Encontramos <strong>{headers.length}</strong> columnas y <strong>{rawData.length}</strong> filas en <em>{fileName}</em>.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      {headers.map((col) => (
        <div key={col} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{col}</p>
            <p className="text-[11px] text-gray-400 truncate">
              ej: {rawData[0]?.[col]?.toString().substring(0, 40) || '—'}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
          <Select
            value={columnMap[col] || 'skip'}
            onValueChange={(v) => setColumnMap(prev => ({ ...prev, [col]: v }))}
          >
            <SelectTrigger className="w-56 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DentalSpot_FIELDS.map(f => (
                <SelectItem key={f.key} value={f.key}>
                  {f.label} {f.required && <span className="text-red-500">*</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}

      {!hasRequired && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-sm text-amber-800">
            Debes asignar al menos <strong>"Nombre completo"</strong> para continuar.
          </span>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Button>
        <Button className="bg-teal-600 hover:bg-teal-700" disabled={!hasRequired} onClick={onNext}>
          Vista previa <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </CardContent>
  </Card>
  );
};

export default MappingStep;