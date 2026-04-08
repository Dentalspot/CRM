import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, FileCheck, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

export default function ClinicalConsentModal({ open, onClose, patientId, patientName, therapistName, onSigned }) {
  const [consent, setConsent] = useState(null);
  const [notizConsent, setNotizConsent] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [signing, setSigning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) fetchConsent();
  }, [open]);

  const fetchConsent = async () => {
    const { data } = await supabase
      .from('legal_documents')
      .select('id, title, content, version')
      .eq('slug', 'consentimiento-clinico')
      .eq('status', 'published')
      .single();
    setConsent(data);
  };

  const handleSign = async () => {
    if (!accepted || !consent) return;
    setSigning(true);

    try {
      // 1. Record signature in legal_signatures
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase.from('legal_signatures').insert({
          user_id: user.id,
          document_id: consent.id,
          document_version: consent.version,
          user_agent: navigator.userAgent,
        });
      }

      // 2. Update patient record
      const { error } = await supabase
        .from('patients')
        .update({
          clinical_consent_signed: true,
          clinical_consent_date: new Date().toISOString(),
          notiz_consent: notizConsent,
        })
        .eq('id', patientId);

      if (error) throw error;

      // 3. Log access
      await supabase.from('clinical_access_log').insert({
        patient_id: patientId,
        accessed_by: user?.id,
        action: 'grant',
        details: {
          type: 'clinical_consent',
          notiz_consent: notizConsent,
          document_version: consent.version,
        },
      }).catch(() => {});

      toast({ title: 'Consentimiento firmado', description: 'El consentimiento informado ha sido registrado correctamente.' });
      onSigned?.();
      onClose();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo registrar el consentimiento.' });
    } finally {
      setSigning(false);
    }
  };

  if (!consent) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-teal-600" />
            Consentimiento Informado — Ley 20.584
          </DialogTitle>
        </DialogHeader>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            Este consentimiento es requerido por la Ley 20.584 antes de iniciar cualquier tratamiento odontológico.
            El paciente o su representante legal debe leer y aceptar los términos.
          </p>
        </div>

        <div className="text-sm text-gray-600 space-y-1 bg-gray-50 rounded-lg p-3">
          <p><strong>Paciente:</strong> {patientName || 'No especificado'}</p>
          <p><strong>Profesional:</strong> {therapistName || 'No especificado'}</p>
          <p><strong>Fecha:</strong> {new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        <ScrollArea className="flex-1 max-h-[350px] border rounded-lg p-4 bg-white">
          <div className="prose prose-sm max-w-none whitespace-pre-line text-gray-700">
            {consent.content}
          </div>
        </ScrollArea>

        {/* Notiz consent checkbox */}
        <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
          <input
            type="checkbox"
            checked={notizConsent}
            onChange={(e) => setNotizConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">Autorizo grabación de audio con IA (Notiz)</span>
            <p className="text-xs text-gray-500 mt-0.5">
              Permite la grabación y transcripción automática de sesiones para documentación clínica.
            </p>
          </div>
        </label>

        {/* Main consent checkbox */}
        <label className="flex items-start gap-3 p-3 rounded-lg border-2 border-teal-200 bg-teal-50/30 cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">
              He leído y acepto el consentimiento informado
            </span>
            <p className="text-xs text-gray-500 mt-0.5">
              Declaro que he comprendido la información y otorgo mi consentimiento de forma voluntaria.
            </p>
          </div>
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleSign}
            disabled={!accepted || signing}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <FileCheck className="mr-2 h-4 w-4" />
            {signing ? 'Firmando...' : 'Firmar Consentimiento'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
