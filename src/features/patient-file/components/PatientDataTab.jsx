import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, FileText, Pencil, X, ClipboardList, Stethoscope } from 'lucide-react';
import TemplateFormModal from '@/components/patient/TemplateFormModal';
import DiagnosisSection from './patient-data/DiagnosisSection';
import Odontogram from '@/features/odontogram/components/Odontogram';
import usePatientData from '../hooks/usePatientData';

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

  const [isEditingGeneral, setIsEditingGeneral] = useState(false);

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    await handleSubmit(e);
    setIsEditingGeneral(false);
  };

  return (
    <>
      <form onSubmit={handleSaveGeneral} className="space-y-6">
        {/* Section 1: Datos Generales */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-teal-600 font-bold flex items-center gap-2">
                <span className="bg-pink-500 text-white text-sm px-2 py-0.5 rounded">1</span>
                Datos Generales del Paciente
              </CardTitle>
              {!isEditingGeneral ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setIsEditingGeneral(true)}
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-gray-500"
                    onClick={() => setIsEditingGeneral(false)}
                  >
                    <X className="h-3.5 w-3.5" /> Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Guardar
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-teal-700 font-medium">Nombre completo</Label>
                <Input
                  id="full_name"
                  value={profileData.full_name}
                  onChange={(e) => handleProfileChange('full_name', e.target.value)}
                  placeholder="Nombre del paciente"
                  className="h-10"
                  readOnly={!isEditingGeneral}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthdate" className="text-teal-700 font-medium">
                  Fecha de Nacimiento
                  {age !== null && (
                    <Badge variant="secondary" className="ml-2 text-xs">{age} años</Badge>
                  )}
                </Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={profileData.birthdate}
                  onChange={(e) => handleProfileChange('birthdate', e.target.value)}
                  className="h-10"
                  readOnly={!isEditingGeneral}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-teal-700 font-medium">Género</Label>
                <Select value={profileData.gender} onValueChange={(val) => handleProfileChange('gender', val)} disabled={!isEditingGeneral}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-teal-700 font-medium">Tipo de Paciente</Label>
                <RadioGroup
                  value={patientData.patient_type}
                  onValueChange={(val) => handlePatientChange('patient_type', val)}
                  className="flex gap-6 h-10 items-center"
                  disabled={!isEditingGeneral}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="privado" id="privado" disabled={!isEditingGeneral} />
                    <Label htmlFor="privado" className="font-normal cursor-pointer">Privado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fonasa" id="fonasa" disabled={!isEditingGeneral} />
                    <Label htmlFor="fonasa" className="font-normal cursor-pointer">Fonasa</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="convenio" id="convenio" disabled={!isEditingGeneral} />
                    <Label htmlFor="convenio" className="font-normal cursor-pointer">Convenio</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-teal-700 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={profileData.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  className="h-10"
                  readOnly={!isEditingGeneral}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-teal-700 font-medium">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+56 9 1234 5678"
                  value={displayPhone}
                  onChange={handlePhoneChange}
                  className="h-10"
                  readOnly={!isEditingGeneral}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rut" className="text-teal-700 font-medium">RUT Paciente</Label>
                <Input
                  id="rut"
                  value={displayRut}
                  onChange={handleRutChange}
                  placeholder="12.345.678-9"
                  className="h-10"
                  readOnly={!isEditingGeneral}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsible_name" className="text-teal-700 font-medium">Responsable del tratamiento</Label>
                <Input
                  id="responsible_name"
                  placeholder="Nombre del responsable (si aplica)"
                  value={patientData.responsible_name}
                  onChange={(e) => handlePatientChange('responsible_name', e.target.value)}
                  className="h-10"
                  readOnly={!isEditingGeneral}
                />
              </div>

              <div className="space-y-2 md:col-span-2 md:w-1/2">
                <Label htmlFor="responsible_rut" className="text-teal-700 font-medium">RUT del responsable</Label>
                <Input
                  id="responsible_rut"
                  placeholder="12.345.678-9"
                  value={displayResponsibleRut}
                  onChange={handleResponsibleRutChange}
                  className="h-10"
                  readOnly={!isEditingGeneral}
                />
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Section 3: Anamnesis */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-lg text-teal-600 font-bold flex items-center gap-2">
              <span className="bg-pink-500 text-white text-sm px-2 py-0.5 rounded">4</span>
              Anamnesis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
              <Label className="mb-2 block text-teal-700 font-medium">Plantilla de Anamnesis:</Label>
              <div className="flex gap-2">
                <Select
                  value={patientData.anamnesis_template}
                  onValueChange={(val) => handlePatientChange('anamnesis_template', val)}
                >
                  <SelectTrigger className="bg-white h-10 flex-1">
                    <SelectValue placeholder="Seleccione una plantilla..." />
                  </SelectTrigger>
                  <SelectContent>
                    {anamnesisTemplates.length > 0 ? (
                      anamnesisTemplates.map(t => (
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
                {patientData.anamnesis_template && patientData.anamnesis_template !== 'none' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenTemplate(patientData.anamnesis_template)}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    {getExistingReport(patientData.anamnesis_template) ? 'Ver/Editar' : 'Completar'}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medical_history" className="text-teal-700 font-medium">Antecedentes Médicos</Label>
              <Textarea
                id="medical_history"
                value={patientData.medical_history}
                onChange={(e) => handlePatientChange('medical_history', e.target.value)}
                placeholder="Historial médico relevante..."
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies" className="text-teal-700 font-medium">Alergias</Label>
              <Input
                id="allergies"
                value={patientData.allergies}
                onChange={(e) => handlePatientChange('allergies', e.target.value)}
                placeholder="Alergias conocidas..."
                className="h-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Evaluaciones */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-lg text-teal-600 font-bold flex items-center gap-2">
              <span className="bg-pink-500 text-white text-sm px-2 py-0.5 rounded">5</span>
              Evaluaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
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
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 pb-4 sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-pink-500 hover:bg-pink-600 text-white min-w-[160px]"
            disabled={saving}
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Guardando...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" />Guardar cambios</>
            )}
          </Button>
        </div>
      </form>

      {/* Section 2: Odontograma — outside form to prevent button conflicts */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-lg text-teal-600 font-bold flex items-center gap-2">
            <span className="bg-pink-500 text-white text-sm px-2 py-0.5 rounded">2</span>
            Odontograma
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
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
        </CardContent>
      </Card>

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
