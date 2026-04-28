import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, FileJson, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useMyDataExport } from '../hooks/useMyDataExport';

/**
 * Card que ofrece descargar los datos personales del usuario en JSON o PDF.
 * Cumple derecho ARCO de acceso y portabilidad (Ley 21.719).
 */
const MyDataCard = () => {
  const { exportJson, exportPdf, exporting } = useMyDataExport();
  const { toast } = useToast();

  const handleJson = async () => {
    const r = await exportJson();
    if (!r.ok) {
      toast({ variant: 'destructive', title: 'Error', description: r.error?.message || 'No se pudo exportar.' });
    } else {
      toast({ title: 'Descarga iniciada', description: 'Archivo JSON con tus datos.' });
    }
  };

  const handlePdf = async () => {
    const r = await exportPdf();
    if (!r.ok) {
      toast({ variant: 'destructive', title: 'Error', description: r.error?.message || 'No se pudo exportar.' });
    } else {
      toast({ title: 'Descarga iniciada', description: 'Archivo PDF con tus datos.' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 mt-0.5">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Mis datos personales</CardTitle>
            <CardDescription>
              Descarga una copia de los datos que tenemos sobre ti, en formato portable.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Incluye perfil, ficha clínica (si aplica), citas, presupuestos, pagos y aceptaciones legales.
          Conforme al derecho ARCO de acceso y portabilidad (Ley 21.719).
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleJson} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileJson className="h-4 w-4 mr-2" />}
            Descargar JSON
          </Button>
          <Button variant="outline" size="sm" onClick={handlePdf} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
            Descargar PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyDataCard;
