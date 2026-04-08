import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { RefreshCw, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useDataQuality } from '../hooks/useDataQuality';
import { cn } from '@/lib/utils';

const PatientDataQualityPage = () => {
  const { score, issues, loading, reanalyze } = useDataQuality();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const highIssues = issues.filter(i => i.severity === 'high');
  const mediumIssues = issues.filter(i => i.severity === 'medium');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calidad de Datos</h1>
          <p className="text-muted-foreground">Análisis de completitud y consistencia de datos de pacientes</p>
        </div>
        <Button variant="outline" size="sm" onClick={reanalyze}>
          <RefreshCw className="h-4 w-4 mr-2" /> Re-analizar
        </Button>
      </div>

      {/* Score */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Salud de la Base de Datos</h3>
            <span className={cn("text-2xl font-bold", score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-600" : "text-red-600")}>
              {score}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={cn("h-3 rounded-full transition-all", score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-red-500")}
              style={{ width: `${score}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>{issues.length} problemas detectados</span>
            <span>{highIssues.length} críticos · {mediumIssues.length} medios</span>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-red-500" />
            <p className="text-2xl font-bold text-red-600">{highIssues.length}</p>
            <p className="text-xs text-gray-500">Críticos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold text-amber-600">{mediumIssues.length}</p>
            <p className="text-xs text-gray-500">Medios</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold text-green-600">{score}%</p>
            <p className="text-xs text-gray-500">Completitud</p>
          </CardContent>
        </Card>
      </div>

      {/* Issues table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Problemas Detectados ({issues.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Todos los datos están completos</p>
            </div>
          ) : (
            <div className="rounded-md border max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Campo faltante</TableHead>
                    <TableHead>Severidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.slice(0, 50).map((issue, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{issue.patientName}</TableCell>
                      <TableCell className="text-sm">{issue.field}</TableCell>
                      <TableCell>
                        <Badge className={issue.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                          {issue.severity === 'high' ? 'Crítico' : 'Medio'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {issues.length > 50 && (
                <p className="text-xs text-gray-400 p-2 text-center">Mostrando 50 de {issues.length} problemas</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientDataQualityPage;
