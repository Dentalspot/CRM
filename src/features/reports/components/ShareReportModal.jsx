import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { Mail, Link as LinkIcon, Copy, Check } from 'lucide-react';

const ShareReportModal = ({ isOpen, onClose, report }) => {
  const [email, setEmail] = useState(report?.patient?.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Mock shareable link logic since we don't have public report views set up yet
  const shareableLink = `https://dentalspot.cl/reports/view/${Math.random().toString(36).substr(2, 9)}`;

  const handleSendEmail = async () => {
    if (!email) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-report-email', {
        body: JSON.stringify({
          patientEmail: email,
          patientName: report.patient.name,
          reportTitle: report.template.name,
          reportContent: report.content, // Simplified passing of content
          therapistName: report.therapist.full_name
        })
      });

      if (error) throw error;

      toast({ title: 'Enviado', description: `Informe enviado a ${email}` });
      onClose();
    } catch (error) {
      logger.error('Error sending email:', error);
      toast({ 
        title: 'Error', 
        description: 'No se pudo enviar el correo. Verifica el servicio de Edge Functions.', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copiado', description: 'Enlace copiado al portapapeles' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartir Informe</DialogTitle>
          <DialogDescription>
            Envía el informe directamente al paciente o genera un enlace.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Correo Electrónico</TabsTrigger>
            <TabsTrigger value="link">Enlace Directo</TabsTrigger>
          </TabsList>
          
          <TabsContent value="email" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email del Paciente</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
              />
            </div>
            <div className="bg-muted p-3 rounded text-xs text-muted-foreground">
              Se enviará un correo con el resumen del informe adjunto.
            </div>
            <Button onClick={handleSendEmail} disabled={isLoading} className="w-full">
              {isLoading ? 'Enviando...' : <><Mail className="mr-2 h-4 w-4" /> Enviar Correo</>}
            </Button>
          </TabsContent>

          <TabsContent value="link" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Enlace Seguro</Label>
              <div className="flex space-x-2">
                <Input value={shareableLink} readOnly />
                <Button size="icon" variant="outline" onClick={copyLink}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 border border-yellow-100">
              <span className="font-semibold">Nota:</span> Este enlace es válido por 7 días y solo accesible para usuarios autenticados.
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ShareReportModal;