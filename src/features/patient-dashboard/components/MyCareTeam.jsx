import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Phone, Mail } from 'lucide-react';

const ROLE_LABELS = {
  primary: 'Principal',
  specialist: 'Especialista',
  consultant: 'Consultor',
};

const ROLE_COLORS = {
  primary: 'bg-teal-100 text-teal-700',
  specialist: 'bg-blue-100 text-blue-700',
  consultant: 'bg-gray-100 text-gray-600',
};

// Formato CL: 56976163232 -> +56 9 7616 3232
const formatPhone = (phone) => {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('56')) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 9) {
    return `+56 ${digits.slice(0, 1)} ${digits.slice(1, 5)} ${digits.slice(5)}`;
  }
  return phone;
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
                <div key={member.id} className="flex gap-3 p-3 rounded-lg bg-slate-50 border">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={branding?.avatar_url} alt={dentist?.full_name} />
                    <AvatarFallback className="bg-teal-100 text-teal-700 text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Nombre + Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className="text-sm font-semibold truncate flex-1"
                        title={dentist?.full_name || 'Profesional'}
                      >
                        {dentist?.full_name || 'Profesional'}
                      </p>
                      <Badge
                        className={`text-[10px] py-0 px-1.5 h-4 shrink-0 font-normal ${ROLE_COLORS[member.role] || 'bg-gray-100'}`}
                      >
                        {ROLE_LABELS[member.role] || member.role}
                      </Badge>
                    </div>

                    {member.specialty && (
                      <p className="text-xs text-muted-foreground truncate" title={member.specialty}>
                        {member.specialty}
                      </p>
                    )}

                    {/* Contacto */}
                    {dentist?.phone && (
                      <div
                        className="text-xs text-muted-foreground flex items-center gap-1.5 truncate"
                        title={dentist.phone}
                      >
                        <Phone className="h-3 w-3 shrink-0" />
                        <span className="truncate">{formatPhone(dentist.phone)}</span>
                      </div>
                    )}
                    {dentist?.email && (
                      <div
                        className="text-xs text-muted-foreground flex items-center gap-1.5 truncate"
                        title={dentist.email}
                      >
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{dentist.email}</span>
                      </div>
                    )}
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
