import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle2, AlertTriangle, FileText, RefreshCw, Loader2, Download } from 'lucide-react';
import { useComplianceMetrics } from '../hooks/useComplianceMetrics';
import { useLegalDocuments } from '../hooks/useLegalDocuments';
import { useLegalPolicies } from '../hooks/useLegalPolicies';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';

const CompliancePage = () => {
  const { metrics, loading: metricsLoading, refetch } = useComplianceMetrics();
  const { documents } = useLegalDocuments();
  const { policies } = useLegalPolicies();

  const loading = metricsLoading;

  const handleExportReport = () => {
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Reporte de Cumplimiento Legal - DentalSpot</title>
    <style>body{font-family:system-ui;padding:40px;max-width:800px;margin:auto}
    h1{font-size:22px}h2{font-size:16px;margin-top:24px;color:#555}
    table{width:100%;border-collapse:collapse;margin:12px 0}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}
    th{background:#f5f5f5}.stat{display:inline-block;padding:16px 24px;margin:8px;background:#f9f9f9;border-radius:8px;text-align:center}
    .stat h3{margin:0;font-size:28px}.stat p{margin:4px 0 0;font-size:12px;color:#666}
    .ok{color:#16a34a}.warn{color:#d97706}</style></head><body>
    <h1>Reporte de Cumplimiento Legal</h1>
    <p>Generado: ${new Date().toLocaleString('es-CL')}</p>
    <div>
      <div class="stat"><h3>${metrics?.overall || 0}%</h3><p>Cumplimiento General</p></div>
      <div class="stat"><h3>${metrics?.docCompliance || 0}%</h3><p>Documentos</p></div>
      <div class="stat"><h3>${metrics?.policyCompliance || 0}%</h3><p>Políticas</p></div>
    </div>
    <h2>Documentos Legales</h2>
    <table><tr><th>Título</th><th>Tipo</th><th>Estado</th></tr>
    ${documents.map(d => `<tr><td>${d.title}</td><td>${d.type}</td><td class="${d.status === 'published' ? 'ok' : 'warn'}">${d.status}</td></tr>`).join('')}
    </table>
    <h2>Políticas Internas</h2>
    <table><tr><th>Título</th><th>Categoría</th><th>Estado</th><th>Responsable</th></tr>
    ${policies.map(p => `<tr><td>${p.title}</td><td>${p.category}</td><td class="${p.status === 'active' ? 'ok' : 'warn'}">${p.status}</td><td>${p.responsible || '—'}</td></tr>`).join('')}
    </table>
    <h2>Marco Normativo Aplicable</h2>
    <table><tr><th>Normativa</th><th>Estado</th></tr>
    <tr><td>Ley 19.628 — Protección de la vida privada</td><td class="ok">Cumple</td></tr>
    <tr><td>Ley 20.584 — Derechos de los pacientes</td><td class="ok">Cumple</td></tr>
    <tr><td>RGPD / GDPR — Reglamento europeo</td><td class="ok">Cumple</td></tr>
    <tr><td>Agencia Nacional de Ciberseguridad</td><td class="ok">Cumple</td></tr>
    </table>
    <hr><p style="font-size:11px;color:#999">DentalSpot — Plataforma de Odontología</p></body></html>`);
    w.document.close();
    w.print();
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
  }

  return (
    <PermissionGuard module="legal" action="read">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-teal-500" /> Cumplimiento Normativo
            </h1>
            <p className="text-muted-foreground">Estado de cumplimiento legal y regulatorio</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refetch}><RefreshCw className="h-4 w-4 mr-2" /> Actualizar</Button>
            <Button size="sm" onClick={handleExportReport}><Download className="h-4 w-4 mr-2" /> Exportar Reporte</Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-teal-500" />
              <p className="text-3xl font-bold text-teal-600">{metrics?.overall || 0}%</p>
              <p className="text-sm text-gray-500">Cumplimiento General</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-3xl font-bold text-blue-600">{metrics?.docCompliance || 0}%</p>
              <p className="text-sm text-gray-500">Documentos Publicados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-3xl font-bold text-green-600">{metrics?.policyCompliance || 0}%</p>
              <p className="text-sm text-gray-500">Políticas Activas</p>
            </CardContent>
          </Card>
        </div>

        {/* Normative Framework */}
        <Card>
          <CardHeader><CardTitle className="text-base">Marco Normativo Aplicable</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Ley 19.628', desc: 'Protección de la vida privada', status: 'ok' },
              { name: 'Ley 20.584', desc: 'Derechos y deberes de los pacientes', status: 'ok' },
              { name: 'RGPD / GDPR', desc: 'Reglamento europeo de protección de datos', status: 'ok' },
              { name: 'Ag. Nac. Ciberseguridad', desc: 'Normativa ANCS Chile', status: 'ok' },
              { name: 'Política de Cookies', desc: 'Consentimiento y uso de cookies', status: documents.some(d => d.type === 'cookies' && d.status === 'published') ? 'ok' : 'warn' },
            ].map(law => (
              <div key={law.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {law.status === 'ok' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  <div>
                    <p className="text-sm font-medium">{law.name}</p>
                    <p className="text-xs text-gray-500">{law.desc}</p>
                  </div>
                </div>
                <Badge className={law.status === 'ok' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                  {law.status === 'ok' ? 'Cumple' : 'Pendiente'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Documents status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Documentos Legales ({documents.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {documents.map(d => (
                <div key={d.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                  <span className="text-sm">{d.title}</span>
                  <Badge className={d.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                    {d.status === 'published' ? 'Publicado' : 'Borrador'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Políticas Internas ({policies.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {policies.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                  <span className="text-sm">{p.title}</span>
                  <Badge className={p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                    {p.status === 'active' ? 'Activa' : p.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default CompliancePage;
