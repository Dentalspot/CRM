import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatRut, calculateAge, getComplianceColor, checkComplianceStatus } from '@/lib/patientUtils';
import { FileText, User, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

const PatientCard = ({ patient }) => {
  const compliance = checkComplianceStatus(patient);
  const fullName = patient.profile?.full_name || patient.full_name || 'Paciente';
  const email = patient.profile?.email || patient.email || 'Sin email';
  const age = calculateAge(patient.profile?.birthdate || patient.birthdate);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar className="h-12 w-12">
          <AvatarImage src={patient.profile?.avatar_url || patient.avatar_url} />
          <AvatarFallback>{fullName.substring(0,2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 overflow-hidden">
          <CardTitle className="text-lg truncate" title={fullName}>{fullName}</CardTitle>
          <p className="text-sm text-muted-foreground truncate">{email}</p>
        </div>
        <Badge variant="outline" className={getComplianceColor(compliance.status)}>
          {compliance.status === 'compliant' ? 'OK' : 'Revisar'}
        </Badge>
      </CardHeader>
      <CardContent className="py-2 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Edad:</span>
          <span>{age} años</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">RUT:</span>
          <span>{formatRut(patient.profile?.rut || patient.rut)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Estado:</span>
          <span className="capitalize">{patient.status || 'Activo'}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex gap-2">
        <Button variant="ghost" size="sm" className="flex-1" asChild>
          <Link to={`/admin/patients/${patient.id}/clinical-file`}>
            <FileText className="w-4 h-4 mr-2" /> Ficha
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="flex-1" asChild>
          <Link to={`/admin/patients/${patient.id}/demographics`}>
            <User className="w-4 h-4 mr-2" /> Perfil
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PatientCard;