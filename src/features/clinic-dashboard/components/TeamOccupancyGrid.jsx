import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Calendar, 
  UserPlus, 
  AlertTriangle,
  Clock 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ProfileAvatar from '@/components/shared/ProfileAvatar';

const getOccupancyConfig = (percent) => {
  if (percent >= 90) return { label: 'Sobrecargado', color: 'text-red-600', bg: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200' };
  if (percent >= 50) return { label: 'Óptimo', color: 'text-blue-600', bg: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (percent > 0) return { label: 'Disponible', color: 'text-green-600', bg: 'bg-green-500', badge: 'bg-green-50 text-green-700 border-green-200' };
  return { label: 'Sin carga', color: 'text-gray-400', bg: 'bg-gray-300', badge: 'bg-gray-50 text-gray-500 border-gray-200' };
};

const TeamOccupancyGrid = ({ 
  therapists = [], 
  onViewAgenda, 
  onAssignPatient,
  maxWeeklySlots = 20 
}) => {

  // ========== EMPTY STATE ==========
  if (therapists.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="border border-gray-100">
          <CardContent className="py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-gray-600 font-medium">
              Aún no tienes terapeutas en tu equipo.
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Cuando tus terapeutas empiecen a atender, aquí verás su carga de trabajo en tiempo real.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ========== RESUMEN DEL EQUIPO ==========
  const overloaded = therapists.filter(t => t.occupancyPercent >= 90).length;
  const optimal = therapists.filter(t => t.occupancyPercent >= 50 && t.occupancyPercent < 90).length;
  const available = therapists.filter(t => t.occupancyPercent > 0 && t.occupancyPercent < 50).length;
  const absent = therapists.filter(t => t.isAbsent).length;

  // ========== CON DATOS ==========
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card className="border border-gray-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-50 flex items-center justify-center">
                <Users className="h-4 w-4 text-teal-600" />
              </div>
              Ocupación del equipo
            </CardTitle>

            {/* Mini resumen */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
              {overloaded > 0 && (
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  {overloaded} sobrecargado{overloaded > 1 ? 's' : ''}
                </span>
              )}
              {optimal > 0 && (
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  {optimal} óptimo{optimal > 1 ? 's' : ''}
                </span>
              )}
              {available > 0 && (
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  {available} disponible{available > 1 ? 's' : ''}
                </span>
              )}
              {absent > 0 && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  {absent} ausente{absent > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2 pt-1">
          {therapists.map((therapist, index) => {
            const occupancy = therapist.occupancyPercent || 0;
            const config = therapist.isAbsent
              ? { label: 'Ausente', color: 'text-amber-600', bg: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200' }
              : getOccupancyConfig(occupancy);

            const name = therapist.name || therapist.profiles?.full_name || 'Terapeuta';
            const firstName = name.split(' ').slice(0, 2).join(' ');
            const freeSlots = therapist.freeSlots ?? Math.max(0, maxWeeklySlots - (therapist.weekSessions || 0));
            const nextTime = therapist.nextAppointmentTime || null;

            return (
              <div
                key={therapist.id || index}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
              >
                {/* Avatar */}
                <div className="h-9 w-9 rounded-full bg-teal-50 flex items-center justify-center overflow-hidden shrink-0">
                  <ProfileAvatar
                    profile={therapist.profiles || therapist}
                    src={therapist.profiles?.avatar_url || therapist.avatar_url}
                    alt={name}
                    className="h-9 w-9"
                  />
                </div>

                {/* Name + occupancy bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {firstName}
                    </span>
                    <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${config.badge}`}>
                      {therapist.isAbsent ? 'Ausente' : `${occupancy}%`}
                    </Badge>
                  </div>

                  {!therapist.isAbsent && (
                    <Progress value={occupancy} className="h-1.5" />
                  )}

                  {/* Meta info */}
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                    {!therapist.isAbsent && (
                      <>
                        <span>{freeSlots} cupo{freeSlots !== 1 ? 's' : ''} libre{freeSlots !== 1 ? 's' : ''}</span>
                        {nextTime && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />
                            Próx: {nextTime}
                          </span>
                        )}
                      </>
                    )}
                    {therapist.isAbsent && (
                      <span className="text-amber-500">Citas pendientes de reasignar</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[11px] text-gray-500 hover:text-teal-600 px-2"
                    onClick={() => onViewAgenda?.(therapist)}
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    Agenda
                  </Button>
                  {!therapist.isAbsent && freeSlots > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[11px] text-gray-500 hover:text-blue-600 px-2"
                      onClick={() => onAssignPatient?.(therapist)}
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Asignar
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TeamOccupancyGrid;