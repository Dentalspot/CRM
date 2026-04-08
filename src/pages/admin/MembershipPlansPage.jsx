import React from 'react';
import PlanCard from '@/components/admin/PlanCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const MembershipPlansPage = () => {
  return (
<div className="p-6">
          <div className="flex justify-end mb-6">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Crear Nuevo Plan
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PlanCard 
              plan={{ 
                name: "Plan Básico", 
                price: 0, 
                interval: "monthly", 
                features: ["Perfil básico", "Búsqueda limitada"], 
                isActive: true 
              }} 
            />
            <PlanCard 
              plan={{ 
                name: "Plan Profesional", 
                price: 29990, 
                interval: "monthly", 
                features: ["Perfil completo", "Agenda online", "Pagos integrados"], 
                isActive: true 
              }} 
            />
            <PlanCard 
              plan={{ 
                name: "Plan Clínica", 
                price: 59990, 
                interval: "monthly", 
                features: ["Múltiples terapeutas", "Gestión de roles", "Reportes avanzados"], 
                isActive: false 
              }} 
            />
          </div>
    </div>
  );
};

export default MembershipPlansPage;