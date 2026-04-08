import { useState, useEffect } from 'react';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

export const useClinicMembership = (userId) => {
  const [clinicData, setClinicData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const fetch = async () => {
      try {
        // 1. Find clinic(s) where this therapist is active
        const { data: memberships, error } = await supabase
          .from('clinic_therapists')
          .select(`
            clinic_id,
            clinic:clinics!clinic_therapists_clinic_id_fkey(
              id, name, therapist_id
            )
          `)
          .eq('therapist_id', userId)
          .eq('is_active', true);

        if (error || !memberships?.length) {
          setClinicData(null);
          setLoading(false);
          return;
        }

        // Take the first clinic (primary)
        const primaryClinic = memberships[0].clinic;

        // 2. Count active therapists in that clinic
        const { count, error: countErr } = await supabase
          .from('clinic_therapists')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', primaryClinic.id)
          .eq('is_active', true);

        if (countErr) throw countErr;

        setClinicData({
          clinicId: primaryClinic.id,
          clinicName: primaryClinic.name,
          isOwner: primaryClinic.therapist_id === userId,
          activeTherapists: count || 1,
        });
      } catch (err) {
        logger.error('Error fetching clinic membership:', err);
        setClinicData(null);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [userId]);

  return { clinicData, loading };
};

export default useClinicMembership;
