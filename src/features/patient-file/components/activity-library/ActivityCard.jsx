import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock, Box, CheckCircle2, Star, StarOff, Target, Pencil, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DIFFICULTY_LEVELS } from '@/lib/constants/enums';
import { DIFFICULTY_BADGE_STYLES } from '@/lib/constants/config';
import { normalizeDifficulty } from '@/lib/utils/normalizers';

const ActivityCard = ({
  activity,
  isSelected,
  isFavorite,
  isOwn,
  isFromPlan,
  onToggle,
  onToggleFavorite,
  onEdit,
  onDelete
}) => {
  const difficultyKey = normalizeDifficulty(activity.difficulty);
  const difficultyStyle = DIFFICULTY_BADGE_STYLES[difficultyKey] || DIFFICULTY_BADGE_STYLES[DIFFICULTY_LEVELS.ADECUADO];

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2 p-4 rounded-xl border transition-all cursor-pointer bg-white hover:shadow-md",
        isSelected
          ? "border-teal-500 ring-1 ring-teal-500 bg-teal-50/30"
          : "border-gray-200 hover:border-teal-200"
      )}
      onClick={() => onToggle(activity)}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "font-medium text-sm",
            isSelected ? "text-teal-900" : "text-gray-900"
          )}>
            {activity.name}
          </h4>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {(activity.default_duration_minutes || activity.duration_minutes) && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                <Clock className="h-3 w-3 mr-1" />
                {activity.default_duration_minutes || activity.duration_minutes} min
              </Badge>
            )}

            <Badge className={cn("h-5 px-1.5 text-[10px] font-normal border", difficultyStyle.color)}>
              {difficultyStyle.label}
            </Badge>

            {isFromPlan && (
              <Badge className="h-5 px-1.5 text-[10px] font-normal bg-blue-100 text-blue-700 border-blue-200">
                <Target className="h-3 w-3 mr-1" />
                Del Plan
              </Badge>
            )}
            {isOwn && !isFromPlan && (
              <Badge className="h-5 px-1.5 text-[10px] font-normal bg-purple-100 text-purple-700 border-purple-200">
                Personal
              </Badge>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {isOwn && !isFromPlan && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => onEdit(activity, e)}
                title="Editar actividad"
              >
                <Pencil className="h-4 w-4 text-gray-400 hover:text-teal-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => onDelete(activity.id, e)}
                title="Eliminar actividad"
              >
                <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
              </Button>
            </>
          )}

          {!isFromPlan && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => onToggleFavorite(activity.id, e)}
            >
              {isFavorite ? (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ) : (
                <StarOff className="h-4 w-4 text-gray-300 hover:text-yellow-400" />
              )}
            </Button>
          )}

          <div className={cn(
            "h-5 w-5 rounded-full border flex items-center justify-center transition-colors",
            isSelected
              ? "bg-teal-600 border-teal-600"
              : "border-gray-300 group-hover:border-teal-400"
          )}>
            {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
          </div>
        </div>
      </div>

      {(activity.description || activity.materials) && (
        <div className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
          {activity.description}
          {activity.materials && (
            <span className="block mt-1 text-gray-400 italic">
              <Box className="inline h-3 w-3 mr-1" />
              {activity.materials}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityCard;
