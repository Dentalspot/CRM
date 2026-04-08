import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTherapistReputation } from '@/hooks/useTherapistReputation';
import { ReputationGlobalBadge, SpecialtyScoreCard } from '@/components/reputation/ReputationBadge';
import { 
  Award, TrendingUp, Lightbulb, Loader2, 
  GraduationCap, FileText, ClipboardCheck, Stethoscope 
} from 'lucide-react';

// ============================================
// TIPS DE MEJORA
// ============================================

const getImprovementTips = (reputation) => {
  if (!reputation?.specialties) return [];
  
  const tips = [];
  const specs = reputation.specialties;

  const noEducation = specs.filter(s => s.education_points === 0);
  if (noEducation.length > 0) {
    tips.push({
      icon: GraduationCap,
      title: 'Verifica tu Formación',
      description: 'Sube tus certificados académicos. La formación representa el 40% de tu score.',
      color: 'bg-blue-50 text-blue-700',
      impact: 'Alto'
    });
  }

  const lowPatients = specs.filter(s => s.unique_patients < 5 && s.final_score > 0);
  if (lowPatients.length > 0) {
    tips.push({
      icon: Stethoscope,
      title: 'Aumenta tus Pacientes',
      description: 'Atiende a nuevos pacientes a través de la plataforma para sumar experiencia.',
      color: 'bg-green-50 text-green-700',
      impact: 'Alto'
    });
  }

  const noReports = specs.filter(s => s.final_score > 0 && s.experience_breakdown?.reports === 0);
  if (noReports.length > 0) {
    tips.push({
      icon: FileText,
      title: 'Genera Informes',
      description: 'Los informes clínicos firmados suman puntos valiosos de experiencia profesional.',
      color: 'bg-orange-50 text-orange-700',
      impact: 'Medio'
    });
  }

  return tips;
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const ReputationDashboard = () => {
  const { user } = useAuth();
  const { reputation, loading, error } = useTherapistReputation(user?.id);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-purple-600" />
        <p>Calculando tu reputación...</p>
      </div>
    );
  }

  if (error || !reputation) {
    return (
      <div className="p-12 border-2 border-dashed rounded-xl text-center bg-gradient-to-br from-indigo-50 to-blue-50">
        <Award className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
        <h4 className="font-bold text-indigo-900 text-lg mb-2">Tu Reputación Clínica</h4>
        <p className="text-sm text-indigo-600 max-w-md mx-auto">
          Aquí verás tu DentalLevel, badges por especialidad y score de reputación basado en formación y experiencia clínica.
        </p>
        <span className="inline-block mt-4 px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
          Próximamente ✨
        </span>
      </div>
    );
  }

  const { global, specialties } = reputation;
  const tips = getImprovementTips(reputation);
  const activeSpecialties = specialties?.filter(s => s.final_score > 0) || [];

  return (
    <div className="space-y-8">
      
      {/* 1. HERO STATS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
              <Award className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Tu Reputación Clínica</h2>
              <p className="text-sm text-gray-500">Actualizado en tiempo real</p>
            </div>
          </div>
          {global && <ReputationGlobalBadge global={global} />}
        </div>

        {global && (
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 bg-white">
            <div className="p-6 text-center hover:bg-gray-50 transition-colors">
              <p className="text-3xl font-black text-purple-600">{global.score}</p>
              <p className="text-xs uppercase font-bold text-gray-400 mt-1">Score Global</p>
            </div>
            <div className="p-6 text-center hover:bg-gray-50 transition-colors">
              <p className="text-3xl font-black text-gray-800">{global.total_specialties}</p>
              <p className="text-xs uppercase font-bold text-gray-400 mt-1">Especialidades</p>
            </div>
            <div className="p-6 text-center hover:bg-gray-50 transition-colors">
              <p className="text-3xl font-black text-gray-800">{global.total_unique_patients}</p>
              <p className="text-xs uppercase font-bold text-gray-400 mt-1">Pacientes Únicos</p>
            </div>
            <div className="p-6 text-center hover:bg-gray-50 transition-colors">
              <p className="text-3xl font-black text-gray-800">{global.total_signed_reports}</p>
              <p className="text-xs uppercase font-bold text-gray-400 mt-1">Informes Firmados</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. ESPECIALIDADES (2/3 ancho) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-gray-900 text-lg">Desglose por Especialidad</h3>
          </div>

          <div className="grid gap-4">
            {activeSpecialties.length > 0 ? (
              activeSpecialties.map(spec => (
                <SpecialtyScoreCard key={spec.specialty_slug} specialty={spec} />
              ))
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed">
                <p className="text-gray-500">Aún no tienes actividad suficiente en ninguna especialidad.</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. TIPS (1/3 ancho) */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-gray-900 text-lg">Cómo Mejorar</h3>
          </div>

          <div className="space-y-4">
            {tips.length > 0 ? (
              tips.map((tip, i) => (
                <Card key={i} className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${tip.color} shrink-0`}>
                        <tip.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{tip.title}</h4>
                        <p className="text-xs text-gray-600 mt-1 leading-snug">{tip.description}</p>
                        <Badge variant="outline" className="mt-2 text-[10px]">Impacto {tip.impact}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="p-6 bg-green-50 rounded-xl border border-green-100 text-center">
                <p className="text-green-800 font-medium text-sm">¡Excelente trabajo! Tu perfil está muy completo.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReputationDashboard;