import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Users, Shield, ShieldOff, Loader2, UserCheck, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ACCESS_LEVELS } from '../constants/timelineConfig';
import RevokeAccessDialog from './RevokeAccessDialog';
import logger from '@/lib/utils/logger';

const AccessGrantsManager = ({ patientId, profileId }) => {
  const { toast } = useToast();
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokeTarget, setRevokeTarget] = useState(null);

  const loadGrants = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patient_access_grants')
        .select(`
          *,
          therapist:granted_to (id, full_name, email)
        `)
        .eq('profile_id', profileId)
        .order('granted_at', { ascending: false });

      if (error) throw error;
      setGrants(data || []);
    } catch (err) {
      logger.error('Error loading grants:', err);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    if (profileId) loadGrants();
  }, [profileId, loadGrants]);

  const handleRevoke = async (grantId) => {
    try {
      const { error } = await supabase
        .from('patient_access_grants')
        .update({ is_active: false, access_level: 'revoked', revoked_at: new Date().toISOString() })
        .eq('id', grantId);

      if (error) throw error;

      // Log the action
      await supabase.from('clinical_access_log').insert({
        patient_id: patientId,
        accessed_by: profileId,
        action: 'revoke',
        details: { grant_id: grantId },
      });

      toast({ title: 'Acceso revocado' });
      setRevokeTarget(null);
      loadGrants();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  if (loading) {
    return (
      <Card><CardContent className="py-8 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </CardContent></Card>
    );
  }

  const activeGrants = grants.filter(g => g.is_active);
  const revokedGrants = grants.filter(g => !g.is_active);

  return (
    <>
      <Card className="border border-gray-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-teal-600" />
            Quién tiene acceso a mi historia
          </CardTitle>
          <CardDescription className="text-xs">
            Controla qué profesionales pueden ver tu información clínica.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {activeGrants.length === 0 && (
            <div className="text-center py-6">
              <Users className="h-8 w-8 mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-500">Ningún profesional tiene acceso actualmente.</p>
              <p className="text-xs text-gray-400 mt-1">Comparte tu historia con un nuevo terapeuta usando el botón "Compartir".</p>
            </div>
          )}

          {activeGrants.map(grant => (
            <div key={grant.id} className="flex items-center gap-3 p-3 rounded-lg bg-green-50/50 border border-green-100">
              <UserCheck className="h-5 w-5 text-green-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {grant.therapist?.full_name || 'Terapeuta'}
                </p>
                <p className="text-[11px] text-gray-400">
                  {grant.therapist?.email} · Desde {format(parseISO(grant.granted_at), "d MMM yyyy", { locale: es })}
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 shrink-0">
                {ACCESS_LEVELS[grant.access_level]?.label || grant.access_level}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs shrink-0"
                onClick={() => setRevokeTarget(grant)}
              >
                <ShieldOff className="h-3.5 w-3.5 mr-1" /> Revocar
              </Button>
            </div>
          ))}

          {revokedGrants.length > 0 && (
            <div className="pt-3 border-t mt-3">
              <p className="text-[11px] text-gray-400 mb-2">Accesos revocados</p>
              {revokedGrants.map(grant => (
                <div key={grant.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 opacity-60">
                  <ShieldOff className="h-4 w-4 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 truncate">{grant.therapist?.full_name}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px] bg-gray-50 text-gray-400 border-gray-200">
                    Revocado
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RevokeAccessDialog
        grant={revokeTarget}
        onConfirm={handleRevoke}
        onCancel={() => setRevokeTarget(null)}
      />
    </>
  );
};

export default AccessGrantsManager;