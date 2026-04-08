import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { usePatientAdmin } from '@/hooks/usePatientAdmin';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, Filter, Download } from 'lucide-react';
import { formatRut } from '@/lib/patientUtils';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const PatientsManagementPage = () => {
  const { fetchAllPatients, loading } = usePatientAdmin();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const { data } = await fetchAllPatients({ searchTerm });
      if (data) setPatients(data);
    };
    loadData();
  }, [fetchAllPatients, searchTerm]);

  return (
    <div className="space-y-6">
      <Helmet><title>Gestión de Pacientes | Admin</title></Helmet>

      <div>
        <h1 className="text-2xl font-bold">Gestión de Pacientes</h1>
        <p className="text-muted-foreground">Listado maestro de todos los pacientes en la plataforma.</p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Buscar por nombre, RUT o email..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Filter className="h-4 w-4" /> Filtros</Button>
          <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Exportar</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre Paciente</TableHead>
              <TableHead>RUT</TableHead>
              <TableHead>Terapeuta Asignado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Ingreso</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center h-24">Cargando...</TableCell></TableRow>
            ) : patients.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center h-24">No se encontraron pacientes.</TableCell></TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell>
                    <div className="font-medium">{patient.profile?.full_name || patient.full_name}</div>
                    <div className="text-xs text-muted-foreground">{patient.profile?.email || patient.email}</div>
                  </TableCell>
                  <TableCell>{formatRut(patient.profile?.rut || patient.rut)}</TableCell>
                  <TableCell>{patient.therapist?.full_name || 'Sin asignar'}</TableCell>
                  <TableCell><Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>{patient.status}</Badge></TableCell>
                  <TableCell>{new Date(patient.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem asChild><Link to={`/admin/patients/${patient.id}/clinical-file`}>Ver Ficha Clínica</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link to={`/admin/patients/${patient.id}/demographics`}>Ver Demografía</Link></DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Archivar Paciente</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PatientsManagementPage;
