import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Wand2 } from 'lucide-react';

const DynamicReportForm = ({ hookData, onCancel }) => {
  const {
    selectedTemplate,
    selectedPatient,
    selectedAppointment,
    formData,
    handleFormChange,
    generateReport,
    setStep
  } = hookData;

  if (!selectedTemplate) return null;

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => setStep(1)} className="mb-2 pl-0 hover:pl-2 transition-all">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a selección
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">{selectedTemplate.name}</h2>
        <p className="text-muted-foreground mt-1">
          Paciente: <span className="font-medium text-foreground">{selectedPatient.name}</span>
          {selectedAppointment && <span> • Sesión: {selectedAppointment.date}</span>}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completar Informe</CardTitle>
          <CardDescription>
            Rellena los campos a continuación. Los campos marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {selectedTemplate.fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor={field.name}>
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </Label>
                {field.type === 'textarea' && (
                  <Button variant="ghost" size="xs" className="h-6 text-xs text-blue-600">
                    <Wand2 className="h-3 w-3 mr-1" /> Mejorar con IA (Pronto)
                  </Button>
                )}
              </div>

              {field.type === 'text' && (
                <Input
                  id={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleFormChange(field.name, e.target.value)}
                  placeholder={field.placeholder || ''}
                />
              )}

              {field.type === 'textarea' && (
                <Textarea
                  id={field.name}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleFormChange(field.name, e.target.value)}
                  placeholder={field.placeholder || ''}
                  className="min-h-[100px]"
                />
              )}

              {field.type === 'select' && (
                <Select
                  value={formData[field.name] || ''}
                  onValueChange={(val) => handleFormChange(field.name, val)}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder="Seleccionar opción" />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={generateReport}>
            Vista Previa <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DynamicReportForm;