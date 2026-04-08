import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, startOfToday, addDays, parseISO, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, Clock, Calendar as CalendarIcon, Building } from 'lucide-react';

const AvailabilityCalendarModal = ({ open, onOpenChange, professional, availability, selectedClinicId }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const today = startOfToday();

  const availabilityMap = useMemo(() => {
    if (!availability?.allData) return new Map();
    const map = new Map();
    availability.allData.forEach(day => {
      const availableSlots = day.time_slots?.filter(slot => slot.available) || [];
      if (availableSlots.length > 0) {
        map.set(day.availability_date, availableSlots);
      }
    });
    return map;
  }, [availability]);

  const availableDates = useMemo(() => {
    return Array.from(availabilityMap.keys()).map(dateStr => parseISO(dateStr));
  }, [availabilityMap]);

  const selectedDaySlots = useMemo(() => {
    if (!selectedDate) return [];
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    return availabilityMap.get(dateString) || [];
  }, [selectedDate, availabilityMap]);

  const handleDateSelect = (date) => {
    if (date && availabilityMap.has(format(date, 'yyyy-MM-dd'))) {
      setSelectedDate(date);
    }
  };

  const handleBookSlot = (time) => {
    if (!selectedDate) return;
    const date = format(selectedDate, 'yyyy-MM-dd');
    const slug = professional.public_slug || professional.slug || professional.id || professional.therapist_id;
    let url = `/fonoaudiologo/${slug}/agendar?date=${date}&time=${time}`;
    if (selectedClinicId) {
      url += `&clinicId=${selectedClinicId}`;
    }
    navigate(url);
  };

  const presencialClinics = useMemo(() =>
    Array.isArray(professional.clinics)
      ? professional.clinics.filter(c => c.modality === 'presencial' && c.address)
      : [],
    [professional.clinics]
  );

  const getClinicName = () => {
    if (!selectedClinicId) return "Consulta Online";
    const clinic = presencialClinics.find(c => c.id === selectedClinicId);
    return clinic?.name || "Dirección";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900">{professional.full_name}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-md text-gray-600">
            <Building className="h-4 w-4" />
            {getClinicName()}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t">
          <div className="p-4 border-r">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              locale={es}
              fromDate={today}
              toDate={addDays(today, 30)}
              disabled={(date) => isBefore(date, today)}
              modifiers={{
                available: availableDates,
                selected: selectedDate,
              }}
              modifiersClassNames={{
                available: 'bg-primary/10 text-primary font-bold rounded-full',
                selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-full',
              }}
              className="p-0"
            />
          </div>
          <div className="p-6 bg-gray-50/50 flex flex-col">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              {selectedDate ? `Horarios para el ${format(selectedDate, 'eeee, d \'de\' MMMM', { locale: es })}` : 'Selecciona un día'}
            </h3>
            <ScrollArea className="flex-grow -mr-6 pr-6">
              {selectedDate ? (
                selectedDaySlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedDaySlots.map((slot, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="font-semibold"
                        onClick={() => handleBookSlot(slot.time)}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No hay horas disponibles para este día.</p>
                  </div>
                )
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">Selecciona un día con disponibilidad en el calendario.</p>
                  <Badge variant="secondary" className="mt-2">Los días disponibles están resaltados</Badge>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-5 w-5" />
          <span className="sr-only">Cerrar</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default AvailabilityCalendarModal;