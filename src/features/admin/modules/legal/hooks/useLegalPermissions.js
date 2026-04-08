import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export function useLegalPermissions() {
  const { user } = useAuth();
  const [canRead, setCanRead] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('admin_permissions')
          .select('can_read, can_write')
          .eq('user_id', user.id)
          .eq('module', 'legal')
          .maybeSingle();
        if (error) throw error;
        setCanRead(data?.can_read ?? false);
        setCanWrite(data?.can_write ?? false);
      } catch {
        setCanRead(false);
        setCanWrite(false);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user?.id]);

  return { canRead, canWrite, loading };
}