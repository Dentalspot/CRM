import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { QrCode, Copy, Check, Loader2, Link2, Clock } from 'lucide-react';

const SharePassportModal = ({ isOpen, onClose, patientId, profileId }) => {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    setGenerating(true);
    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(); // 72 hours

      const { error } = await supabase
        .from('patient_access_grants')
        .insert({
          patient_id: patientId,
          profile_id: profileId,
          access_level: 'full',
          granted_by: 'patient',
          share_token: token,
          token_expires_at: expiresAt,
          is_active: false, // Not active until therapist accepts
        });

      if (error) throw error;

      const url = `${window.location.origin}/accept-passport/${token}`;
      setShareUrl(url);

      // Log
      await supabase.from('clinical_access_log').insert({
        patient_id: patientId,
        accessed_by: profileId,
        action: 'share',
        details: { token, expires_at: expiresAt },
      });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: 'Link copiado' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setShareUrl(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-teal-600" />
            Compartir mi historia clínica
          </DialogTitle>
          <DialogDescription>
            Genera un link temporal para compartir tu historia con un nuevo terapeuta. El link expira en 72 horas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!shareUrl ? (
            <div className="text-center py-4">
              <div className="bg-teal-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-3">
                <Link2 className="h-8 w-8 text-teal-600" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Al generar el link, tu nuevo terapeuta podrá ver toda tu historia clínica
                incluyendo diagnósticos, sesiones, planes y notas inter-profesionales.
              </p>
              <Button
                className="bg-teal-600 hover:bg-teal-700"
                onClick={generateLink}
                disabled={generating}
              >
                {generating ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generando...</>
                ) : (
                  <><Link2 className="h-4 w-4 mr-2" /> Generar link de acceso</>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="text-xs bg-white"
                    onClick={(e) => e.target.select()}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyLink}
                    className={copied ? 'text-green-600 border-green-200' : ''}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                <span>Este link expira en 72 horas</span>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                Envía este link a tu nuevo terapeuta por WhatsApp, email o muéstrale el código QR en consulta.
                Cuando acepte, aparecerá en tu lista de accesos autorizados.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SharePassportModal;