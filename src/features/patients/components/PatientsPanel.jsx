import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Search, Users, ChevronLeft, ChevronRight, X, Merge, Upload,
  AlertTriangle, Loader2, Check, ArrowRight, GraduationCap
} from 'lucide-react';

import PatientTable from './PatientTable';
import PatientModal from './PatientModal';
import PatientSheet from './PatientSheet';
import AppointmentModal from '@/components/calendar/AppointmentModal';
import MergeablePatientTable from './MergeablePatientTable';
import usePatientsPanel from '../hooks/usePatientsPanel';

const PatientsPanel = () => {
  const {
    loading, error, kpiData,
    paginatedPatients, totalCount, totalPages,
    page, setPage, pageSize,
    searchTerm, setSearchTerm,
    sortBy, setSortBy,
    isModalOpen, setModalOpen,
    isSheetOpen, setSheetOpen,
    selectedPatient, setSelectedPatient,
    mergeMode, selectedForMerge,
    mergeModalOpen, setMergeModalOpen,
    primaryPatientId, setPrimaryPatientId,
    merging,
    selectedPatientsData, primaryPatient, secondaryPatient,
    pieMode, selectedForPie, addingToPie,
    handleEdit, handleViewDetails, handleSave, handleClearFilters,
    toggleMergeMode, handleSelectForMerge, openMergeModal, handleMergePatients,
    togglePieMode, handleTogglePie, handleAddToPie,
  } = usePatientsPanel();

  const [bookingPatientId, setBookingPatientId] = useState(null);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpiData.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerta modo fusionar */}
      {mergeMode && (
        <Alert className="bg-amber-50 border-amber-200">
          <Merge className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-amber-800">
              <strong>Modo Fusionar:</strong> Selecciona 2 pacientes para combinarlos.
              {selectedForMerge.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedForMerge.length}/2 seleccionados
                </Badge>
              )}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={toggleMergeMode}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={openMergeModal}
                disabled={selectedForMerge.length !== 2}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Merge className="h-4 w-4 mr-1" />
                Fusionar ({selectedForMerge.length}/2)
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta modo PIE */}
      {pieMode && (
        <Alert className="bg-indigo-50 border-indigo-200">
          <GraduationCap className="h-4 w-4 text-indigo-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-indigo-800">
              <strong>Modo PIE:</strong> Selecciona los pacientes a agregar al módulo PIE.
              {selectedForPie.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedForPie.length} seleccionado(s)
                </Badge>
              )}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={togglePieMode} disabled={addingToPie}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleAddToPie}
                disabled={selectedForPie.length === 0 || addingToPie}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {addingToPie ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <GraduationCap className="h-4 w-4 mr-1" />
                )}
                Agregar a PIE ({selectedForPie.length})
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              <CardTitle>Listado de Pacientes</CardTitle>
              {totalCount > 0 && <Badge variant="secondary" className="ml-2">{totalCount}</Badge>}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={mergeMode ? "secondary" : "outline"}
                onClick={toggleMergeMode}
                size="sm"
                className={mergeMode ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : ""}
              >
                <Merge className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{mergeMode ? "Cancelar Fusión" : "Fusionar Pacientes"}</span>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="import">
                  <Upload className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Importar</span>
                </Link>
              </Button>
              <Button size="sm" onClick={() => { setSelectedPatient(null); setModalOpen(true); }}>
                + Nuevo Paciente
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filtros */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastAppointmentDate">Última Visita</SelectItem>
                  <SelectItem value="full_name">Nombre</SelectItem>
                  <SelectItem value="appointmentCount">Total Citas</SelectItem>
                </SelectContent>
              </Select>

              {(searchTerm || sortBy !== 'lastAppointmentDate') && (
                <Button variant="ghost" onClick={handleClearFilters} size="icon">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Tabla */}
          {mergeMode ? (
            <MergeablePatientTable
              patients={paginatedPatients}
              loading={loading}
              error={error}
              selectedIds={selectedForMerge}
              onSelect={handleSelectForMerge}
              onViewDetails={handleViewDetails}
            />
          ) : (
            <PatientTable
              patients={paginatedPatients}
              loading={loading}
              error={error}
              onEdit={handleEdit}
              onViewDetails={handleViewDetails}
              pieMode={pieMode}
              selectedForPie={selectedForPie}
              onTogglePie={handleTogglePie}
              onBookAppointment={(patientId) => setBookingPatientId(patientId)}
            />
          )}

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <div className="text-sm text-muted-foreground">
                {Math.min((page - 1) * pageSize + 1, totalCount)} - {Math.min(page * pageSize, totalCount)} de {totalCount}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <PatientModal
        patient={selectedPatient}
        isOpen={isModalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSave}
      />

      <PatientSheet
        patient={selectedPatient}
        isOpen={isSheetOpen}
        onOpenChange={setSheetOpen}
        onUpdate={handleSave}
        onEdit={(p) => { setSelectedPatient(p); setSheetOpen(false); setModalOpen(true); }}
      />

      {/* Modal de confirmación de fusión */}
      <Dialog open={mergeModalOpen} onOpenChange={setMergeModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Merge className="h-5 w-5 text-amber-600" />
              Confirmar Fusión de Pacientes
            </DialogTitle>
            <DialogDescription>
              Los datos del paciente secundario serán transferidos al principal.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Alert className="mb-4 bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm">
                Esta acción no se puede deshacer fácilmente. El paciente secundario será archivado.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Label className="text-sm font-medium">¿Cuál perfil deseas mantener como principal?</Label>

              <RadioGroup value={primaryPatientId} onValueChange={setPrimaryPatientId}>
                {selectedPatientsData.map((patient) => (
                  <div
                    key={patient.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${primaryPatientId === patient.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                    onClick={() => setPrimaryPatientId(patient.id)}
                  >
                    <RadioGroupItem value={patient.id} id={`patient-${patient.id}`} />
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={`${primaryPatientId === patient.id ? 'bg-primary text-white' : 'bg-pink-500 text-white'}`}>
                        {patient.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Label htmlFor={`patient-${patient.id}`} className="font-medium cursor-pointer">
                        {patient.full_name}
                      </Label>
                      <p className="text-xs text-muted-foreground">{patient.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {patient.appointmentCount || 0} citas • Tel: {patient.phone || '-'}
                      </p>
                    </div>
                    {primaryPatientId === patient.id && (
                      <Badge className="bg-primary">Principal</Badge>
                    )}
                  </div>
                ))}
              </RadioGroup>
            </div>

            {primaryPatient && secondaryPatient && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-center">
                  <span className="text-muted-foreground line-through">{secondaryPatient.full_name}</span>
                  <ArrowRight className="inline h-4 w-4 mx-2 text-amber-600" />
                  <strong className="text-primary">{primaryPatient.full_name}</strong>
                </p>
                <p className="text-xs text-center text-muted-foreground mt-1">
                  Se transferirán {secondaryPatient.appointmentCount || 0} citas y todos los documentos
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeModalOpen(false)} disabled={merging}>
              Cancelar
            </Button>
            <Button
              onClick={handleMergePatients}
              disabled={!primaryPatientId || merging}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {merging ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Fusionando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirmar Fusión
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Modal from patient table */}
      <AppointmentModal
        isOpen={!!bookingPatientId}
        onOpenChange={(open) => { if (!open) setBookingPatientId(null); }}
        slotInfo={{ patientId: bookingPatientId }}
        onAppointmentCreated={() => setBookingPatientId(null)}
        onAppointmentUpdated={() => setBookingPatientId(null)}
      />
    </div>
  );
};

export default PatientsPanel;
