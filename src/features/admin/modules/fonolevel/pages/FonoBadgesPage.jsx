
import React from 'react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import BadgeCard from '../components/BadgeCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FonoBadgesPage = () => {
  // Static array of badges based on the leveling system requirements
  const systemBadges = [
    { 
      id: 6, 
      name: 'Máximo nivel', 
      description: 'Élite: formación completa + máxima actividad clínica. Mínimo: 80 pts', 
      icon: '🏆',
      minScore: 80 
    },
    { 
      id: 5, 
      name: 'Alta experiencia', 
      description: 'Alto volumen de pacientes, informes y planes. Mínimo: 60 pts', 
      icon: '🔵',
      minScore: 60 
    },
    { 
      id: 4, 
      name: 'Profesional con experiencia', 
      description: 'Actividad clínica sostenida y formación sólida. Mínimo: 40 pts', 
      icon: '🟠',
      minScore: 40 
    },
    { 
      id: 3, 
      name: 'Experiencia básica', 
      description: 'Formación + primeros pacientes en plataforma. Mínimo: 20 pts', 
      icon: '🟡',
      minScore: 20 
    },
    { 
      id: 2, 
      name: 'En formación', 
      description: 'Formación académica básica registrada. Mínimo: 1 pt', 
      icon: '🔹',
      minScore: 1 
    },
    { 
      id: 1, 
      name: 'Sin nivel', 
      description: 'Sin formación ni actividad registrada. Mínimo: 0 pts', 
      icon: '⬜',
      minScore: 0 
    }
  ];

  return (
    <PermissionGuard module="dentallevel" action="read">
      <div className="py-8 px-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Badges del Sistema</h1>
            <p className="text-slate-500 mt-1">Insignias otorgadas automáticamente basadas en la reputación global y por especialidad.</p>
          </div>
        </div>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Niveles Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {systemBadges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
};

export default FonoBadgesPage;
