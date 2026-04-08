import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CalendarHeader = ({ currentMonth, onPreviousMonth, onNextMonth }) => {
  return (
    <div className="flex justify-between items-center py-2 px-1">
      <Button variant="outline" size="icon" onClick={onPreviousMonth}>
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <h2 className="text-xl font-semibold text-primary">
        {format(currentMonth, 'MMMM yyyy', { locale: es })}
      </h2>
      <Button variant="outline" size="icon" onClick={onNextMonth}>
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default CalendarHeader;