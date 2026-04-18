import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// Modal informativo: muestra el documento de consentimiento clinico como
// referencia para el dentista, pero NO permite firmar en nombre del paciente.
// La firma legal solo puede registrarse cuando el propio paciente firma desde
// su portal (ClinicalConsentGate -> useClinicalConsent.signConsent), porque el
// firmante registrado en legal_signatures debe ser el paciente.
//
// Prop `onSigned` se conserva en la firma del componente por compatibilidad
// con el caller (ConsentRequiredBanner) pero ya no se invoca.
export default function ClinicalConsentModal({ open, onClose, patientId, patientName, therapistName, onSigned }) {
  const [consent, setConsent] = useState(null);

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-teal-600" />
            Consentimiento informado pendiente del paciente
          </DialogTitle>
        </DialogHeader>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-700 space-y-1">
            <p>
              El consentimiento informado debe ser firmado por el propio paciente
              desde su portal. Por exigencia legal (Ley 20.584), tú no puedes
              registrar la firma en su nombre desde aquí.
            </p>
            <p>
              Indícale al paciente que ingrese a su cuenta y firme el documento
              antes de iniciar el tratamiento.
            </p>
          </div>
        </div>

        <div className="text-sm text-gray-600 space-y-1 bg-gray-50 rounded-lg p-3">
          <p><strong>Paciente:</strong> {patientName || 'No especificado'}</p>
          <p><strong>Profesional:</strong> {therapistName || 'No especificado'}</p>
        </div>

        {consent ? (
          <ScrollArea className="flex-1 max-h-[350px] border rounded-lg p-4 bg-white">
            <div className="prose prose-sm max-w-none whitespace-pre-line text-gray-700">
              {consent.content}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-xs text-gray-500 italic border rounded-lg p-4 bg-white">
            No hay un documento de consentimiento publicado disponible para mostrar como referencia.
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button onClick={onClose} className="bg-teal-600 hover:bg-teal-700">
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
