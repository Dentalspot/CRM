import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

export const useClinicalConsent = () => {
  const { user } = useAuth();
  const [hasSigned, setHasSigned] = useState(null); // null = loading
  const [consentDoc, setConsentDoc] = useState(null);

  useEffect(() => {
    if (!user) return;
    checkConsent();
  }, [user]);

  const checkConsent = async () => {
    try {
      // Get the clinical consent document
      const { data: doc } = await supabase
        .from('legal_documents')
        .select('id, title, content, version, slug')
        .eq('slug', 'consentimiento-clinico')
        .eq('status', 'published')
        .single();

      if (!doc) {
        // No consent doc published — allow access
        setHasSigned(true);
        return;
      }

      setConsentDoc(doc);

      // Check if user has signed this version
      const { data: signature } = await supabase
        .from('legal_signatures')
        .select('id')
        .eq('user_id', user.id)
        .eq('document_id', doc.id)
        .eq('document_version', doc.version)
        .maybeSingle();

      setHasSigned(!!signature);
    } catch (err) {
      logger.error('Error checking consent:', err);
      setHasSigned(true); // Don't block on error
    }
  };

  // Nota: el parametro `notizConsent` se mantiene en la firma por compatibilidad
  // con el caller (ClinicalConsentGate.handleSign) pero hoy no se persiste.
  // El UPDATE a `patients` para `clinical_consent_signed`/`clinical_consent_date`/
  // `notiz_consent` fue removido porque el rol patient no tiene UPDATE sobre
  // patients en el modelo Phase 1 (silent fail). La fuente de verdad de la firma
  // es `legal_signatures`, leida via checkConsent y via la RPC del lado dentist.
  // Si Notiz requiere persistir su consent, debe abordarse en bloque dedicado.
  // eslint-disable-next-line no-unused-vars
  const signConsent = async (notizConsent = false) => {
    if (!user || !consentDoc) return false;

    try {
      const { error: sigError } = await supabase.from('legal_signatures').insert({
        user_id: user.id,
        document_id: consentDoc.id,
        document_version: consentDoc.version,
        ip_address: 'client',
        user_agent: navigator.userAgent,
      });

      if (sigError) throw sigError;

      setHasSigned(true);
      return true;
    } catch (err) {
      logger.error('Error signing consent:', err);
      return false;
    }
  };

  return { hasSigned, consentDoc, signConsent, isLoading: hasSigned === null };
};
