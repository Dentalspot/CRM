import { useState } from 'react';
import { AlertTriangle, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClinicalConsentModal from './ClinicalConsentModal';

export default function ConsentRequiredBanner({ patient, therapistName, onConsentSigned }) {
  const [showModal, setShowModal] = useState(false);

  if (patient?.clinical_consent_signed) return null;

  return (
    <>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-800 text-sm">Consentimiento Informado Pendiente</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              La Ley 20.584 requiere consentimiento informado antes de iniciar tratamiento.
              El paciente debe firmar el consentimiento para continuar.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setShowModal(true)}
          className="bg-amber-600 hover:bg-amber-700 flex-shrink-0"
        >
          <FileCheck className="mr-2 h-4 w-4" />
          Firmar ahora
        </Button>
      </div>

      <ClinicalConsentModal
        open={showModal}
        onClose={() => setShowModal(false)}
        patientId={patient?.id}
        patientName={patient?.full_name || patient?.profiles?.full_name}
        therapistName={therapistName}
        onSigned={onConsentSigned}
      />
    </>
  );
}
