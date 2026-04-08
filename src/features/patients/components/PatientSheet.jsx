import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  Mail,
  Phone,
  Edit2,
  FileText,
  User,
  Stethoscope,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PatientModal from './PatientModal';

import { calculateAge } from '@/lib/utils/calculations';
import { getInitials } from '@/lib/utils/strings';

const PatientSheet = ({
  isOpen,
  onOpenChange,
  patient,
  onUpdate,
  onEdit // Added prop to handle edit click from parent if needed, though local state is used
}) => {
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!patient) return null;

  const age = calculateAge(patient.birthdate);

  const handleViewFile = () => {
    navigate(`/dashboard/patients/${patient.id}`);
    onOpenChange(false);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    if (onUpdate) onUpdate();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Activo', className: 'bg-green-100 text-green-700' },
      inactive: { label: 'Inactivo', className: 'bg-gray-100 text-gray-700' },
      archived: { label: 'Archivado', className: 'bg-red-100 text-red-700' },
    };
    const config = statusConfig[status] || statusConfig.active;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPatientTypeBadge = (type) => {
    const typeConfig = {
      privado: { label: 'Privado', className: 'bg-blue-100 text-blue-700' },
      aseguradora: { label: 'Aseguradora', className: 'bg-purple-100 text-purple-700' },
      isapre: { label: 'Isapre', className: 'bg-purple-100 text-purple-700' },
      fonasa: { label: 'Fonasa', className: 'bg-teal-100 text-teal-700' },
    };
    const config = typeConfig[type] || typeConfig.privado;
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
          {/* Header */}
          <SheetHeader className="p-6 pb-4 border-b bg-gradient-to-r from-teal-50 to-white">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                <AvatarImage src={patient.avatar_url} alt={patient.full_name} />
                <AvatarFallback className="bg-teal-500 text-white text-lg font-semibold">
                  {getInitials(patient.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-xl font-bold text-gray-900 truncate">
                  {patient.full_name}
                </SheetTitle>
                <SheetDescription className="mt-1 flex flex-wrap items-center gap-2">
                  {getStatusBadge(patient.status)}
                  {getPatientTypeBadge(patient.patient_type)}
                  {age && (
                    <span className="text-sm text-gray-500">{age} años</span>
                  )}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Quick Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Información de Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {patient.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a
                        href={`mailto:${patient.email}`}
                        className="text-teal-600 hover:underline truncate"
                      >
                        {patient.email}
                      </a>
                    </div>
                  )}
                  {patient.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a
                        href={`tel:${patient.phone}`}
                        className="text-teal-600 hover:underline"
                      >
                        {patient.phone}
                      </a>
                    </div>
                  )}
                  {patient.birthdate && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">
                        {format(new Date(patient.birthdate), "d 'de' MMMM, yyyy", { locale: es })}
                      </span>
                    </div>
                  )}
                  {patient.rut && (
                    <div className="flex items-center gap-3 text-sm">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700 font-mono">{patient.rut}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Clinical Info */}
              {(patient.diagnosis || patient.medical_history) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Información Clínica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {patient.diagnosis && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Diagnóstico</p>
                        <p className="text-sm text-gray-800">{patient.diagnosis}</p>
                      </div>
                    )}
                    {patient.medical_history && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Antecedentes</p>
                        <p className="text-sm text-gray-800 line-clamp-3">{patient.medical_history}</p>
                      </div>
                    )}
                    {patient.allergies && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Alergias</p>
                        <p className="text-sm text-red-600">{patient.allergies}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Responsible Info */}
              {patient.responsible_name && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Responsable
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm font-medium text-gray-800">{patient.responsible_name}</p>
                    {patient.responsible_rut && (
                      <p className="text-xs text-gray-500 font-mono">{patient.responsible_rut}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {patient.notes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{patient.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Timestamps */}
              <div className="text-xs text-gray-400 space-y-1">
                {patient.created_at && (
                  <p>Registrado: {format(new Date(patient.created_at), "d MMM yyyy", { locale: es })}</p>
                )}
                {patient.updated_at && (
                  <p>Actualizado: {format(new Date(patient.updated_at), "d MMM yyyy, HH:mm", { locale: es })}</p>
                )}
              </div>
            </div>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="p-4 border-t bg-gray-50 flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              className="flex-1 bg-teal-600 hover:bg-teal-700"
              onClick={handleViewFile}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Ficha Completa
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Modal */}
      <PatientModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        patient={patient}
        onSave={handleEditSuccess}
      />
    </>
  );
};

export default PatientSheet;