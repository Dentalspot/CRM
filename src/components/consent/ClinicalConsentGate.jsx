import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, FileText, Mic, CheckCircle, Loader2 } from 'lucide-react';
import { useClinicalConsent } from '@/hooks/useClinicalConsent';
import { useToast } from '@/components/ui/use-toast';

const ClinicalConsentGate = ({ children }) => {
  const { hasSigned, consentDoc, signConsent, isLoading } = useClinicalConsent();
  const { toast } = useToast();
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptData, setAcceptData] = useState(false);
  const [acceptNotiz, setAcceptNotiz] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showFullDoc, setShowFullDoc] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (hasSigned) return <>{children}</>;

  const handleSign = async () => {
    if (!acceptTerms || !acceptData) return;
    setSubmitting(true);
    const success = await signConsent(acceptNotiz);
    if (success) {
      toast({ title: 'Consentimiento registrado', description: 'Puedes acceder a tu información clínica.' });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo registrar el consentimiento.' });
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card className="border-2 border-purple-100">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto p-3 bg-purple-100 rounded-full w-fit mb-3">
            <Shield className="h-8 w-8 text-purple-600" />
          </div>
          <CardTitle className="text-xl">Consentimiento Informado</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Antes de acceder a tu información clínica, necesitamos tu consentimiento según la Ley 20.584.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Document preview */}
          <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto text-sm text-gray-600 leading-relaxed">
            {showFullDoc && consentDoc?.content ? (
              <div className="whitespace-pre-wrap">{consentDoc.content}</div>
            ) : (
              <div>
                <p className="font-medium text-gray-800 mb-2">Resumen del Consentimiento:</p>
                <ul className="space-y-1.5">
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> Has sido informado(a) sobre tu diagnóstico y alternativas de tratamiento.</li>
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> Tus datos clínicos se almacenan de forma segura y confidencial.</li>
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> Puedes solicitar acceso, rectificación o eliminación de tus datos (Derechos ARCO).</li>
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> Puedes revocar este consentimiento en cualquier momento.</li>
                </ul>
                <button
                  onClick={() => setShowFullDoc(true)}
                  className="text-purple-600 underline text-xs mt-3 block"
                >
                  Leer documento completo
                </button>
              </div>
            )}
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-800">Acepto el tratamiento fonoaudiológico</span>
                <p className="text-xs text-gray-500">He leído y comprendido la información sobre mi tratamiento, riesgos y beneficios.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptData}
                onChange={(e) => setAcceptData(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-800">Autorizo el registro digital de mi información clínica</span>
                <p className="text-xs text-gray-500">Conforme a la Ley 19.628 y normativa de la Agencia Nacional de Ciberseguridad.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer border-t pt-3">
              <input
                type="checkbox"
                checked={acceptNotiz}
                onChange={(e) => setAcceptNotiz(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div className="flex items-start gap-2">
                <div>
                  <span className="text-sm font-medium text-gray-800 flex items-center gap-1">
                    <Mic className="h-3.5 w-3.5 text-teal-600" /> Autorizo grabación de audio con IA (opcional)
                  </span>
                  <p className="text-xs text-gray-500">Permito la grabación de sesiones para documentación clínica automática mediante Notiz AI.</p>
                </div>
              </div>
            </label>
          </div>

          {/* Sign button */}
          <Button
            onClick={handleSign}
            disabled={!acceptTerms || !acceptData || submitting}
            className="w-full bg-purple-600 hover:bg-purple-700 h-11"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Registrando firma...</>
            ) : (
              <><FileText className="h-4 w-4 mr-2" /> Firmar Consentimiento</>
            )}
          </Button>

          <p className="text-xs text-gray-400 text-center">
            Tu firma digital queda registrada con fecha, hora e IP para cumplimiento normativo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClinicalConsentGate;
