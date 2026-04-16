import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Phone, Mail } from 'lucide-react';

const ROLE_LABELS = {
  primary: 'Dentista principal',
  specialist: 'Especialista',
  consultant: 'Consultor',
};

const ROLE_COLORS = {
  primary: 'bg-teal-100 text-teal-700',
  specialist: 'bg-blue-100 text-blue-700',
  consultant: 'bg-gray-100 text-gray-600',
};

const MyCareTeam = ({ careTeam = [], loading }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Mi Equipo Tratante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-slate-100 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" /> Mi Equipo Tratante
        </CardTitle>
      </CardHeader>
      <CardContent>
        {careTeam.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aún no tienes un equipo tratante asignado.
          </p>
        ) : (
          <div className="space-y-3">
            {careTeam.map((member) => {
              const dentist = member.dentist;
              const branding = Array.isArray(dentist?.therapist_branding)
                ? dentist.therapist_branding[0]
                : dentist?.therapist_branding;
              const initials = (dentist?.full_name || '?')
                .split(' ')
                .map(w => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={branding?.avatar_url} alt={dentist?.full_name} />
                    <AvatarFallback className="bg-teal-100 text-teal-700 text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{dentist?.full_name || 'Profesional'}</p>
                      <Badge className={`text-[10px] ${ROLE_COLORS[member.role] || 'bg-gray-100'}`}>
                        {ROLE_LABELS[member.role] || member.role}
                      </Badge>
                    </div>
                    {member.specialty && (
                      <p className="text-xs text-muted-foreground">{member.specialty}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      {dentist?.phone && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {dentist.phone}
                        </span>
                      )}
                      {dentist?.email && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {dentist.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyCareTeam;
