import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const TimeSlotPicker = ({ availableSlots = [], onTimeSelect, selectedTime }) => {
  // Graceful fallback if array is empty or malformed
  if (!Array.isArray(availableSlots) || availableSlots.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground bg-muted/20 rounded-md">
        <p className="text-sm">No hay horarios disponibles para este día.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-auto max-h-[300px] w-full rounded-md border p-4">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {availableSlots.map((slot, index) => {
          // Handle both object with time property and primitive string
          // This prevents "Objects are not valid as a React child" errors
          const timeLabel = typeof slot === 'object' && slot !== null ? slot.time : slot;
          
          // Skip invalid slots
          if (!timeLabel || typeof timeLabel !== 'string') return null;

          const isSelected = selectedTime === timeLabel;

          return (
            <Button
              key={`${timeLabel}-${index}`}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "w-full text-sm font-medium transition-all",
                isSelected 
                  ? "bg-primary text-primary-foreground shadow-md scale-105" 
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={() => onTimeSelect(slot)}
            >
              {timeLabel}
            </Button>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default TimeSlotPicker;