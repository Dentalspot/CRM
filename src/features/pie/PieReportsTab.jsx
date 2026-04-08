
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileDown, FileText } from 'lucide-react';
import { format } from 'date-fns';
import logger from '@/lib/utils/logger';
import { jsPDF } from 'jspdf';

const PieReportsTab = ({ patientId, patientName }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const currentYear = new Date().getFullYear();
  const currentSemester = new Date().getMonth() < 6 ? '1' : '2';
  const defaultPeriod = `${currentYear}-${currentSemester}`;
  
  const [period, setPeriod] = useState(defaultPeriod);
  const [generating, setGenerating] = useState(false);

  const generatePeriods = () => {
    const periods = [];
    for (let y = currentYear - 1; y <= currentYear + 1; y++) {
      periods.push(`${y}-1`);
      periods.push(`${y}-2`);
    }
    return periods;
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    
    try {
      const { data: studentData } = await supabase
        .from('pie_student_data')
        .select('*')
        .eq('patient_id', patientId)
        .eq('therapist_id', user.id)
        .maybeSingle(); 

      const { data: paciData } = await supabase
        .from('pie_paci')
        .select('*')
        .eq('student_id', patientId)
        .eq('therapist_id', user.id)
        .eq('period', period)
        .maybeSingle();

      const { data: sessions } = await supabase
        .from('pie_sessions')
        .select('*')
        .eq('student_id', patientId)
        .eq('therapist_id', user.id)
        .gte('session_date', `${period.split('-')[0]}-${period.split('-')[1] === '1' ? '03-01' : '08-01'}`)
        .lte('session_date', `${period.split('-')[0]}-${period.split('-')[1] === '1' ? '07-31' : '12-31'}`)
        .order('session_date', { ascending: true });

      const totalSessions = sessions?.length || 0;
      const attendedSessions = sessions?.filter(s => s.attended).length || 0;
      const attendanceRate = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0;
      
      const objAchieved = paciData?.objectives?.filter(o => o.status === 'Logrado').length || 0;
      const objTotal = paciData?.objectives?.length || 0;
      const objRate = objTotal > 0 ? Math.round((objAchieved / objTotal) * 100) : 0;

      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('INFORME DE PROGRESO PIE', 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Fecha de emisión: ${format(new Date(), 'dd/MM/yyyy')}`, 105, 28, { align: 'center' });
      doc.text(`Período: Semestre ${period.split('-')[1]} - ${period.split('-')[0]}`, 105, 34, { align: 'center' });
      
      doc.setDrawColor(200);
      doc.line(20, 40, 190, 40);

      doc.setTextColor(0);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('1. Datos del Estudiante', 20, 50);
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Nombre: ${patientName || 'No registrado'}`, 25, 60);
      doc.text(`Curso: ${studentData?.course || 'No registrado'}`, 25, 68);
      doc.text(`Diagnóstico: ${studentData?.diagnosis || 'No registrado'}`, 25, 76);
      doc.text(`Profesor Jefe: ${studentData?.teacher_name || 'No registrado'}`, 25, 84);

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('2. Estado de Objetivos PACI', 20, 100);
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      let yPos = 110;
      
      if (paciData?.objectives && paciData.objectives.length > 0) {
        paciData.objectives.forEach((obj, idx) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`${idx + 1}. ${obj.text}`, 25, yPos);
          doc.text(`[${obj.status}]`, 160, yPos);
          yPos += 8;
        });
      } else {
        doc.text('No hay objetivos registrados para este período.', 25, yPos);
        yPos += 8;
      }

      yPos += 10;
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('3. Resumen de Intervención', 20, yPos);
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      yPos += 10;
      doc.text(`Total Sesiones Programadas: ${totalSessions}`, 25, yPos);
      yPos += 8;
      doc.text(`Sesiones Asistidas: ${attendedSessions} (${attendanceRate}%)`, 25, yPos);
      yPos += 8;
      doc.text(`Objetivos Logrados: ${objAchieved} de ${objTotal} (${objRate}%)`, 25, yPos);

      yPos += 40;
      if (yPos > 270) {
        doc.addPage();
        yPos = 40;
      }
      
      doc.setDrawColor(0);
      doc.line(50, yPos, 160, yPos);
      doc.text('Firma Profesional Especialista', 105, yPos + 6, { align: 'center' });

      const safeName = (patientName || 'Estudiante').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      doc.save(`Informe_PIE_${safeName}_${format(new Date(), 'yyyyMMdd')}.pdf`);
      
      toast({ title: "Éxito", description: "Informe generado y descargado." });

    } catch (error) {
      logger.error(error);
      toast({ variant: "destructive", title: "Error", description: "Ocurrió un error al generar el informe." });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <h2 className="text-xl font-semibold text-gray-800">Informes PIE</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="border rounded-xl p-6 bg-slate-50 flex flex-col items-center text-center space-y-4">
          <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Informe de Progreso Semestral</h3>
          <p className="text-sm text-gray-600">
            Genera un PDF con los datos del estudiante, estado de los objetivos PACI y estadísticas de asistencia del período seleccionado.
          </p>
          
          <div className="w-full max-w-[200px] mt-4 text-left">
            <Label className="mb-2 block">Seleccionar período:</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-full bg-white text-gray-900">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {generatePeriods().map(p => (
                  <SelectItem key={p} value={p}>Semestre {p.split('-')[1]} - {p.split('-')[0]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            className="w-full max-w-[200px] mt-4" 
            onClick={handleGenerateReport} 
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Generar PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PieReportsTab;
