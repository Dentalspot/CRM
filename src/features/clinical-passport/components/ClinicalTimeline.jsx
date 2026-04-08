import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText } from 'lucide-react';
import { EVENT_TYPES } from '../constants/timelineConfig';
import TimelineEventCard from './TimelineEventCard';

const ClinicalTimeline = ({ grouped, loading, filter, setFilter, totalEvents, onEventClick }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(EVENT_TYPES).map(([key, cfg]) => {
          const Icon = cfg.icon;
          const isActive = filter === key;
          return (
            <Button
              key={key}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              className={`text-xs h-7 gap-1 ${isActive ? 'bg-teal-600 hover:bg-teal-700' : ''}`}
              onClick={() => setFilter(isActive ? 'all' : key)}
            >
              <Icon className="h-3 w-3" /> {cfg.label}
            </Button>
          );
        })}
      </div>

      {/* Timeline */}
      {grouped.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">Sin registros clínicos</p>
          <p className="text-sm text-gray-400 mt-1">
            Los eventos aparecerán aquí cuando haya sesiones, diagnósticos o planes registrados.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.key}>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="bg-white text-gray-600 border-gray-200 text-xs capitalize">
                  {group.label}
                </Badge>
                <span className="text-[11px] text-gray-300">{group.events.length} evento{group.events.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="pl-1">
                {group.events.map(event => (
                  <TimelineEventCard key={event.id} event={event} onClick={onEventClick} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClinicalTimeline;