import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

export const useDemographicsStats = () => {
  const [stats, setStats] = useState({
    total: 0, active: 0, inactive: 0,
    byGender: [], byAge: [], byRegion: [], byStatus: [], byMonth: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all patients with profile data
      const { data: patients, error: err } = await supabase
        .from('patients')
        .select('id, status, created_at, profile:profiles!patients_profile_id_fkey(gender, birthdate, region_id)');

      if (err) throw err;

      const total = patients?.length || 0;
      const active = patients?.filter(p => p.status === 'active').length || 0;
      const inactive = total - active;

      // By gender
      const genderMap = {};
      patients?.forEach(p => {
        const g = p.profile?.gender || 'Sin especificar';
        genderMap[g] = (genderMap[g] || 0) + 1;
      });
      const byGender = Object.entries(genderMap).map(([name, value]) => ({ name, value }));

      // By age range
      const now = new Date();
      const ageRanges = { '0-2': 0, '3-5': 0, '6-12': 0, '13-17': 0, '18-30': 0, '31-50': 0, '51+': 0, 'Sin dato': 0 };
      patients?.forEach(p => {
        if (!p.profile?.birthdate) { ageRanges['Sin dato']++; return; }
        const birth = new Date(p.profile.birthdate);
        const age = Math.floor((now - birth) / (365.25 * 24 * 60 * 60 * 1000));
        if (age <= 2) ageRanges['0-2']++;
        else if (age <= 5) ageRanges['3-5']++;
        else if (age <= 12) ageRanges['6-12']++;
        else if (age <= 17) ageRanges['13-17']++;
        else if (age <= 30) ageRanges['18-30']++;
        else if (age <= 50) ageRanges['31-50']++;
        else ageRanges['51+']++;
      });
      const byAge = Object.entries(ageRanges).filter(([,v]) => v > 0).map(([name, value]) => ({ name, value }));

      // By status
      const byStatus = [
        { name: 'Activos', value: active },
        { name: 'Inactivos', value: inactive },
      ];

      // By month (last 6 months)
      const byMonth = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthName = d.toLocaleString('es-CL', { month: 'short' });
        const count = patients?.filter(p => p.created_at?.startsWith(monthKey)).length || 0;
        byMonth.push({ name: monthName, value: count });
      }

      setStats({ total, active, inactive, byGender, byAge, byStatus, byMonth, byRegion: [] });
      setError(null);
    } catch (err) {
      logger.error('Error fetching demographics:', err);
      setError(err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { stats, loading, error, refreshStats: fetchStats };
};
