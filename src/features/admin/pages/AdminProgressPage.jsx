import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ProgressReportPage from '@/features/progress/pages/ProgressReportPage';
import logger from '@/lib/utils/logger';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

const AdminProgressPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllReports();
  }, []);

  const loadAllReports = async () => {
    try {
      const { data, error } = await supabase
        .from('progress_reports')
        .select(`
          *,
          patient:profiles!patient_id(full_name, email),
          therapist:profiles!therapist_id(full_name)
        `)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      logger.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Gestión de Reportes de Progreso</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Todos los Reportes Generados ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Terapeuta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Compartido</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{format(new Date(report.generated_at), 'dd/MM/yyyy', { locale: es })}</TableCell>
                  <TableCell>{report.patient?.full_name}</TableCell>
                  <TableCell>{report.therapist?.full_name}</TableCell>
                  <TableCell className="capitalize">{report.report_type}</TableCell>
                  <TableCell>{report.shared_with_patient ? 'Sí' : 'No'}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Ver
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <ProgressReportPage 
                          report={report} 
                          patientName={report.patient?.full_name} 
                        />
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProgressPage;