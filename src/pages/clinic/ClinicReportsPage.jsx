import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/components/ui/use-toast';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  Loader2, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Filter
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import LiquidacionPanel from '@/features/clinic-dashboard/components/LiquidacionPanel';
import ClinicalQualityPanel from '@/features/clinic-dashboard/components/ClinicalQualityPanel';
import InvoicingPanel from '@/features/clinic-dashboard/components/InvoicingPanel';
import logger from '@/lib/utils/logger';

const ClinicReportsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [loading, setLoading] = useState(true);
  const [clinicInfo, setClinicInfo] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [therapists, setTherapists] = useState([]);
  
  // Filters
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [selectedTherapist, setSelectedTherapist] = useState('all');

  // Load Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!user) return;

        // 1. Get Clinic
        const { data: clinics, error: clinicError } = await supabase
          .from('clinics')
          .select('id, name')
          .eq('therapist_id', user.id) // Clinic owner
          .maybeSingle();

        if (clinicError) throw clinicError;
        if (!clinics) return;
        setClinicInfo(clinics);

        // 2. Get Clinic Therapists
        const { data: clinicTherapists, error: ctError } = await supabase
          .from('clinic_therapists')
          .select(`
            therapist_id,
            profiles:therapist_id (
              id,
              full_name,
              email
            )
          `)
          .eq('clinic_id', clinics.id)
          .eq('is_active', true);

        if (ctError) throw ctError;
        setTherapists(clinicTherapists.map(ct => ct.profiles) || []);

        // 3. Get Appointments (Filtered by Date Range)
        let query = supabase
          .from('appointments')
          .select(`
            id,
            date,
            status,
            therapist_id,
            patient_id,
            service_id,
            created_at,
            services:therapist_services!appointments_service_id_fkey ( price_clp, service_name ),
            therapist:profiles!appointments_therapist_id_fkey ( full_name )
          `)
          .eq('clinic_id', clinics.id)
          .gte('date', dateRange.start)
          .lte('date', dateRange.end);

        if (selectedTherapist !== 'all') {
          query = query.eq('therapist_id', selectedTherapist);
        }

        const { data: apps, error: appError } = await query;
        if (appError) throw appError;
        
        setAppointments(apps || []);

      } catch (error) {
        logger.error("Error fetching report data:", error);
        toast({
          variant: "destructive",
          title: "Error de carga",
          description: "No se pudieron cargar los datos de la clínica."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, dateRange, selectedTherapist, toast]);

  // Calculations & Memoized Data
  const metrics = useMemo(() => {
    const completedApps = appointments.filter(a => a.status === 'completed');
    const uniquePatients = new Set(appointments.map(a => a.patient_id)).size;
    
    const totalRevenue = completedApps.reduce((sum, a) => {
      // Handle array or single object response from join
      const price = Array.isArray(a.services) ? a.services[0]?.price_clp : a.services?.price_clp;
      return sum + (Number(price) || 0);
    }, 0);

    return {
      totalSessions: completedApps.length,
      totalAppointments: appointments.length,
      uniquePatients,
      totalRevenue,
      activeTherapists: therapists.length
    };
  }, [appointments, therapists]);

  const chartData = useMemo(() => {
    // Group by Date for Activity
    const activityMap = {};
    const revenueMap = {};

    appointments.forEach(app => {
      const dateKey = app.date; // YYYY-MM-DD
      if (!activityMap[dateKey]) activityMap[dateKey] = 0;
      activityMap[dateKey]++;

      if (app.status === 'completed') {
        const price = Array.isArray(app.services) ? app.services[0]?.price_clp : app.services?.price_clp;
        const val = Number(price) || 0;
        if (!revenueMap[dateKey]) revenueMap[dateKey] = 0;
        revenueMap[dateKey] += val;
      }
    });

    const data = Object.keys(activityMap).sort().map(date => ({
      date: format(parseISO(date), 'dd/MM', { locale: es }),
      fullDate: date,
      citas: activityMap[date],
      ingresos: revenueMap[date] || 0
    }));

    return data;
  }, [appointments]);

  const therapistPerformance = useMemo(() => {
    const stats = {};
    
    appointments.forEach(app => {
      const tid = app.therapist_id;
      const tName = app.therapist?.full_name || 'Desconocido';
      
      if (!stats[tid]) {
        stats[tid] = { 
          id: tid, 
          name: tName, 
          sessions: 0, 
          revenue: 0, 
          patients: new Set() 
        };
      }

      if (app.status === 'completed') {
        stats[tid].sessions++;
        const price = Array.isArray(app.services) ? app.services[0]?.price_clp : app.services?.price_clp;
        stats[tid].revenue += (Number(price) || 0);
      }
      stats[tid].patients.add(app.patient_id);
    });

    return Object.values(stats).map(s => ({
      ...s,
      patientsCount: s.patients.size
    })).sort((a, b) => b.revenue - a.revenue);
  }, [appointments]);

  // Export Functions
  const handleExportCSV = () => {
    try {
      const headers = ['Fecha', 'Terapeuta', 'Servicio', 'Estado', 'Monto', 'ID Paciente'];
      const rows = appointments.map(app => {
        const price = Array.isArray(app.services) ? app.services[0]?.price_clp : app.services?.price_clp;
        const serviceName = Array.isArray(app.services) ? app.services[0]?.name : app.services?.name;
        
        return [
          app.date,
          app.therapist?.full_name || 'N/A',
          serviceName || 'Consulta General',
          app.status,
          price || 0,
          app.patient_id
        ].join(',');
      });

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `reporte_clinica_${format(new Date(), 'yyyyMMdd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: "Exportación exitosa", description: "El archivo CSV se ha descargado." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error al exportar", description: err.message });
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text(`Reporte Clínica: ${clinicInfo?.name || 'General'}`, 14, 22);
      
      doc.setFontSize(11);
      doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);
      doc.text(`Rango: ${dateRange.start} al ${dateRange.end}`, 14, 36);

      // Metrics Summary
      doc.setFontSize(14);
      doc.text("Resumen General", 14, 50);
      
      doc.setFontSize(10);
      doc.text(`Total Ingresos: $${metrics.totalRevenue.toLocaleString('es-CL')}`, 14, 60);
      doc.text(`Sesiones Completadas: ${metrics.totalSessions}`, 14, 66);
      doc.text(`Total Citas Agendadas: ${metrics.totalAppointments}`, 14, 72);
      doc.text(`Pacientes Atendidos: ${metrics.uniquePatients}`, 14, 78);

      // Performance Table (Simplified for PDF text)
      doc.setFontSize(14);
      doc.text("Desempeño por Terapeuta", 14, 95);
      
      let yPos = 105;
      therapistPerformance.forEach((t, index) => {
        const text = `${index + 1}. ${t.name} - $${t.revenue.toLocaleString('es-CL')} - ${t.sessions} sesiones`;
        doc.setFontSize(10);
        doc.text(text, 14, yPos);
        yPos += 7;
      });

      doc.save(`reporte_clinica_${format(new Date(), 'yyyyMMdd')}.pdf`);
      toast({ title: "Exportación exitosa", description: "El reporte PDF se ha descargado." });
    } catch (err) {
      logger.error(err);
      toast({ variant: "destructive", title: "Error al exportar", description: "No se pudo generar el PDF." });
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!clinicInfo) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">No se encontró información de la clínica</h2>
        <p className="text-gray-500">Asegúrate de haber creado tu clínica en el panel principal.</p>
        <Button onClick={() => window.location.href = '/dashboard/clinic'}>Volver al Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Reportes y Estadísticas</h1>
          <p className="text-muted-foreground mt-1">
            Análisis detallado del desempeño de <strong>{clinicInfo.name}</strong>.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF} className="gap-2">
            <FileText className="h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Excel / CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase text-slate-500 flex items-center gap-2">
                <Calendar className="h-3 w-3" /> Rango de Fechas
              </Label>
              <div className="flex gap-2 items-center">
                <Input 
                  type="date" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  className="bg-white"
                />
                <span className="text-slate-400">-</span>
                <Input 
                  type="date" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  className="bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase text-slate-500 flex items-center gap-2">
                <Users className="h-3 w-3" /> Filtrar por Terapeuta
              </Label>
              <Select value={selectedTherapist} onValueChange={setSelectedTherapist}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Todos los terapeutas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los terapeutas</SelectItem>
                  {therapists.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="secondary" 
                className="w-full bg-white border shadow-sm text-slate-700 hover:bg-slate-100"
                onClick={() => {
                  setDateRange({
                    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
                    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
                  });
                  setSelectedTherapist('all');
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString('es-CL')}</div>
            <p className="text-xs text-muted-foreground mt-1">En el periodo seleccionado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Sesiones Realizadas</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">Citas completadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pacientes Atendidos</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.uniquePatients}</div>
            <p className="text-xs text-muted-foreground mt-1">Pacientes únicos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Equipo Activo</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeTherapists}</div>
            <p className="text-xs text-muted-foreground mt-1">Terapeutas en la clínica</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Actividad Semanal</TabsTrigger>
          <TabsTrigger value="revenue">Tendencia de Ingresos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Citas y Sesiones</CardTitle>
              <CardDescription>Volumen de actividad diario en el rango seleccionado</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="citas" name="Citas" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  Sin datos para mostrar en este rango
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos Financieros</CardTitle>
              <CardDescription>Recaudación diaria en el rango seleccionado</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                      tickMargin={10}
                    />
                    <Tooltip 
                      formatter={(value) => `$${value.toLocaleString('es-CL')}`}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="ingresos" 
                      name="Ingresos ($)" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#10b981" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  Sin datos para mostrar en este rango
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Desempeño por Terapeuta</CardTitle>
          <CardDescription>Resumen de actividad individual en el periodo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Terapeuta</TableHead>
                <TableHead className="text-right">Pacientes Atendidos</TableHead>
                <TableHead className="text-right">Sesiones Completadas</TableHead>
                <TableHead className="text-right">Ingresos Generados</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {therapistPerformance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-slate-500">
                    No hay datos disponibles con los filtros actuales.
                  </TableCell>
                </TableRow>
              ) : (
                therapistPerformance.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-right">{t.patientsCount}</TableCell>
                    <TableCell className="text-right">{t.sessions}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      ${t.revenue.toLocaleString('es-CL')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
 {/* Facturación Electrónica */}
      <InvoicingPanel
        clinicInfo={clinicInfo}
        therapists={therapists}
        appointments={appointments}
      />

{/* Calidad Clínica por Terapeuta */}
      <ClinicalQualityPanel
        therapists={therapists}
        clinicId={clinicInfo?.id}
      />
      
      {/* Liquidación de Honorarios */}
      <LiquidacionPanel
        therapists={therapists}
        appointments={appointments}
        clinicInfo={clinicInfo}
      />
    </div>
  );
};

export default ClinicReportsPage;