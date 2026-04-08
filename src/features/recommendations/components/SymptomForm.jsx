import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';

const COMMON_SYMPTOMS = [
  { id: 'tartamudez', label: 'Tartamudez / Bloqueos al hablar' },
  { id: 'dislalia', label: 'Dificultad para pronunciar ciertos sonidos (Dislalia)' },
  { id: 'retraso_lenguaje', label: 'Retraso en el desarrollo del lenguaje' },
  { id: 'afasia', label: 'Dificultad para comprender o producir lenguaje (Afasia)' },
  { id: 'voz', label: 'Problemas de voz (Ronquera, pérdida de voz)' },
  { id: 'deglucion', label: 'Dificultad al tragar (Disfagia)' },
  { id: 'atencion', label: 'Dificultad de atención auditiva' },
  { id: 'lectura', label: 'Dificultades en lectura/escritura' }
];

const SymptomForm = ({ onRecommend, isLoading }) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [additionalInfo, setAdditionalInfo] = useState('');

  const handleToggle = (symptomId) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onRecommend({
      symptoms: selectedSymptoms.map(id => COMMON_SYMPTOMS.find(s => s.id === id).label),
      additionalInfo
    });
  };

  return (
    <Card className="w-full border-primary/20 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Asistente de Recomendación IA
        </CardTitle>
        <CardDescription>
          Selecciona los síntomas o necesidades para que nuestra IA encuentre al especialista ideal.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Síntomas Comunes</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {COMMON_SYMPTOMS.map((symptom) => (
                <div key={symptom.id} className="flex items-center space-x-2 border p-2 rounded-md hover:bg-slate-50 transition-colors">
                  <Checkbox 
                    id={symptom.id} 
                    checked={selectedSymptoms.includes(symptom.id)}
                    onCheckedChange={() => handleToggle(symptom.id)}
                  />
                  <Label htmlFor={symptom.id} className="cursor-pointer flex-1 text-sm font-normal">
                    {symptom.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional-info" className="text-base font-semibold">Información Adicional</Label>
            <Textarea 
              id="additional-info"
              placeholder="Describe con tus propias palabras qué necesitas (ej: 'Mi hijo de 3 años no dice muchas palabras...')"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50/50 flex justify-end p-4 rounded-b-xl">
          <Button 
            type="submit" 
            size="lg" 
            disabled={isLoading || (selectedSymptoms.length === 0 && !additionalInfo.trim())}
            className="w-full md:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Obtener Recomendaciones
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SymptomForm;