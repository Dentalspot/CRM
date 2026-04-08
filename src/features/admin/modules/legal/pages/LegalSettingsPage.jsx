import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Shield, FileText, Clock, Bell, Globe, CheckCircle2 } from 'lucide-react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';

const LegalSettingsPage = () => {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <PermissionGuard module="legal" action="write">
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-gray-500" /> Configuración Legal
          </h1>
          <p className="text-muted-foreground">Ajustes generales del módulo legal y cumplimiento</p>
        </div>

        {/* Data Retention */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" /> Retención de Datos
            </CardTitle>
            <CardDescription>Periodos de retención según tipo de dato</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Datos clínicos (fichas, evoluciones)', period: '10 años', law: 'Ley 20.584' },
              { label: 'Datos de cuenta (perfil, email)', period: 'Mientras activa + 2 años', law: 'Ley 19.628' },
              { label: 'Logs de acceso', period: '1 año', law: 'ANCS' },
              { label: 'Datos de pago', period: '5 años', law: 'SII Chile' },
              { label: 'Consentimientos (firmas)', period: 'Permanente', law: 'GDPR Art. 7' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-gray-500">Normativa: {item.law}</p>
                </div>
                <Badge variant="outline">{item.period}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" /> Notificaciones
            </CardTitle>
            <CardDescription>Alertas de cumplimiento y vencimientos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Alertar cuando un documento legal no se actualiza en 6 meses', enabled: true },
              { label: 'Alertar cuando una política está próxima a revisión (30 días)', enabled: true },
              { label: 'Alertar cuando hay disputas abiertas sin asignar por más de 48h', enabled: true },
              { label: 'Notificar al responsable cuando un riesgo cambia de severidad', enabled: false },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">{item.label}</p>
                <Badge className={item.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                  {item.enabled ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Public Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-teal-500" /> Páginas Públicas
            </CardTitle>
            <CardDescription>Documentos legales accesibles desde el sitio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Términos y Condiciones', url: '/legal/terminos-condiciones' },
              { label: 'Política de Privacidad', url: '/legal/politica-privacidad' },
              { label: 'Política de Cookies', url: '/legal/politica-cookies' },
              { label: 'Disclaimer Clínico', url: '/legal/disclaimer-clinico' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-gray-500">{window.location.origin}{item.url}</p>
                </div>
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">Ver página</Button>
                </a>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Compliance Framework */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" /> Marco de Cumplimiento
            </CardTitle>
            <CardDescription>Normativas aplicables a la plataforma</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Ley 19.628', desc: 'Protección de la vida privada', status: 'Implementada' },
              { name: 'Ley 20.584', desc: 'Derechos y deberes de los pacientes', status: 'Implementada' },
              { name: 'RGPD / GDPR', desc: 'Reglamento europeo de protección de datos', status: 'Implementada' },
              { name: 'Ag. Nac. Ciberseguridad', desc: 'Normativa ANCS Chile', status: 'Implementada' },
              { name: 'RNPS', desc: 'Registro Nacional de Prestadores de Salud', status: 'Pendiente verificación' },
            ].map(item => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 ${item.status === 'Implementada' ? 'text-green-500' : 'text-amber-500'}`} />
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
                <Badge className={item.status === 'Implementada' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saved}>
            {saved ? <><CheckCircle2 className="h-4 w-4 mr-2" /> Guardado</> : 'Guardar Configuración'}
          </Button>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default LegalSettingsPage;
