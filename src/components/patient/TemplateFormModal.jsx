import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, FileText, Download, Eye, Printer, AlertCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabaseClient';
import { downloadReportPDF, previewReportPDF } from '@/lib/pdfGenerator';
import logger from '@/lib/utils/logger';
import { calculateAge } from '@/lib/utils/calculations';


const TemplateFormModal = ({
  isOpen,
  onClose,
  template,
  patient,
  therapistId,
  existingReport = null,
  onSaved
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [therapist, setTherapist] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [fields, setFields] = useState([]);

  useEffect(() => {
    if (template && isOpen) {
      const parsedFields = parseTemplateStructure(template);
      setFields(parsedFields);

      if (existingReport?.editable_json) {
        const existingData = typeof existingReport.editable_json === 'string'
          ? JSON.parse(existingReport.editable_json)
          : existingReport.editable_json;
        setFormData(existingData);
      } else {
        setFormData({
          nombre: patient?.full_name || '',
          fecha: new Date().toISOString().split('T')[0],
          edad: patient?.birthdate ? calculateAge(patient.birthdate) : '',
          fecha_nacimiento: patient?.birthdate || '',
          diagnostico: patient?.diagnosis || '',
          rut: patient?.rut || '',
          telefono: patient?.phone || '',
          email: patient?.email || ''
        });
      }
    }

    if (therapistId && isOpen) {
      loadTherapistData();
    }
  }, [template, isOpen, existingReport, patient, therapistId]);

  const parseTemplateStructure = (template) => {
    if (!template?.variables) return [];

    try {
      const vars = typeof template.variables === 'string'
        ? JSON.parse(template.variables)
        : template.variables;

      if (vars.fields && Array.isArray(vars.fields)) {
        return vars.fields;
      }

      if (vars.structure && Array.isArray(vars.structure)) {
        return vars.structure;
      }

      if (vars.sections && Array.isArray(vars.sections)) {
        const flatFields = [];
        vars.sections.forEach(section => {
          flatFields.push({
            type: 'header',
            label: section.title,
            id: `section_${section.title?.replace(/\s+/g, '_')}`
          });
          if (section.fields) {
            flatFields.push(...section.fields);
          }
        });
        return flatFields;
      }

      return [];
    } catch (e) {
      logger.error('Error parsing template:', e);
      return [];
    }
  };

  const loadTherapistData = async () => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email, phone, rut')
        .eq('id', therapistId)
        .single();

      const { data: detailsData } = await supabase
        .from('therapist_details')
        .select('professional_title, registration_supersalud, public_email, about_me')
        .eq('user_id', therapistId)
        .single();

      setTherapist({
        ...profileData,
        ...detailsData
      });
    } catch (e) {
      logger.error('Error loading therapist data:', e);
    }
  };

  const handleFieldChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSave = async (status = 'draft') => {
    setSaving(true);
    try {
      const reportData = {
        patient_id: patient.id,
        therapist_id: therapistId,
        report_type: template.category || 'evaluacion',
        template_id: template.id,
        editable_json: formData,
        status: status,
        updated_at: new Date().toISOString()
      };

      if (existingReport?.id) {
        const { error } = await supabase
          .from('clinical_reports')
          .update(reportData)
          .eq('id', existingReport.id);
        if (error) throw error;
        toast({ title: "✅ Documento actualizado" });
      } else {
        reportData.created_at = new Date().toISOString();
        const { error } = await supabase
          .from('clinical_reports')
          .insert(reportData);
        if (error) throw error;
        toast({ title: "✅ Documento guardado" });
      }

      if (status !== 'draft') {
        onSaved?.();
        onClose();
      }
    } catch (error) {
      logger.error('Error saving:', error);
      toast({ variant: "destructive", title: "Error al guardar", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewPDF = () => {
    setGeneratingPdf(true);
    try {
      const url = previewReportPDF({
        template,
        data: formData,
        patient,
        therapist,
        clinic,
        reportDate: formData.fecha
      });

      if (url) {
        window.open(url, '_blank');
      } else {
        toast({ variant: "destructive", title: "Error al generar vista previa" });
      }
    } catch (error) {
      logger.error('Error generating preview:', error);
      toast({ variant: "destructive", title: "Error al generar PDF" });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDownloadPDF = () => {
    setGeneratingPdf(true);
    try {
      const success = downloadReportPDF({
        template,
        data: formData,
        patient,
        therapist,
        clinic,
        reportDate: formData.fecha
      });

      if (success) {
        toast({ title: "✅ PDF descargado" });
      } else {
        toast({ variant: "destructive", title: "Error al generar PDF" });
      }
    } catch (error) {
      logger.error('Error downloading PDF:', error);
      toast({ variant: "destructive", title: "Error al generar PDF" });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const renderField = (field) => {
    const value = formData[field.id] ?? '';

    switch (field.type) {
      case 'header':
        return null;

      case 'info':
        return (
          <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{field.content || field.label}</span>
            </div>
          </div>
        );

      case 'text':
        return (
          <Input
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            className="h-9"
          />
        );

      case 'number':
        return (
          <Input
            id={field.id}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            className="h-9 w-28"
          />
        );

      case 'date':
        return (
          <Input
            id={field.id}
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className="h-9 w-44"
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            rows={field.rows || 3}
            className="resize-none"
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              id={field.id}
              checked={value === true || value === 'true'}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
            />
            <Label htmlFor={field.id} className="font-normal cursor-pointer">
              {field.checkLabel || 'Sí'}
            </Label>
          </div>
        );

      case 'yesno':
        return (
          <RadioGroup
            value={value}
            onValueChange={(v) => handleFieldChange(field.id, v)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="si" id={`${field.id}-si`} />
              <Label htmlFor={`${field.id}-si`} className="font-normal cursor-pointer">Sí</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id={`${field.id}-no`} />
              <Label htmlFor={`${field.id}-no`} className="font-normal cursor-pointer">No</Label>
            </div>
          </RadioGroup>
        );

      case 'radio':
        return (
          <RadioGroup
            value={value}
            onValueChange={(v) => handleFieldChange(field.id, v)}
            className="flex flex-wrap gap-3"
          >
            {(field.options || []).map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                <Label htmlFor={`${field.id}-${option}`} className="font-normal cursor-pointer text-sm">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'severity':
        return (
          <RadioGroup
            value={value}
            onValueChange={(v) => handleFieldChange(field.id, v)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="L" id={`${field.id}-l`} className="border-green-500 text-green-500" />
              <Label htmlFor={`${field.id}-l`} className="font-normal cursor-pointer text-green-600 text-sm">
                Leve
              </Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="M" id={`${field.id}-m`} className="border-yellow-500 text-yellow-500" />
              <Label htmlFor={`${field.id}-m`} className="font-normal cursor-pointer text-yellow-600 text-sm">
                Moderado
              </Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="S" id={`${field.id}-s`} className="border-red-500 text-red-500" />
              <Label htmlFor={`${field.id}-s`} className="font-normal cursor-pointer text-red-600 text-sm">
                Severo
              </Label>
            </div>
          </RadioGroup>
        );

      case 'loglp':
        return (
          <RadioGroup
            value={value}
            onValueChange={(v) => handleFieldChange(field.id, v)}
            className="flex gap-3"
          >
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="L" id={`${field.id}-logra`} className="border-green-500 text-green-500" />
              <Label htmlFor={`${field.id}-logra`} className="font-normal cursor-pointer text-green-600 text-xs">
                Logra
              </Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="LP" id={`${field.id}-parcial`} className="border-yellow-500 text-yellow-500" />
              <Label htmlFor={`${field.id}-parcial`} className="font-normal cursor-pointer text-yellow-600 text-xs">
                Parcial
              </Label>
            </div>
            <div className="flex items-center space-x-1.5">
              <RadioGroupItem value="NL" id={`${field.id}-nologra`} className="border-red-500 text-red-500" />
              <Label htmlFor={`${field.id}-nologra`} className="font-normal cursor-pointer text-red-600 text-xs">
                No Logra
              </Label>
            </div>
          </RadioGroup>
        );

      default:
        return (
          <Input
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            className="h-9"
          />
        );
    }
  };

  const groupFieldsByHeaders = () => {
    const groups = [];
    let currentGroup = { title: 'General', fields: [] };

    fields.forEach(field => {
      if (field.type === 'header') {
        if (currentGroup.fields.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = { title: field.label, fields: [] };
      } else {
        currentGroup.fields.push(field);
      }
    });

    if (currentGroup.fields.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  };

  if (fields.length === 0 && isOpen) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              Plantilla sin estructura
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-500 py-4">
            Esta plantilla no tiene campos definidos.
            Por favor, edita la plantilla y agrega campos desde "Mi Perfil → Documentos".
          </p>
          <DialogFooter>
            <Button onClick={onClose}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const fieldGroups = groupFieldsByHeaders();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header - Fixed */}
        <div className="px-6 py-4 border-b shrink-0 bg-white">
          <DialogTitle className="flex items-center gap-2 text-primary">
            <FileText className="h-5 w-5" />
            {template?.name || 'Formulario Clínico'}
          </DialogTitle>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <span>Paciente: <strong className="text-foreground">{patient?.full_name}</strong></span>
            {existingReport && (
              <Badge variant="secondary" className="text-xs">Editando borrador</Badge>
            )}
          </div>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {fieldGroups.map((group, groupIndex) => (
            <Card key={groupIndex} className="shadow-sm overflow-hidden">
              <CardHeader className="py-3 bg-muted/50 border-b">
                <CardTitle className="text-base font-semibold text-primary flex items-center gap-2">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  {group.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid gap-4">
                  {group.fields.map((field, fieldIndex) => {
                    if (field.type === 'info') {
                      return (
                        <div key={fieldIndex}>
                          {renderField(field)}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={fieldIndex}
                        className={`
                          ${field.type === 'textarea' ? 'col-span-full' : ''}
                          ${field.inline ? 'flex items-center gap-4' : 'space-y-1.5'}
                        `}
                      >
                        <Label
                          htmlFor={field.id}
                          className={`
                            text-sm font-medium text-gray-700
                            ${field.inline ? 'min-w-[180px] text-right shrink-0' : ''}
                          `}
                        >
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <div className={field.inline ? 'flex-1' : ''}>
                          {renderField(field)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer - Fixed */}
        <div className="px-6 py-4 border-t bg-muted/30 shrink-0">
          <div className="flex items-center justify-between w-full gap-2 flex-wrap">
            {/* PDF Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviewPDF}
                disabled={generatingPdf}
                className="text-muted-foreground"
              >
                {generatingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Eye className="h-4 w-4 mr-1.5" />
                )}
                Vista Previa
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={generatingPdf}
                className="text-muted-foreground"
              >
                {generatingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Download className="h-4 w-4 mr-1.5" />
                )}
                Descargar PDF
              </Button>
            </div>

            {/* Save Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSave('draft')}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Save className="h-4 w-4 mr-1.5" />
                )}
                Guardar Borrador
              </Button>
              <Button
                onClick={() => handleSave('signed')}
                disabled={saving}
                className="bg-primary hover:bg-primary/90"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Printer className="h-4 w-4 mr-1.5" />
                )}
                Finalizar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateFormModal;