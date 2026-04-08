import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, UserMinus, Activity } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, className }) => (
  <Card className={className}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">
        {trend}
      </p>
    </CardContent>
  </Card>
);

const PatientStats = ({ stats }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Pacientes"
        value={stats?.total || 0}
        icon={Users}
        trend="+20.1% desde el mes pasado"
      />
      <StatCard
        title="Nuevos (Mes)"
        value={stats?.newThisMonth || 0}
        icon={UserPlus}
        trend="+15% comparado mes anterior"
      />
      <StatCard
        title="Activos"
        value={stats?.active || 0}
        icon={Activity}
        trend="85% del total"
      />
      <StatCard
        title="Inactivos / Alta"
        value={stats?.inactive || 0}
        icon={UserMinus}
        trend="4% tasa de abandono"
      />
    </div>
  );
};

export default PatientStats;