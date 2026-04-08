import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';

const SEVERITY_COLORS = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const STATUS_COLORS = {
  open: 'bg-red-100 text-red-600',
  mitigating: 'bg-amber-100 text-amber-600',
  mitigated: 'bg-green-100 text-green-700',
  accepted: 'bg-blue-100 text-blue-600',
  closed: 'bg-gray-100 text-gray-600',
};

const SEVERITY_LABELS = { low: 'Bajo', medium: 'Medio', high: 'Alto', critical: 'Crítico' };
const STATUS_LABELS = { open: 'Abierto', mitigating: 'Mitigando', mitigated: 'Mitigado', accepted: 'Aceptado', closed: 'Cerrado' };

const RisksPage = () => {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRisks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('legal_risks')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setRisks(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRisks(); }, []);

  const stats = {
    total: risks.length,
    critical: risks.filter(r => r.severity === 'critical').length,
    open: risks.filter(r => r.status === 'open').length,
    mitigated: risks.filter(r => r.status === 'mitigated').length,
  };

  return (
    <PermissionGuard module="legal" action="read">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-amber-500" /> Gestión de Riesgos
            </h1>
            <p className="text-muted-foreground">Evaluación y mitigación de riesgos legales y operacionales</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRisks}>
            <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-gray-500">Total Riesgos</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
            <p className="text-xs text-gray-500">Críticos</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.open}</p>
            <p className="text-xs text-gray-500">Abiertos</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.mitigated}</p>
            <p className="text-xs text-gray-500">Mitigados</p>
          </CardContent></Card>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Riesgo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Severidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Plan de Mitigación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {risks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      <Shield className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                      No hay riesgos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  risks.map(risk => (
                    <TableRow key={risk.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{risk.title}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{risk.description}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{risk.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={SEVERITY_COLORS[risk.severity]}>
                          {SEVERITY_LABELS[risk.severity] || risk.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[risk.status]}>
                          {STATUS_LABELS[risk.status] || risk.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{risk.responsible || '—'}</TableCell>
                      <TableCell className="text-xs text-gray-500 max-w-xs truncate">{risk.mitigation_plan || '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};

export default RisksPage;
