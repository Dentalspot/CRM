import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ComplianceRow = ({ label, description, status }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
    {status === 'ok' ? <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />}
    <div className="min-w-0">
      <p className="font-medium text-sm">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
  </div>
);

const ComplianceOverviewPanel = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base flex items-center gap-2">
        <Shield className="h-4 w-4 text-green-500" />
        Marco Normativo
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <ComplianceRow label="Ley 19.628" description="Protección de datos personales" status="ok" />
      <ComplianceRow label="Ley 20.584" description="Derechos de los pacientes" status="ok" />
      <ComplianceRow label="RGPD / GDPR" description="Reglamento europeo" status="ok" />
      <ComplianceRow label="ANCS" description="Ag. Nacional Ciberseguridad" status="ok" />
      <ComplianceRow label="Política de Cookies" description="Consentimiento informado" status="ok" />
      <Button variant="outline" size="sm" className="w-full mt-2" asChild>
        <Link to="/admin/legal/compliance">Panel de Cumplimiento</Link>
      </Button>
    </CardContent>
  </Card>
);

export default ComplianceOverviewPanel;
