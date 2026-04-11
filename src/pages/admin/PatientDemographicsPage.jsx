import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePatientAdmin } from '@/hooks/usePatientAdmin';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

const PatientDemographicsPage = () => {
  const { id } = useParams();
  const { fetchAllPatients, updateConsent } = usePatientAdmin();
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    fetchAllPatients({ searchTerm: id }).then(res => {
      if (res.data && res.data.length > 0) {
        setPatient(res.data.find(p => p.id === id) || res.data[0]);
      }
    });
  }, [id, fetchAllPatients]);

  if (!patient) return <div className="p-10 text-center">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Datos Demográficos y Consentimiento</h1>
        <p className="text-muted-foreground">Gestión de datos personales y legales del paciente.</p>
      </div>

      <div className="max-w-4xl space-y-6">
        <Card>
          <CardHeader><CardTitle>Información Personal</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nombre Completo</Label>
              <Input defaultValue={patient.profile?.full_name || patient.full_name} disabled />
            </div>
            <div className="space-y-2">
              <Label>RUT / ID Nacional</Label>
              <Input defaultValue={patient.profile?.rut || patient.rut} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email de Contacto</Label>
              <Input defaultValue={patient.profile?.email || patient.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input defaultValue={patient.profile?.phone || patient.phone} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Consentimiento y Privacidad (Ley de Datos)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 p-4 border rounded bg-slate-50">
              <Checkbox id="consent" checked={true} disabled />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="consent" className="font-semibold">Consentimiento Informado Firmado</Label>
                <p className="text-sm text-muted-foreground">El paciente ha firmado digitalmente el consentimiento para tratamiento odontológico.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-4 border rounded bg-slate-50">
              <Checkbox id="privacy" checked={true} disabled />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="privacy" className="font-semibold">Política de Privacidad Aceptada</Label>
                <p className="text-sm text-muted-foreground">Aceptación de términos de uso y política de privacidad de datos (Ley 19.628).</p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Gestión de Datos (Derechos ARCO)</h4>
              <div className="flex gap-4">
                <Button variant="outline" size="sm">Exportar Todos los Datos</Button>
                <Button variant="destructive" size="sm">Solicitar Eliminación (Derecho al Olvido)</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button><Save className="mr-2 h-4 w-4" /> Guardar Cambios Administrativos</Button>
        </div>
      </div>
    </div>
  );
};

export default PatientDemographicsPage;
