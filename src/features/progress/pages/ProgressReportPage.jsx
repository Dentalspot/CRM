import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  Share2,
  TrendingUp,
  Target,
  Lightbulb,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Brain
} from 'lucide-react';
import { jsPDF } from "jspdf";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ProgressReportPage = ({ report, patientName, onShare, onDownload }) => {
  const reportRef = useRef(null);

  if (!report || !report.analysis_data) return null;

  const { analysis_data: data, generated_at } = report;

  const handleDownloadPDF = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    
    // Simple PDF generation logic
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Reporte de Progreso: ${patientName}`, 20, 20);
    doc.setFontSize(12);
    doc.text(`Fecha: ${format(new Date(generated_at), 'PPP', { locale: es })}`, 20, 30);
    
    doc.setFontSize(14);
    doc.text("Resumen Ejecutivo", 20, 45);
    doc.setFontSize(10);
    const summary = doc.splitTextToSize(data.executive_summary || '', 170);
    doc.text(summary, 20, 55);

    let y = 80;
    doc.setFontSize(14);
    doc.text("Progreso Mensual", 20, y);
    y += 10;
    
    data.monthly_progress.forEach(m => {
        doc.setFontSize(10);
        doc.text(`${m.month}: ${m.score}/100 - ${m.summary}`, 20, y);
        y += 7;
    });

    doc.save(`Progreso_${patientName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" ref={reportRef}>
      {/* Header Actions */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reporte de Progreso IA</h2>
          <p className="text-muted-foreground">Generado el {format(new Date(generated_at), 'PPP', { locale: es })}</p>
        </div>
        <div className="flex gap-2">
          {onShare && (
            <Button variant="outline" onClick={onShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartir
            </Button>
          )}
          <Button onClick={handleDownloadPDF} className="bg-teal-600 hover:bg-teal-700">
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <Card className="bg-gradient-to-r from-teal-50 to-white border-teal-100">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-teal-600" />
            <CardTitle className="text-teal-900">Resumen Ejecutivo</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">
            {data.executive_summary}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Progress Chart (Simulated) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Evolución Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.monthly_progress.map((month, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{month.month}</span>
                    <span className="text-gray-500">{month.score}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                      style={{ width: `${month.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{month.summary}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Before / After Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Comparativa Métricas
            </CardTitle>
            <CardDescription>
              {data.before_after.initial_status} vs {data.before_after.current_status}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.before_after.metrics.map((metric, idx) => (
                <div key={idx} className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200">
                        {metric.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-purple-600">
                        {metric.current}/10
                      </span>
                    </div>
                  </div>
                  <div className="flex h-2 mb-4 overflow-hidden text-xs bg-purple-100 rounded">
                    {/* Before Marker */}
                    <div 
                      className="flex flex-col justify-center text-center text-white bg-gray-400 shadow-none opacity-50"
                      style={{ width: `${metric.initial * 10}%` }}
                      title={`Inicial: ${metric.initial}`}
                    />
                    {/* Progress */}
                    <div 
                      className="flex flex-col justify-center text-center text-white bg-purple-500 shadow-none"
                      style={{ width: `${(metric.current - metric.initial) * 10}%` }}
                      title={`Progreso: +${metric.current - metric.initial}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predictions Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Proyección Futura (Próximos 3 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative border-l border-green-200 ml-3 space-y-8 py-2">
            {data.predictions.map((pred, idx) => (
              <div key={idx} className="ml-6 relative">
                <span className="absolute -left-[31px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-green-100 ring-4 ring-white">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                </span>
                <h3 className="flex items-center mb-1 text-lg font-semibold text-gray-900">
                  {pred.month}
                  <Badge variant="outline" className="ml-2 text-green-600 border-green-200">
                    Meta: {pred.predicted_score}%
                  </Badge>
                </h3>
                <p className="mb-2 text-base font-normal text-gray-500">
                  {pred.expected_milestone}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Improvement Areas */}
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              Áreas de Mejora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.improvement_areas.map((area, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span className="text-gray-700">{area}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Suggestions */}
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-700">
              <Lightbulb className="h-5 w-5" />
              Sugerencias Terapéuticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.suggestions.map((sugg, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                  <span className="text-gray-700">{sugg}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProgressReportPage;