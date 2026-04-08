import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Users, UserX, Eye, EyeOff } from 'lucide-react';
import ProfileAvatar from '@/components/shared/ProfileAvatar';

const ClinicTeamSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [clinicId, setClinicId] = useState(null);
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  const fetchTeam = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get clinic owned by this user
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id')
      .eq('therapist_id', user.id)
      .maybeSingle();

    if (!clinic) {
      setLoading(false);
      return;
    }
    setClinicId(clinic.id);

    // Fetch linked therapists with profile info
    const { data, error } = await supabase
      .from('clinic_therapists')
      .select(`
        id,
        is_active,
        show_in_public_profile,
        joined_at,
        profiles:therapist_id (
          id,
          full_name,
          avatar_url,
          specialization_areas,
          dentallevel_score
        )
      `)
      .eq('clinic_id', clinic.id)
      .eq('is_active', true)
      .order('joined_at', { ascending: true });

    if (error) {
      toast({ title: 'Error', description: 'No se pudo cargar el equipo.', variant: 'destructive' });
    } else {
      setTherapists(data || []);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  const handleToggleVisibility = async (linkId, currentValue) => {
    setTogglingId(linkId);
    const { error } = await supabase
      .from('clinic_therapists')
      .update({ show_in_public_profile: !currentValue })
      .eq('id', linkId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setTherapists(prev =>
        prev.map(t => t.id === linkId ? { ...t, show_in_public_profile: !currentValue } : t)
      );
    }
    setTogglingId(null);
  };

  const handleRemove = async (linkId, name) => {
    const { error } = await supabase
      .from('clinic_therapists')
      .update({ is_active: false })
      .eq('id', linkId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '✅ Terapeuta removido', description: `${name} ya no aparece en el equipo.` });
      setTherapists(prev => prev.filter(t => t.id !== linkId));
    }
  };

  const getDentalLevelLabel = (score) => {
    if (!score) return null;
    if (score >= 90) return { label: 'Experto', color: 'bg-purple-100 text-purple-800 border-purple-200' };
    if (score >= 70) return { label: 'Avanzado', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    if (score >= 50) return { label: 'Intermedio', color: 'bg-teal-100 text-teal-800 border-teal-200' };
    return { label: 'Junior', color: 'bg-gray-100 text-gray-700 border-gray-200' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Nuestro Equipo</h2>
        <p className="mt-2 text-lg text-muted-foreground">
          Gestiona los dentistas vinculados a tu clínica y controla su visibilidad en el perfil público.
        </p>
      </div>

      {therapists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-300">Aún no hay terapeutas en el equipo</p>
            <p className="text-sm text-muted-foreground mt-1">
              Los terapeutas pueden solicitar unirse a través de su perfil en "Mis Lugares de Atención".
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {therapists.map((link) => {
            const p = link.profiles;
            if (!p) return null;
            const levelInfo = getDentalLevelLabel(p.dentallevel_score);
            const isVisible = link.show_in_public_profile !== false;

            return (
              <div
                key={link.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
              >
                {/* Avatar */}
                <div className="h-14 w-14 rounded-full overflow-hidden ring-2 ring-white dark:ring-gray-700 shadow-sm flex-shrink-0">
                  <ProfileAvatar profile={p} src={p.avatar_url} className="h-full w-full" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 dark:text-white truncate">{p.full_name || 'Sin nombre'}</span>
                    {levelInfo && (
                      <Badge variant="outline" className={`text-xs py-0 h-5 font-normal ${levelInfo.color}`}>
                        {levelInfo.label}
                      </Badge>
                    )}
                  </div>
                  {p.specialization_areas?.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {p.specialization_areas.slice(0, 3).join(' · ')}
                    </p>
                  )}
                </div>

                {/* Visibility Toggle */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isVisible ? (
                    <Eye className="h-4 w-4 text-teal-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Switch
                    checked={isVisible}
                    disabled={togglingId === link.id}
                    onCheckedChange={() => handleToggleVisibility(link.id, isVisible)}
                  />
                  <Label className="text-xs text-muted-foreground hidden sm:block">
                    {isVisible ? 'Visible' : 'Oculto'}
                  </Label>
                </div>

                {/* Remove */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 flex-shrink-0"
                  onClick={() => handleRemove(link.id, p.full_name)}
                  title="Remover del equipo"
                >
                  <UserX className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground text-center">
        Para invitar nuevos terapeutas, comparte el nombre o RUT de tu clínica para que puedan buscarte desde su perfil.
      </p>
    </div>
  );
};

export default ClinicTeamSection;
