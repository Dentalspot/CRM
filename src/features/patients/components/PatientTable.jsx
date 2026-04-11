
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, CalendarPlus, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

const PatientTable = ({
  patients,
  loading,
  error,
  pieMode = false,
  selectedForPie = [],
  onTogglePie,
  onBookAppointment,
}) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const navigate = useNavigate();

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(patients.map(p => p.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedRows([...selectedRows, id]);
    } else {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    }
  };

  const formatLastAppointment = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return '-';
    }
  };

  const calculateAge = (birthdate) => {
    if (!birthdate) return '-';
    try {
      const today = new Date();
      const birth = new Date(birthdate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age + ' años';
    } catch {
      return '-';
    }
  };

  const getStatusBadge = (status) => {
    const variantMap = {
      scheduled: 'default',
      completed: 'secondary',
      cancelled: 'destructive',
      'no-show': 'outline',
    };
    const labels = {
      scheduled: 'Agendada',
      completed: 'Completada',
      cancelled: 'Cancelada',
      'no-show': 'No asistió',
    };

    if (!status) return <Badge variant="outline" className="text-[10px]">Sin actividad</Badge>;

    return <Badge variant={variantMap[status] || 'outline'} className="text-[10px]">{labels[status] || status}</Badge>;
  };

  const handleViewFile = (patientId) => {
    navigate(`/dashboard/patients/${patientId}`);
  };

  if (loading) {
    return (
      <div className="rounded-md border p-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Cargando pacientes...</span>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }

  if (!patients || patients.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        <p className="font-semibold">No se encontraron pacientes</p>
        <p className="text-sm">Tus pacientes aparecerán aquí cuando tengas registros.</p>
      </div>
    );
  }

  // ============================================
  // MOBILE: Card layout
  // ============================================
  const MobileCards = () => (
    <div className="space-y-3 md:hidden">
      {patients.map((patient) => {
        const isSelected = pieMode
          ? selectedForPie.includes(patient.id)
          : selectedRows.includes(patient.id);

        return (
          <div
            key={patient.id}
            className={`rounded-xl border p-4 transition-colors shadow-sm ${isSelected ? 'bg-primary/5 border-primary/20' : 'bg-white hover:shadow-md'}`}
          >
            {/* Top row: avatar + name + actions */}
            <div className="flex items-center gap-3">
              {false && (
                <Checkbox
                  checked={selectedRows.includes(patient.id)}
                  onCheckedChange={(checked) => handleSelectRow(patient.id, checked)}
                />
              )}

              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={patient.avatar_url} />
                <AvatarFallback className="text-sm bg-pink-100 text-pink-700">{patient.full_name?.charAt(0)}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <button
                  onClick={() => handleViewFile(patient.id)}
                  className="font-semibold text-sm hover:underline text-left truncate block"
                >
                  {patient.full_name}
                </button>
                {patient.phone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3 shrink-0" />
                    {patient.phone}
                  </p>
                )}
              </div>

              <div className="flex gap-1 shrink-0">
                {onBookAppointment && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-pink-600 hover:bg-pink-50"
                    onClick={() => onBookAppointment(patient.id)}
                  >
                    <CalendarPlus className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-primary hover:bg-primary/10 text-xs"
                  onClick={() => handleViewFile(patient.id)}
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Ver
                </Button>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Edad</p>
                <p className="text-sm font-semibold">{calculateAge(patient.birthdate)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Última cita</p>
                <p className="text-sm font-semibold">{formatLastAppointment(patient.lastAppointmentDate)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
                <Badge variant="secondary" className="font-mono text-xs px-2">
                  {patient.appointmentCount || 0}
                </Badge>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ============================================
  // DESKTOP: Table layout
  // ============================================
  const DesktopTable = () => (
    <div className="hidden md:block rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              {pieMode ? (
                <Checkbox
                  checked={selectedForPie.length === patients.length && patients.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      patients.forEach(p => { if (!selectedForPie.includes(p.id)) onTogglePie(p.id); });
                    } else {
                      patients.forEach(p => { if (selectedForPie.includes(p.id)) onTogglePie(p.id); });
                    }
                  }}
                  className="border-indigo-400 data-[state=checked]:bg-indigo-600"
                />
              ) : (
                <Checkbox
                  checked={selectedRows.length === patients.length && patients.length > 0}
                  indeterminate={selectedRows.length > 0 && selectedRows.length < patients.length ? true : undefined}
                  onCheckedChange={handleSelectAll}
                />
              )}
            </TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead className="text-center">Edad</TableHead>
            <TableHead>Última Cita</TableHead>
            <TableHead className="text-center">Total Citas</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {patients.map((patient) => (
            <TableRow
              key={patient.id}
              className={pieMode && selectedForPie.includes(patient.id) ? 'bg-indigo-50' : ''}
            >
              <TableCell>
                {pieMode ? (
                  <Checkbox
                    checked={selectedForPie.includes(patient.id)}
                    onCheckedChange={() => onTogglePie(patient.id)}
                    className="border-indigo-400 data-[state=checked]:bg-indigo-600"
                  />
                ) : (
                  <Checkbox
                    checked={selectedRows.includes(patient.id)}
                    onCheckedChange={(checked) => handleSelectRow(patient.id, checked)}
                  />
                )}
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={patient.avatar_url} />
                    <AvatarFallback>{patient.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewFile(patient.id)}
                        className="font-medium hover:underline text-left"
                      >
                        {patient.full_name}
                      </button>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      RUT: {patient.rut || '-'}
                    </span>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <div className="flex flex-col text-sm">
                  <span>{patient.email}</span>
                  <span className="text-xs text-muted-foreground">{patient.phone}</span>
                </div>
              </TableCell>

              <TableCell className="text-center">
                {calculateAge(patient.birthdate)}
              </TableCell>

              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {formatLastAppointment(patient.lastAppointmentDate)}
                  </span>
                  <span className="mt-1">{getStatusBadge(patient.lastAppointmentStatus)}</span>
                </div>
              </TableCell>

              <TableCell className="text-center">
                <Badge variant="secondary" className="font-mono">
                  {patient.appointmentCount || 0}
                </Badge>
              </TableCell>

              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {onBookAppointment && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-teal-600 hover:bg-teal-50"
                      onClick={() => onBookAppointment(patient.id)}
                      title="Agendar cita"
                    >
                      <CalendarPlus className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="h-8 px-2 text-primary hover:bg-primary/10"
                    onClick={() => handleViewFile(patient.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver ficha
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>

      </Table>
    </div>
  );

  return (
    <>
      <MobileCards />
      <DesktopTable />
    </>
  );
};

export default PatientTable;
