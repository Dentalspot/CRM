
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import { useDentalLevelDetail } from '../hooks/useFonoLevelDetail';
import { fonoLevelApi } from '../api/fonoLevelApi';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ReputationScoreDisplay from '../components/ReputationScoreDisplay';
import logger from '@/lib/utils/logger';

const DentalLevelDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { detail, loading: detailLoading } = useDentalLevelDetail(id);
  
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', id)
          .single();
        
        if (!error && data) {
          setProfile(data);
        }
      } catch (error) {
        // Silent fail as requested
      } finally {
        setProfileLoading(false);
        setLoading(false);
      }
    };

    if (id) {
      fetchProfile();
    }
  }, [id]);

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      await fonoLevelApi.recalculateReputation(id);
      toast({
        title: "Recálculo exitoso",
        description: "Los puntajes del dentista han sido actualizados.",
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      logger.error(error);
      toast({
        variant: "destructive",
        title: "Error al recalcular",
        description: "No se pudo completar la operación.",
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  const isLoadingGlobal = detailLoading || profileLoading;

  if (isLoadingGlobal) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!detail && !detailLoading) {
    return (
      <div className="py-12 px-6 max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/admin/dentallevel')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-slate-500">
            No se encontró información de reputación para este terapeuta.
          </CardContent>
        </Card>
      </div>
    );
  }

  const globalInfo = detail?.global || {};
  const specialties = detail?.specialties || [];
  const formula = detail?.formula || { education_weight: 0.4, experience_weight: 0.6 };

  // Calculate averages
  let avgEdu = 0;
  let avgExp = 0;
  if (specialties.length > 0) {
    const totalEdu = specialties.reduce((sum, s) => sum + (s.education_points || 0), 0);
    const totalExp = specialties.reduce((sum, s) => sum + (s.experience_points || 0), 0);
    avgEdu = Math.round(totalEdu / specialties.length);
    avgExp = Math.round(totalExp / specialties.length);
  }

  return (
    <PermissionGuard module="dentallevel" action="read">
      <div className="py-8 px-6 max-w-7xl mx-auto space-y-6 transition-all duration-300">
        
        {/* Navigation and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/dentallevel')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </Button>
          <Button 
            onClick={handleRecalculate} 
            disabled={isRecalculating}
            className="w-full sm:w-auto"
          >
            {isRecalculating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Recalcular Puntajes
          </Button>
        </div>

        {/* Global Profile Header */}
        <Card className="overflow-hidden border-0 shadow-md">
          <div className="bg-slate-50 p-6 border-b flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left min-h-[80px] flex flex-col justify-center">
              {loading ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Cargando perfil...</span>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {profile?.full_name || 'Terapeuta Desconocido'}
                  </h1>
                  <p className="text-slate-500">{profile?.email || 'Sin correo registrado'}</p>
                </>
              )}
            </div>
            <div className="flex flex-col items-center bg-white py-3 px-6 rounded-xl shadow-sm border">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nivel Global</span>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{globalInfo.emoji || '⬜'}</span>
                <div>
                  <div className="font-bold text-xl leading-none">{globalInfo.score || 0} pts</div>
                  <div className="text-sm font-medium" style={{ color: globalInfo.color || '#64748b' }}>
                    {globalInfo.badge || 'Sin nivel'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="font-semibold text-lg border-b pb-2">Promedios de Especialidad</h3>
              <ReputationScoreDisplay 
                label={`Educación (Peso: ${formula.education_weight * 100}%)`} 
                score={avgEdu} 
                maxScore={100} 
              />
              <ReputationScoreDisplay 
                label={`Experiencia Clínica (Peso: ${formula.experience_weight * 100}%)`} 
                score={avgExp} 
                maxScore={100} 
              />
            </div>
            <div className="space-y-6">
              <h3 className="font-semibold text-lg border-b pb-2">Métricas Generales</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border text-center">
                  <div className="text-2xl font-bold text-slate-700">{globalInfo.total_specialties || 0}</div>
                  <div className="text-xs text-slate-500 font-medium">Especialidades evaluadas</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border text-center">
                  <div className="text-2xl font-bold text-slate-700">{globalInfo.total_unique_patients || 0}</div>
                  <div className="text-xs text-slate-500 font-medium">Pacientes únicos</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border text-center">
                  <div className="text-2xl font-bold text-slate-700">{globalInfo.total_completed_plans || 0}</div>
                  <div className="text-xs text-slate-500 font-medium">Planes completados</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border text-center">
                  <div className="text-2xl font-bold text-slate-700">{globalInfo.total_signed_reports || 0}</div>
                  <div className="text-xs text-slate-500 font-medium">Informes firmados</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Specialties Grid */}
        <div>
          <h2 className="text-xl font-bold mb-4 px-1">Desglose por Especialidad</h2>
          {specialties.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                El terapeuta no tiene especialidades registradas.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {specialties.map((spec, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="bg-slate-50 pb-4 border-b">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{spec.specialty_icon || '📌'}</span>
                        <CardTitle className="text-base leading-tight">{spec.specialty_name}</CardTitle>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl">{spec.badge_emoji || '⬜'}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-sm font-medium text-slate-500">Puntaje Final</div>
                        <div className="text-3xl font-bold text-slate-800">{spec.final_score || 0}</div>
                      </div>
                      <div className="text-sm font-medium" style={{ color: spec.badge_color || '#64748b' }}>
                        {spec.badge_label || 'Sin nivel'}
                      </div>
                    </div>
                    
                    <div className="space-y-3 pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Formación académica:</span>
                        <span className="font-semibold">{spec.education_points || 0} pts</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Experiencia clínica:</span>
                        <span className="font-semibold">{spec.experience_points || 0} pts</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Pacientes atendidos:</span>
                        <span className="font-semibold">{spec.unique_patients || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>
    </PermissionGuard>
  );
};

export default DentalLevelDetailPage;
