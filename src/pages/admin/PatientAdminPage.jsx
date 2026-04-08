import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import PatientStats from '@/components/admin/PatientStats';
import ComplianceStatus from '@/components/admin/patients/ComplianceStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Download, Plus, FileSpreadsheet, AlertCircle, Activity } from 'lucide-react';
import { usePatientAdmin } from '@/hooks/usePatientAdmin';

const DEMO_AGE_DATA = [
  { name: '0-5', count: 40 }, { name: '6-12', count: 85 }, { name: '13-18', count: 60 },
  { name: '19-30', count: 30 }, { name: '31-60', count: 45 }, { name: '60+', count: 20 },
];
const DEMO_GENDER_DATA = [
  { name: 'Masculino', value: 120 }, { name: 'Femenino', value: 145 }, { name: 'Otro', value: 15 },
];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const PatientAdminPage = () => {
  const { fetchComplianceStats } = usePatientAdmin();
  const [stats, setStats] = useState({ total: 280, newThisMonth: 12, active: 240, inactive: 40 });
  const [complianceStats, setComplianceStats] = useState({});

  useEffect(() => {
    fetchComplianceStats().then(setComplianceStats);
  }, [fetchComplianceStats]);

  return (
    <div className="space-y-6">
      <Helmet><title>Administración de Pacientes | DentalSpot Admin</title></Helmet>

      <div>
        <h1 className="text-2xl font-bold">Panel de Pacientes</h1>
        <p className="text-muted-foreground">Gestión integral de pacientes, cumplimiento normativo y estadísticas demográficas.</p>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Exportar Data</Button>
        <Button variant="outline"><FileSpreadsheet className="mr-2 h-4 w-4" /> Reporte Auditoría</Button>
        <Button><Plus className="mr-2 h-4 w-4" /> Nuevo Paciente</Button>
      </div>

      <PatientStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Demografía de Pacientes</CardTitle></CardHeader>
            <CardContent>
              <Tabs defaultValue="age">
                <TabsList className="mb-4">
                  <TabsTrigger value="age">Por Edad</TabsTrigger>
                  <TabsTrigger value="gender">Por Género</TabsTrigger>
                  <TabsTrigger value="location">Por Ubicación</TabsTrigger>
                </TabsList>
                <TabsContent value="age" className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={DEMO_AGE_DATA}>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="gender" className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={DEMO_GENDER_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                        {DEMO_GENDER_DATA.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="location" className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Gráfico de ubicación (requiere integración de mapa)
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Actividad Reciente</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <div className="bg-blue-100 p-2 rounded-full"><Activity className="h-4 w-4 text-blue-600" /></div>
                    <div>
                      <p className="text-sm font-medium">Nuevo paciente registrado</p>
                      <p className="text-xs text-muted-foreground">Hace {i * 2} horas • Asignado a Dentista X</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <ComplianceStatus stats={complianceStats} />
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" /> Solicitudes Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm"><span>Exportación de datos</span><Badge variant="secondary">3</Badge></div>
              <div className="flex justify-between items-center text-sm"><span>Eliminación de cuenta</span><Badge variant="destructive">1</Badge></div>
              <div className="flex justify-between items-center text-sm"><span>Consentimientos vencidos</span><Badge variant="outline">12</Badge></div>
              <Button variant="outline" size="sm" className="w-full mt-2">Gestionar Solicitudes</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientAdminPage;
