import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, AlertTriangle, Loader2 } from 'lucide-react';

const calculateAge = (birthdate) => {
  if (!birthdate) return null;
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const MergeablePatientTable = ({ patients, loading, error, selectedIds, onSelect, onViewDetails }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p>No se encontraron pacientes</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 w-12">
              <span className="sr-only">Seleccionar</span>
            </th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nombre</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Contacto</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Edad</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Última Cita</th>
            <th className="text-center py-3 px-4 font-medium text-muted-foreground">Total Citas</th>
            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => {
            const isSelected = selectedIds.includes(patient.id);
            const isDisabled = selectedIds.length >= 2 && !isSelected;

            return (
              <tr
                key={patient.id}
                className={`border-b transition-colors cursor-pointer ${isSelected
                    ? 'bg-amber-50'
                    : isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-muted/50'
                  }`}
                onClick={() => !isDisabled && onSelect(patient.id)}
              >
                <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelect(patient.id)}
                    disabled={isDisabled}
                    className={isSelected ? 'border-amber-600 data-[state=checked]:bg-amber-600' : ''}
                  />
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={`${isSelected ? 'bg-amber-500' : 'bg-gradient-to-br from-primary to-primary'} text-white`}>
                        {patient.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{patient.full_name}</p>
                      <p className="text-xs text-muted-foreground">RUT: {patient.rut || '-'}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 hidden md:table-cell">
                  <p className="text-sm">{patient.email}</p>
                  <p className="text-xs text-muted-foreground">{patient.phone}</p>
                </td>
                <td className="py-3 px-4 hidden lg:table-cell text-sm">
                  {patient.birthdate ? `${calculateAge(patient.birthdate)} años` : '-'}
                </td>
                <td className="py-3 px-4 hidden lg:table-cell">
                  {patient.lastAppointmentDate ? (
                    <div>
                      <p className="text-sm">{new Date(patient.lastAppointmentDate).toLocaleDateString()}</p>
                      <Badge variant={patient.lastAppointmentStatus === 'scheduled' ? 'default' : 'secondary'} className="text-xs">
                        {patient.lastAppointmentStatus === 'scheduled' ? 'Agendada' : patient.lastAppointmentStatus || 'Sin actividad'}
                      </Badge>
                    </div>
                  ) : (
                    <Badge variant="outline">Sin actividad</Badge>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <Badge variant="secondary" className="bg-primary text-primary">
                    {patient.appointmentCount || 0}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(patient)}
                  >
                    Ver ficha
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MergeablePatientTable;
