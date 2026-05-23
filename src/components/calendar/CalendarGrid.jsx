import React from 'react';
import { cn } from '@/lib/utils';
import { format, isToday, addMinutes, setHours, setMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

const CalendarGrid = ({
  days,
  startHour = 8,
  endHour = 20,
  onSlotClick,
  checkAvailability,
  children
}) => {
  // Generate time slots (rows) based on dynamic start/end hours
  const timeSlots = [];
  // Ensure we don't crash if endHour <= startHour
  const safeStart = Math.min(startHour, endHour);
  const safeEnd = Math.max(startHour, endHour);
  
  for (let i = safeStart; i < safeEnd; i++) {
    timeSlots.push(i);
  }

  const handleCellClick = (day, hour) => {
    if (!onSlotClick) return;
    
    // Create a date object for the clicked slot
    const dateWithTime = setMinutes(setHours(day, hour), 0);
    
    onSlotClick({
      date: format(day, 'yyyy-MM-dd'),
      startTime: format(dateWithTime, 'HH:mm'),
      endTime: format(addMinutes(dateWithTime, 30), 'HH:mm'), // Default 30 min
      resourceId: null
    });
  };

  return (
    <div className="relative min-w-[800px] bg-white select-none">
      {/* Header */}
      <div className="grid grid-cols-8 border-b divide-x sticky top-0 bg-white z-30 shadow-sm">
        {/* Time Column Header */}
        <div className="p-2 border-b bg-gray-50/50"></div>
        
        {/* Day Headers */}
        {days.map((day) => (
          <div
            key={day.toString()}
            className={cn(
              "p-2 text-center transition-colors",
              isToday(day) ? "bg-blue-50/50" : "bg-gray-50/50"
            )}
          >
            <div className="text-xs font-semibold text-gray-500 uppercase">
              {format(day, 'EEE', { locale: es })}
            </div>
            <div className={cn(
              "text-lg font-bold w-8 h-8 flex items-center justify-center mx-auto rounded-full mt-1",
              isToday(day) ? "bg-blue-600 text-white shadow-sm" : "text-gray-900"
            )}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Grid Body */}
      <div className="relative">
        {timeSlots.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b divide-x min-h-[60px]">
            {/* Time Label */}
            <div className="p-2 text-xs font-medium text-gray-400 text-right sticky left-0 bg-white z-20 flex flex-col justify-between h-[60px]">
              <span className="-mt-2.5 bg-white px-1 relative z-10">{`${hour}:00`}</span>
            </div>

            {/* Day Cells */}
            {days.map((day) => {
              // Use the checkAvailability callback to determine status
              const isWorking = checkAvailability ? checkAvailability(day, hour) : true;
              
              // Only check adjacent cells if function exists
              const isWorkingPrev = checkAvailability ? checkAvailability(day, hour - 1) : false;
              const isWorkingNext = checkAvailability ? checkAvailability(day, hour + 1) : false;
              
              // Visual indicators for contiguous blocks
              const isStart = isWorking && !isWorkingPrev;
              const isEnd = isWorking && !isWorkingNext;

              return (
                <div
                  key={`${day}-${hour}`}
                  className={cn(
                    "relative group transition-all",
                    isWorking 
                      ? "bg-emerald-50/20 hover:bg-emerald-50/40" 
                      : "bg-slate-50/60 bg-[linear-gradient(45deg,rgba(0,0,0,0.02)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.02)_50%,rgba(0,0,0,0.02)_75%,transparent_75%,transparent)] bg-[length:10px_10px]",
                    isToday(day) && !isWorking && "bg-blue-50/5",
                    isToday(day) && isWorking && "bg-blue-50/20 hover:bg-blue-50/30"
                  )}
                  onClick={() => handleCellClick(day, hour)}
                >
                  {/* Subtle half-hour marker for guidance */}
                  {isWorking && (
                    <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-emerald-100/50 w-full pointer-events-none" />
                  )}
                  
                  {/* Start/End Indicators */}
                  {isStart && (
                    <div className="absolute top-0.5 left-1 z-10 pointer-events-none">
                      <span className="text-[9px] font-bold text-emerald-600/70 bg-emerald-100/50 px-1 py-0.5 rounded uppercase tracking-wider">
                        Inicio
                      </span>
                    </div>
                  )}
                  
                  {isEnd && (
                    <div className="absolute bottom-0.5 right-1 z-10 pointer-events-none">
                      <span className="text-[9px] font-bold text-emerald-600/70 bg-emerald-100/50 px-1 py-0.5 rounded uppercase tracking-wider">
                        Fin
                      </span>
                    </div>
                  )}

                  {/* Hover indicator - Only on working slots or if we want to allow overriding */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity pointer-events-none">
                    <span className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full shadow-sm",
                      isWorking ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"
                    )}>
                      {isWorking ? "+" : "Cerrado"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Render children (Appointments & Blocked Times) layered on top */}
        <div className="absolute inset-0 pointer-events-none grid grid-cols-8 divide-x left-0 right-0">
           {/* Spacer for time column */}
           <div></div> 
           {/* Columns for days to align events */}
           {days.map((day) => (
             <div key={`layer-${day}`} className="relative h-full">
               {/* Events will be rendered here by parent using Portals or just passed as children mapped by day */}
             </div>
           ))}
        </div>
        
        {/* Actual Events Layer */}
        {children}
      </div>
    </div>
  );
};

export default CalendarGrid;