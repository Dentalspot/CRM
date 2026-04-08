/**
 * @file GovernancePanel.jsx
 * @description Panel lateral con estado de gobernanza y cumplimiento normativo.
 * Muestra normativas relevantes y estado de cumplimiento.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle2, AlertTriangle, Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ComplianceRow = ({ label, status, description }) => {
  const isOk = status === 'ok';
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
      {isOk ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
      )}
      <div className="min-w-0">
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
};

const GovernancePanel = () => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-green-500" />
          Gobernanza & Cumplimiento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <ComplianceRow
          label="Ley 19.628"
          status="ok"
          description="Protección de la vida privada"
        />
        <ComplianceRow
          label="Ley 20.584"
          status="ok"
          description="Derechos de los pacientes"
        />
        <ComplianceRow
          label="RGPD / GDPR"
          status="ok"
          description="Reglamento europeo de datos"
        />
        <ComplianceRow
          label="Ag. Nac. Ciberseguridad"
          status="ok"
          description="Normativa ANCS Chile"
        />
        <Button variant="outline" size="sm" className="w-full mt-2" asChild>
          <Link to="/admin/clinical-history/compliance">
            <Scale className="h-3.5 w-3.5 mr-1.5" />
            Panel de Cumplimiento
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default GovernancePanel;
