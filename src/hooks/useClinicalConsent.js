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

  const signConsent = async (notizConsent = false) => {
    if (!user || !consentDoc) return false;

    try {
      // Record signature
      const { error: sigError } = await supabase.from('legal_signatures').insert({
        user_id: user.id,
        document_id: consentDoc.id,
        document_version: consentDoc.version,
        ip_address: 'client',
        user_agent: navigator.userAgent,
      });

      if (sigError) throw sigError;

      // Update patient record
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (patient) {
        await supabase.from('patients').update({
          clinical_consent_signed: true,
          clinical_consent_date: new Date().toISOString(),
          notiz_consent: notizConsent,
        }).eq('id', patient.id);
      }

      setHasSigned(true);
      return true;
    } catch (err) {
      logger.error('Error signing consent:', err);
      return false;
    }
  };

  return { hasSigned, consentDoc, signConsent, isLoading: hasSigned === null };
};
