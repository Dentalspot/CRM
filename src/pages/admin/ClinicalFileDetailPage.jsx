import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ClinicalFileSection from '@/components/admin/clinical/ClinicalFileSection';
import AuditTrailViewer from '@/components/admin/patients/AuditTrailViewer';
import { usePatientAdmin } from '@/hooks/usePatientAdmin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Download } from 'lucide-react';

const ClinicalFileDetailPage = () => {
  const { id } = useParams();
  const { fetchClinicalFiles, loading } = usePatientAdmin();
  const [data, setData] = useState({ history: [], reports: [] });

  useEffect(() => {
    if (id) {
      fetchClinicalFiles(id).then(setData);
    }
  }, [id, fetchClinicalFiles]);

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Ficha Clínica | Admin</title>
      </Helmet>

      <div>
        <h1 className="text-2xl font-bold">Ficha Clínica Digital</h1>
        <p className="text-muted-foreground">{`ID Paciente: ${id} - Vista administrativa completa`}</p>
      </div>

      <div className="flex justify-between items-center">
        <Button variant="ghost" asChild>
          <Link to="/admin/patients/management">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Pacientes
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" /> Imprimir Ficha
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Exportar JSON
          </Button>
        </div>
      </div>

      <Tabs defaultValue="clinical" className="w-full">
        <TabsList className="mb-4 bg-white border">
          <TabsTrigger value="clinical">Historial Clínico</TabsTrigger>
          <TabsTrigger value="reports">Informes y Evaluaciones</TabsTrigger>
          <TabsTrigger value="audit">Auditoría de Acceso</TabsTrigger>
        </TabsList>

        <TabsContent value="clinical">
          <ClinicalFileSection 
            title="Sesiones y Evolución" 
            items={data.history}
            onView={(item) => {}}
            onEdit={(item) => {}}
          />
        </TabsContent>

        <TabsContent value="reports">
          <ClinicalFileSection 
            title="Informes Generados" 
            items={data.reports}
            onView={(item) => window.open(item.final_pdf_url, '_blank')}
            onEdit={(item) => {}}
          />
        </TabsContent>

        <TabsContent value="audit">
          <AuditTrailViewer 
            logs={[
              { id: 1, timestamp: new Date().toISOString(), action: 'view', user_name: 'Admin User', details: 'Acceso a ficha clínica', ip_address: '192.168.1.1' },
              { id: 2, timestamp: new Date(Date.now() - 86400000).toISOString(), action: 'export', user_name: 'Super Admin', details: 'Exportación de datos GDPR', ip_address: '10.0.0.1' }
            ]} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClinicalFileDetailPage;