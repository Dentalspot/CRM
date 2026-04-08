import React from 'react';
import SubscriptionCard from '@/components/admin/SubscriptionCard';

const SubscriptionsPage = () => {
  return (
<div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SubscriptionCard 
              subscription={{ 
                user_name: "Juan Pérez", 
                plan_name: "Plan Profesional", 
                status: "active", 
                amount: 29990 
              }} 
            />
            <SubscriptionCard 
              subscription={{ 
                user_name: "María González", 
                plan_name: "Plan Básico", 
                status: "past_due", 
                amount: 0 
              }} 
            />
            {/* More cards would map here */}
          </div>
    </div>
  );
};

export default SubscriptionsPage;