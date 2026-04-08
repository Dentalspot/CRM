import React from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, Stethoscope, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SegmentRow = ({ icon: Icon, label, count, color }) => (
  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className="text-sm font-medium">{label}</span>
    </div>
    <span className="text-sm font-bold">{count}</span>
  </div>
);

const SubscribersPanel = ({ stats = {}, loading = false }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base flex items-center gap-2">
        <Users className="h-4 w-4 text-blue-500" />
        Audiencia
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
      ) : (
        <>
          <SegmentRow icon={Users} label="Total Contactos" count={stats.totalSubscribers ?? 0} color="text-blue-500" />
          <SegmentRow icon={Stethoscope} label="Odontologos" count={stats.therapists ?? 0} color="text-green-500" />
          <SegmentRow icon={UserCheck} label="Pacientes" count={stats.patients ?? 0} color="text-purple-500" />
        </>
      )}
      <Button variant="outline" size="sm" className="w-full" asChild>
        <Link to="/admin/marketing/audience">Gestionar Audiencia <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
      </Button>
    </CardContent>
  </Card>
);

export default SubscribersPanel;
