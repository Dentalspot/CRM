import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  Star, 
  DollarSign, 
  MoreVertical, 
  Eye, 
  Pencil, 
  Trash2,
  Phone,
  Mail
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TherapistStatsCard = ({ 
  therapist, 
  onViewProfile, 
  onEdit, 
  onRemove 
}) => {
  if (!therapist) return null;

  const { 
    is_active = true,
    profiles = {}, 
    stats = {}
  } = therapist;

  const { 
    full_name = 'Terapeuta', 
    email = '', 
    phone = '',
    avatar_url = ''
  } = profiles || {};

  const { 
    patients = 0, 
    sessions = 0, 
    revenue = 0,
    rating = 0
  } = stats;

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-all duration-200 border-l-4 border-l-transparent hover:border-l-primary group">
      <CardHeader className="p-4 pb-2 flex-row gap-4 space-y-0">
        <Avatar className="h-14 w-14 border-2 border-white shadow-sm shrink-0">
          <AvatarImage src={avatar_url} alt={full_name} className="object-cover" />
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
            {full_name ? full_name.slice(0, 2).toUpperCase() : 'TE'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="pr-2 min-w-0 flex-1">
              <CardTitle className="text-base font-bold text-gray-900 truncate leading-tight mb-0.5" title={full_name}>
                {full_name}
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Badge 
                  variant={is_active ? "secondary" : "destructive"} 
                  className={`px-1.5 py-0 h-4 font-normal text-[10px] ${is_active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                >
                  {is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2 text-gray-400 hover:text-gray-600 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onViewProfile && onViewProfile(therapist)}>
                  <Eye className="h-4 w-4 mr-2" /> Ver perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit && onEdit(therapist)}>
                  <Pencil className="h-4 w-4 mr-2" /> Editar permisos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-600"
                  onClick={() => onRemove && onRemove(therapist)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> 
                  {is_active ? 'Desactivar' : 'Eliminar'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex flex-col gap-0.5 mt-1">
             <div className="flex items-center text-xs text-gray-500 truncate">
                <Mail className="h-3 w-3 mr-1.5 shrink-0 opacity-70" />
                <span className="truncate" title={email}>{email}</span>
             </div>
             {phone && (
               <div className="flex items-center text-xs text-gray-500 truncate">
                  <Phone className="h-3 w-3 mr-1.5 shrink-0 opacity-70" />
                  <span className="truncate">{phone}</span>
               </div>
             )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1">
        <div className="grid grid-cols-2 gap-3 h-full">
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex flex-col justify-center items-center text-center transition-colors group-hover:bg-slate-100/50">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 flex items-center">
              <Users className="w-3 h-3 mr-1" /> Pacientes
            </span>
            <span className="text-lg font-bold text-slate-700">{patients}</span>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex flex-col justify-center items-center text-center transition-colors group-hover:bg-slate-100/50">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 flex items-center">
              <Calendar className="w-3 h-3 mr-1" /> Sesiones
            </span>
            <span className="text-lg font-bold text-slate-700">{sessions}</span>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex flex-col justify-center items-center text-center transition-colors group-hover:bg-slate-100/50">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 flex items-center">
              <DollarSign className="w-3 h-3 mr-1" /> Ingresos
            </span>
            <span className="text-lg font-bold text-slate-700 truncate max-w-full px-1">
              ${revenue >= 1000000 ? `${(revenue/1000000).toFixed(1)}M` : revenue >= 1000 ? `${(revenue/1000).toFixed(0)}k` : revenue}
            </span>
          </div>
          
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex flex-col justify-center items-center text-center transition-colors group-hover:bg-slate-100/50">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 flex items-center">
              <Star className="w-3 h-3 mr-1" /> Calif.
            </span>
            <span className="text-lg font-bold text-slate-700">{rating > 0 ? rating.toFixed(1) : '-'}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 bg-gray-50/50 border-t flex gap-2">
        <Button 
          className="flex-1 h-8 text-xs bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-primary hover:border-primary/30 shadow-sm" 
          variant="outline"
          onClick={() => onViewProfile && onViewProfile(therapist)}
        >
          <Eye className="w-3.5 h-3.5 mr-1.5" />
          Ver Detalles
        </Button>
        <Button 
          className="flex-1 h-8 text-xs shadow-sm" 
          variant="default"
          onClick={() => onEdit && onEdit(therapist)}
        >
          <Pencil className="w-3.5 h-3.5 mr-1.5" />
          Editar
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TherapistStatsCard;