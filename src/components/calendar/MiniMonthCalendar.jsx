import React, { useMemo } from 'react';
import { startOfWeek, endOfWeek, isWithinInterval, isSameDay, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { buildHolidaysMap } from '@/lib/chilean-holidays';

/**
 * @file src/components/calendar/MiniMonthCalendar.jsx
 *
 * Mini calendario mensual para navegación rápida en el sidebar de Mi
 * Agenda. Click en un día → la agenda principal salta a la semana de
 * ese día.
 *
 * Props:
 *  - currentWeek: Date (lunes de la semana visible en la agenda principal)
 *  - onWeekChange(newMondayDate): callback al click en un día
 *
 * Comportamiento:
 *  - Click día → onWeekChange con el lunes de esa semana
 *  - Día "hoy" destacado (estilo default de shadcn)
 *  - Toda la semana actualmente visible queda con fondo teal claro
 *  - Feriados chilenos en rosa + punto rojo + tooltip con el nombre
 *  - Navegación entre meses con flechas (lo maneja DayPicker)
 *  - Locale español
 */
const MiniMonthCalendar = ({ currentWeek, onWeekChange }) => {
  // Rango de la semana visible: lunes a domingo
  const weekRange = useMemo(() => ({
    start: startOfWeek(currentWeek, { weekStartsOn: 1 }),
    end: endOfWeek(currentWeek, { weekStartsOn: 1 }),
  }), [currentWeek]);

  // Map de feriados chilenos para los años cercanos a la semana actual.
  // Cubrimos year-1 .. year+1 para que la navegación adyacente entre
  // meses (Enero ↔ Diciembre) muestre feriados sin recalcular.
  const holidaysMap = useMemo(() => {
    const year = currentWeek.getFullYear();
    return buildHolidaysMap([year - 1, year, year + 1]);
  }, [currentWeek]);

  const getHolidayName = (date) => holidaysMap.get(format(date, 'yyyy-MM-dd')) || null;
  const isHoliday = (date) => holidaysMap.has(format(date, 'yyyy-MM-dd'));
  const isInVisibleWeek = (day) => isWithinInterval(day, weekRange);

  const handleSelect = (day) => {
    if (!day) return;
    // Saltar a la semana que contiene el día clickeado
    const newMonday = startOfWeek(day, { weekStartsOn: 1 });
    if (!isSameDay(newMonday, weekRange.start)) {
      onWeekChange?.(newMonday);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-0">
        <Calendar
          mode="single"
          selected={weekRange.start}
          onSelect={handleSelect}
          locale={es}
          weekStartsOn={1}
          modifiers={{
            visibleWeek: isInVisibleWeek,
            holiday: isHoliday,
          }}
          modifiersClassNames={{
            visibleWeek: 'bg-primary/15 text-primary font-medium',
            holiday: 'text-rose-600 font-semibold relative after:content-[""] after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-rose-500',
          }}
          className="p-2"
          classNames={{
            months: 'flex flex-col space-y-2',
            month: 'space-y-2',
            caption: 'flex justify-center pt-1 relative items-center',
            caption_label: 'text-xs font-medium capitalize',
            nav: 'space-x-1 flex items-center',
            nav_button: 'h-6 w-6 bg-transparent p-0 opacity-60 hover:opacity-100 inline-flex items-center justify-center rounded-md hover:bg-accent',
            nav_button_previous: 'absolute left-1',
            nav_button_next: 'absolute right-1',
            table: 'w-full border-collapse',
            head_row: 'flex',
            head_cell: 'text-muted-foreground rounded-md w-7 font-normal text-[0.65rem]',
            row: 'flex w-full mt-1',
            cell: 'h-7 w-7 text-center text-xs p-0 relative focus-within:relative focus-within:z-20',
            day: 'h-7 w-7 p-0 font-normal text-xs inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground aria-selected:opacity-100',
            day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
            day_today: 'bg-accent text-accent-foreground font-semibold',
            day_outside: 'text-muted-foreground opacity-40',
            day_disabled: 'text-muted-foreground opacity-50',
            day_hidden: 'invisible',
          }}
          components={{
            // Override IconLeft/Right porque al pasar `components` se
            // pierden los defaults del shadcn Calendar.
            IconLeft: () => <ChevronLeft className="h-3.5 w-3.5" />,
            IconRight: () => <ChevronRight className="h-3.5 w-3.5" />,
            // DayContent envuelve el número del día con un <span title>
            // para que el tooltip nativo del browser muestre el nombre
            // del feriado al hacer hover.
            DayContent: ({ date }) => {
              const name = getHolidayName(date);
              return (
                <span
                  title={name || undefined}
                  className="w-full h-full inline-flex items-center justify-center"
                >
                  {date.getDate()}
                </span>
              );
            },
          }}
        />
      </CardContent>
    </Card>
  );
};

export default MiniMonthCalendar;
