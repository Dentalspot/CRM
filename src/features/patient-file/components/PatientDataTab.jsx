import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, FileText, Pencil, X, ClipboardList, Stethoscope, CalendarIcon, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import TemplateFormModal from '@/components/patient/TemplateFormModal';
import DiagnosisSection from './patient-data/DiagnosisSection';
import Odontogram from '@/features/odontogram/components/Odontogram';
import usePatientData from '../hooks/usePatientData';

const CollapsibleSection = ({ number, title, defaultOpen = false, children, editable = false, editing, onEdit, onSave, onCancel, saving, headerRight }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="shadow-sm">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-4 border-b cursor-pointer hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-teal-600 font-bold flex items-center gap-2">
                <span className="bg-pink-500 text-white text-sm px-2 py-0.5 rounded">{number}</span>
                {title}
              </CardTitle>
              <div className="flex items-center gap-2">
                {editable && !editing && (
                  <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                )}
                {editable && editing && (
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-gray-500" onClick={() => onCancel?.()}>
                      <X className="h-3.5 w-3.5" /> Cancelar
                    </Button>
                    <Button type="button" size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700 text-white" disabled={saving} onClick={() => onSave?.()}>
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Guardar
                    </Button>
                  </div>
                )}
                {headerRight}
                <ChevronDown className={cn("h-5 w-5 text-gray-400 transition-transform", open && "rotate-180")} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-6">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

const NoPresentaToggle = ({ label, field, value, onChange, disabled }) => {
  const noPresentaText = `No presenta ${label.toLowerCase()}`;
  const isActive = value?.trim().toLowerCase() === noPresentaText.toLowerCase();

  const handleToggle = () => {
    if (disabled) return;
    if (isActive) {
      onChange(field, '');
    } else {
      onChange(field, noPresentaText);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 border",
        isActive
          ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm"
          : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 hover:text-gray-700",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <CheckCircle2 className={cn("h-3.5 w-3.5", isActive ? "text-emerald-600" : "text-gray-400")} />
      No presenta
    </button>
  );
};

const PatientDataTab = ({ patient, templates = [], onSave }) => {
  const {
    profileData, handleProfileChange,
    displayPhone, handlePhoneChange,
    displayRut, handleRutChange,
    patientData, handlePatientChange,
    displayResponsibleRut, handleResponsibleRutChange,
    patientDiagnoses, filteredCodes,
    selectedSystem, setSelectedSystem,
    diagnosisSearch, setDiagnosisSearch,
    showDiagnosisList, setShowDiagnosisList,
    loadingDiagnoses, addingDiagnosis,
    handleAddDiagnosis, handleRemoveDiagnosis, handleSetPrimary,
    anamnesisTemplates, evaluationTemplates,
    getExistingReport, handleOpenTemplate,
    isFormModalOpen, setFormModalOpen,
    selectedTemplate, setSelectedTemplate,
    loadExistingReports,
    saving, handleSubmit,
    age, user,
  } = usePatientData({ patient, templates, onSave });

  const { toast } = useToast();
  const [editingSection, setEditingSection] = useState(null); // 'identification' | 'health' | 'evaluations' | null

  const handleSaveSection = async () => {
    if (editingSection === 'health' && !patientData.consultation_reason?.trim()) {
      toast({ variant: 'destructive', title: 'Motivo de consulta es obligatorio', description: 'Complete el motivo de consulta antes de guardar.' });
      return;
    }
    await handleSubmit({ preventDefault: () => {} }, { skipRefresh: true });
    setEditingSection(null);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Section 1: Datos Generales */}
        <CollapsibleSection
          number="1"
          title="Identificación del Paciente"
          defaultOpen={true}
          editable
          editing={editingSection === 'identification'}
          onEdit={() => setEditingSection('identification')}
          onSave={handleSaveSection}
          onCancel={() => setEditingSection(null)}
          saving={saving}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {/* 1. Nombre y Apellidos */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-teal-700 font-medium">Nombre y Apellidos</Label>
                <Input
                  id="full_name"
                  value={profileData.full_name}
                  onChange={(e) => handleProfileChange('full_name', e.target.value)}
                  placeholder="Nombre completo del paciente"
                  className="h-10"
                  readOnly={editingSection !== 'identification'}
                />
              </div>

              {/* 2. RUT */}
              <div className="space-y-2">
                <Label htmlFor="rut" className="text-teal-700 font-medium">RUT</Label>
                <Input
                  id="rut"
                  value={displayRut}
                  onChange={handleRutChange}
                  placeholder="12.345.678-9"
                  className="h-10"
                  readOnly={editingSection !== 'identification'}
                />
              </div>

              {/* 3. Fecha de Nacimiento */}
              <div className="space-y-2">
                <Label className="text-teal-700 font-medium">
                  Fecha de Nacimiento
                  {age !== null && (
                    <Badge variant="secondary" className="ml-2 text-xs">{age} años</Badge>
                  )}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={editingSection !== 'identification'}
                      className={cn(
                        "w-full h-10 justify-start text-left font-normal",
                        !profileData.birthdate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {profileData.birthdate
                        ? format(parseISO(profileData.birthdate), "d 'de' MMMM, yyyy", { locale: es })
                        : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      locale={es}
                      selected={profileData.birthdate ? parseISO(profileData.birthdate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const yyyy = date.getFullYear();
                          const mm = String(date.getMonth() + 1).padStart(2, '0');
                          const dd = String(date.getDate()).padStart(2, '0');
                          handleProfileChange('birthdate', `${yyyy}-${mm}-${dd}`);
                        }
                      }}
                      captionLayout="dropdown-buttons"
                      fromYear={1920}
                      toYear={new Date().getFullYear()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* 4. Sexo */}
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-teal-700 font-medium">Sexo</Label>
                <Select value={profileData.gender} onValueChange={(val) => handleProfileChange('gender', val)} disabled={editingSection !== 'identification'}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 5. Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-teal-700 font-medium">Teléfono</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">
                    +569
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="1234 5678"
                    maxLength={9}
                    value={(profileData.phone || '').replace(/^\+?56\s?9\s?/, '').replace(/\D/g, '')}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                      handleProfileChange('phone', `+569${digits}`);
                    }}
                    className="h-10 rounded-l-none"
                    readOnly={editingSection !== 'identification'}
                  />
                </div>
              </div>

              {/* 6. Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-teal-700 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={profileData.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  className="h-10"
                  readOnly={editingSection !== 'identification'}
                />
              </div>

              {/* 7. Previsión */}
              <div className="space-y-2">
                <Label className="text-teal-700 font-medium">Previsión</Label>
                <RadioGroup
                  value={patientData.patient_type}
                  onValueChange={(val) => handlePatientChange('patient_type', val)}
                  className="flex gap-6 h-10 items-center"
                  disabled={editingSection !== 'identification'}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="privado" id="privado" disabled={editingSection !== 'identification'} />
                    <Label htmlFor="privado" className="font-normal cursor-pointer">Privado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fonasa" id="fonasa" disabled={editingSection !== 'identification'} />
                    <Label htmlFor="fonasa" className="font-normal cursor-pointer">Fonasa</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="convenio" id="convenio" disabled={editingSection !== 'identification'} />
                    <Label htmlFor="convenio" className="font-normal cursor-pointer">Convenio</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* 8. Dirección */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-teal-700 font-medium">Dirección</Label>
                <Input
                  id="address"
                  value={patientData.address || ''}
                  onChange={(e) => handlePatientChange('address', e.target.value)}
                  placeholder="Dirección del paciente"
                  className="h-10"
                  readOnly={editingSection !== 'identification'}
                />
              </div>

              {/* 9. Contacto de Emergencia */}
              <div className="space-y-2 md:col-span-2">
                <Label className="text-teal-700 font-medium">Contacto de Emergencia</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    value={patientData.emergency_contact_name || ''}
                    onChange={(e) => handlePatientChange('emergency_contact_name', e.target.value)}
                    placeholder="Nombre del contacto"
                    className="h-10"
                    readOnly={editingSection !== 'identification'}
                  />
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">
                      +569
                    </span>
                    <Input
                      type="tel"
                      placeholder="1234 5678"
                      maxLength={9}
                      value={(patientData.emergency_contact_phone || '').replace(/^\+?56\s?9\s?/, '').replace(/\D/g, '')}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                        handlePatientChange('emergency_contact_phone', `+569${digits}`);
                      }}
                      className="h-10 rounded-l-none"
                      readOnly={editingSection !== 'identification'}
                    />
                  </div>
                </div>
              </div>

              {/* 10. Representante Legal — solo para menores de 16 */}
              {age !== null && age < 16 && (
                <div className="space-y-3 md:col-span-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <Label className="text-amber-800 font-semibold flex items-center gap-2">
                    Representante Legal
                    <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">Requerido para menores de 16</Badge>
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-amber-700">Nombre completo</Label>
                      <Input
                        value={patientData.responsible_name || ''}
                        onChange={(e) => handlePatientChange('responsible_name', e.target.value)}
                        placeholder="Nombre del representante legal"
                        className="h-10 bg-white"
                        readOnly={editingSection !== 'identification'}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-amber-700">RUT del representante</Label>
                      <Input
                        value={displayResponsibleRut}
                        onChange={handleResponsibleRutChange}
                        placeholder="12.345.678-9"
                        className="h-10 bg-white"
                        readOnly={editingSection !== 'identification'}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
        </CollapsibleSection>

        {/* Section 2: Antecedentes de Salud */}
        <CollapsibleSection
          number="2"
          title="Antecedentes de Salud"
          editable
          editing={editingSection === 'health'}
          onEdit={() => setEditingSection('health')}
          onSave={handleSaveSection}
          onCancel={() => setEditingSection(null)}
          saving={saving}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {/* Motivo de Consulta — obligatorio, ocupa ancho completo */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="consultation_reason" className="text-teal-700 font-medium flex items-center gap-1.5">
                Motivo de Consulta
                <span className="text-red-500 text-sm">*</span>
              </Label>
              <Textarea
                id="consultation_reason"
                value={patientData.consultation_reason}
                onChange={(e) => handlePatientChange('consultation_reason', e.target.value)}
                placeholder="Ej: Dolor en molar inferior derecho, Control de rutina, Blanqueamiento dental..."
                rows={2}
                className={cn(
                  "resize-none",
                  editingSection === 'health' && !patientData.consultation_reason?.trim() && "border-red-300 bg-red-50/30",
                  editingSection !== 'health' && patientData.consultation_reason?.trim() && "bg-emerald-50/50 text-emerald-700 border-emerald-200"
                )}
                readOnly={editingSection !== 'health'}
              />
              {editingSection === 'health' && !patientData.consultation_reason?.trim() && (
                <p className="text-xs text-red-500">Este campo es obligatorio</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="allergies" className="text-teal-700 font-medium">Alergias</Label>
                <NoPresentaToggle label="alergias" field="allergies" value={patientData.allergies} onChange={handlePatientChange} disabled={editingSection !== 'health'} />
              </div>
              <Textarea
                id="allergies"
                value={patientData.allergies}
                onChange={(e) => handlePatientChange('allergies', e.target.value)}
                placeholder="Ej: Penicilina, Látex, Anestésicos locales..."
                rows={2}
                className={cn("resize-none", patientData.allergies?.trim().toLowerCase() === 'no presenta alergias' && "bg-emerald-50/50 text-emerald-700 border-emerald-200")}
                readOnly={patientData.allergies?.trim().toLowerCase() === 'no presenta alergias' || editingSection !== 'health'}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="medications" className="text-teal-700 font-medium">Medicamentos en uso</Label>
                <NoPresentaToggle label="medicamentos en uso" field="medications" value={patientData.medications} onChange={handlePatientChange} disabled={editingSection !== 'health'} />
              </div>
              <Textarea
                id="medications"
                value={patientData.medications || ''}
                onChange={(e) => handlePatientChange('medications', e.target.value)}
                placeholder="Ej: Aspirina 100mg, Metformina 850mg..."
                rows={2}
                className={cn("resize-none", (patientData.medications || '').trim().toLowerCase() === 'no presenta medicamentos en uso' && "bg-emerald-50/50 text-emerald-700 border-emerald-200")}
                readOnly={(patientData.medications || '').trim().toLowerCase() === 'no presenta medicamentos en uso' || editingSection !== 'health'}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="systemic_diseases" className="text-teal-700 font-medium">Enfermedades sistémicas</Label>
                <NoPresentaToggle label="enfermedades sistémicas" field="systemic_diseases" value={patientData.systemic_diseases} onChange={handlePatientChange} disabled={editingSection !== 'health'} />
              </div>
              <Textarea
                id="systemic_diseases"
                value={patientData.systemic_diseases || ''}
                onChange={(e) => handlePatientChange('systemic_diseases', e.target.value)}
                placeholder="Ej: Diabetes, Hipertensión, Cardiopatía..."
                rows={2}
                className={cn("resize-none", (patientData.systemic_diseases || '').trim().toLowerCase() === 'no presenta enfermedades sistémicas' && "bg-emerald-50/50 text-emerald-700 border-emerald-200")}
                readOnly={(patientData.systemic_diseases || '').trim().toLowerCase() === 'no presenta enfermedades sistémicas' || editingSection !== 'health'}
              />
            </div>

            {profileData.gender === 'femenino' && (
              <div className="space-y-2">
                <Label className="text-teal-700 font-medium">Embarazo</Label>
                <RadioGroup
                  value={patientData.pregnancy || 'no'}
                  onValueChange={(val) => handlePatientChange('pregnancy', val)}
                  className="flex gap-6 h-10 items-center"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="preg-no" />
                    <Label htmlFor="preg-no" className="font-normal cursor-pointer">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="si" id="preg-si" />
                    <Label htmlFor="preg-si" className="font-normal cursor-pointer">Sí</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sospecha" id="preg-sosp" />
                    <Label htmlFor="preg-sosp" className="font-normal cursor-pointer">Sospecha</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="surgical_history" className="text-teal-700 font-medium">Antecedentes quirúrgicos</Label>
                <NoPresentaToggle label="antecedentes quirúrgicos" field="surgical_history" value={patientData.surgical_history} onChange={handlePatientChange} disabled={editingSection !== 'health'} />
              </div>
              <Textarea
                id="surgical_history"
                value={patientData.surgical_history || ''}
                onChange={(e) => handlePatientChange('surgical_history', e.target.value)}
                placeholder="Ej: Apendicectomía 2019, Extracción de terceros molares..."
                rows={2}
                className={cn("resize-none", (patientData.surgical_history || '').trim().toLowerCase() === 'no presenta antecedentes quirúrgicos' && "bg-emerald-50/50 text-emerald-700 border-emerald-200")}
                readOnly={(patientData.surgical_history || '').trim().toLowerCase() === 'no presenta antecedentes quirúrgicos' || editingSection !== 'health'}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="clinical_alerts" className="text-red-600 font-semibold flex items-center gap-2">
                  Alertas Clínicas
                  {(patientData.clinical_alerts || '').trim() && (patientData.clinical_alerts || '').trim().toLowerCase() !== 'no presenta alertas clínicas' && (
                    <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]" variant="outline">Activa</Badge>
                  )}
                </Label>
                <NoPresentaToggle label="alertas clínicas" field="clinical_alerts" value={patientData.clinical_alerts} onChange={handlePatientChange} disabled={editingSection !== 'health'} />
              </div>
              <Textarea
                id="clinical_alerts"
                value={patientData.clinical_alerts || ''}
                onChange={(e) => handlePatientChange('clinical_alerts', e.target.value)}
                placeholder="Ej: Alérgica a penicilina, Riesgo de endocarditis, Anticoagulada..."
                rows={2}
                className={cn(
                  "resize-none",
                  (patientData.clinical_alerts || '').trim().toLowerCase() === 'no presenta alertas clínicas'
                    ? "bg-emerald-50/50 text-emerald-700 border-emerald-200"
                    : (patientData.clinical_alerts || '').trim() && "border-red-300 bg-red-50/50"
                )}
                readOnly={(patientData.clinical_alerts || '').trim().toLowerCase() === 'no presenta alertas clínicas' || editingSection !== 'health'}
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Section 3: Diagnósticos (includes auto-generated odontogram summary) */}
        <DiagnosisSection
          patientId={patient?.id}
          patientDiagnoses={patientDiagnoses}
          filteredCodes={filteredCodes}
          selectedSystem={selectedSystem}
          setSelectedSystem={setSelectedSystem}
          diagnosisSearch={diagnosisSearch}
          setDiagnosisSearch={setDiagnosisSearch}
          showDiagnosisList={showDiagnosisList}
          setShowDiagnosisList={setShowDiagnosisList}
          loadingDiagnoses={loadingDiagnoses}
          addingDiagnosis={addingDiagnosis}
          handleAddDiagnosis={handleAddDiagnosis}
          handleRemoveDiagnosis={handleRemoveDiagnosis}
          handleSetPrimary={handleSetPrimary}
          diagnosis={patientData.diagnosis}
          onDiagnosisChange={(val) => handlePatientChange('diagnosis', val)}
        />

        {/* Section 4: Evaluaciones */}
        <CollapsibleSection
          number="5"
          title="Evaluaciones"
          editable
          editing={editingSection === 'evaluations'}
          onEdit={() => setEditingSection('evaluations')}
          onSave={handleSaveSection}
          onCancel={() => setEditingSection(null)}
          saving={saving}
        >
          <div className="space-y-5">
            <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
              <Label className="mb-2 block text-teal-700 font-medium">Plantilla de Evaluación:</Label>
              <div className="flex gap-2">
                <Select
                  value={patientData.evaluation_template}
                  onValueChange={(val) => handlePatientChange('evaluation_template', val)}
                >
                  <SelectTrigger className="bg-white h-10 flex-1">
                    <SelectValue placeholder="Seleccione una plantilla..." />
                  </SelectTrigger>
                  <SelectContent>
                    {evaluationTemplates.length > 0 ? (
                      evaluationTemplates.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                          {getExistingReport(t.id) && ' ✓'}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No hay plantillas disponibles</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {patientData.evaluation_template && patientData.evaluation_template !== 'none' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenTemplate(patientData.evaluation_template)}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    {getExistingReport(patientData.evaluation_template) ? 'Ver/Editar' : 'Completar'}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="other_info" className="text-teal-700 font-medium">Otra información relevante</Label>
              <Textarea
                id="other_info"
                value={patientData.other_info}
                onChange={(e) => handlePatientChange('other_info', e.target.value)}
                placeholder="Información adicional..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        </CollapsibleSection>

      </div>

      {/* Section 3: Odontograma — outside form to prevent button conflicts */}
      <CollapsibleSection number="3" title="Odontograma">
        <Tabs defaultValue="diagnostico" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="diagnostico" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Diagnóstico Inicial
            </TabsTrigger>
            <TabsTrigger value="tratamiento" className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Tratamiento
            </TabsTrigger>
          </TabsList>
          <TabsContent value="diagnostico">
            <p className="text-xs text-gray-500 mb-3">
              Registra el estado inicial de la dentadura del paciente al momento del diagnóstico.
            </p>
            <Odontogram patientId={patient?.id} odontogramType="diagnostico" />
          </TabsContent>
          <TabsContent value="tratamiento">
            <p className="text-xs text-gray-500 mb-3">
              Registra los avances del tratamiento. Actualiza las superficies a medida que se realizan procedimientos.
            </p>
            <Odontogram patientId={patient?.id} odontogramType="tratamiento" />
          </TabsContent>
        </Tabs>
      </CollapsibleSection>

      {/* Template Form Modal */}
      {selectedTemplate && (
        <TemplateFormModal
          isOpen={isFormModalOpen}
          onClose={() => setFormModalOpen(false)}
          template={selectedTemplate.template}
          patient={{
            ...patient,
            full_name: profileData.full_name,
            birthdate: profileData.birthdate,
            rut: profileData.rut,
            phone: profileData.phone,
            email: profileData.email,
          }}
          therapistId={user?.id}
          existingReport={selectedTemplate.existingReport}
          onSaved={() => {
            loadExistingReports();
            setFormModalOpen(false);
            setSelectedTemplate(null);
          }}
        />
      )}
    </>
  );
};

export default PatientDataTab;
