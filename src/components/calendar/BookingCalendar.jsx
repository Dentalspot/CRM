import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, CalendarDays, Loader2, MapPin, Video, DollarSign } from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  set,
  parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';
import TimeSlotPicker from './TimeSlotPicker';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getTherapistAvailability, fetchTherapistFullProfile } from '@/features/therapist/services/therapist.api';
import { supabase } from '@/lib/supabaseClient';
import { Skeleton } from '@/components/ui/skeleton';
import BookingDialog from './BookingDialog';
import logger from '@/lib/utils/logger';

function startOfTodayLocal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

const BookingCalendar = ({ therapistId, clinicId, isFullView = false }) => {
  const { toast } = useToast();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthKey = useMemo(() => format(currentMonth, 'yyyy-MM'), [currentMonth]);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedSlotData, setSelectedSlotData] = useState(null);

  const [availability, setAvailability] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState({});

  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);

  const [clinicInfo, setClinicInfo] = useState(null);
  const [therapistProfile, setTherapistProfile] = useState(null);
  const [therapistService, setTherapistService] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Fetch basic info about clinic and therapist
  useEffect(() => {
    const fetchInfo = async () => {
      if (!therapistId) return;
      setLoadingInfo(true);
      try {
        // 1. Therapist Profile
        const profileData = await fetchTherapistFullProfile(therapistId);
        setTherapistProfile(profileData);

        // 2. Clinic Info
        if (clinicId) {
          const { data: cData } = await supabase
            .from('clinics')
            .select('id, name, address, modality')
            .eq('id', clinicId)
            .single();
          setClinicInfo(cData);
        } else {
          setClinicInfo({ modality: 'online', name: 'Consulta Online' });
        }

        // 3. Primary Service (to show price/duration)
        const { data: sData } = await supabase
          .from('therapist_services')
          .select('id, service_name, price_clp, duration_minutes')
          .eq('therapist_id', therapistId)
          .eq('is_active', true)
          .order('price_clp', { ascending: true })
          .limit(1)
          .maybeSingle();
        setTherapistService(sData);

      } catch (error) {
        logger.error('Error loading calendar info:', error);
      } finally {
        if (isMountedRef.current) setLoadingInfo(false);
      }
    };

    fetchInfo();
  }, [therapistId, clinicId]);

  // Reset state when props change
  useEffect(() => {
    setAvailability({});
    setHasFetched({});
    setSelectedDate(null);
    setSelectedTime(null);
    setIsLoading(true);
    isFetchingRef.current = false; 
  }, [therapistId, clinicId]);

  const fetchAvailability = useCallback(
    async (monthToFetch) => {
      if (!therapistId) return;
      
      const thisMonthKey = format(monthToFetch, 'yyyy-MM');
      if (hasFetched[thisMonthKey] && availability) return;
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      if (isMountedRef.current) setIsLoading(true);

      try {
        const monthStart = startOfMonth(monthToFetch);
        // Fetch 45 days to cover overlapping weeks
        const data = await getTherapistAvailability(
          therapistId,
          clinicId,
          format(monthStart, 'yyyy-MM-dd'),
          45 
        );

        const list = Array.isArray(data) ? data : [];
        const availabilityMap = list.reduce((acc, day) => {
          if (day && day.availability_date) {
            const slots = Array.isArray(day.time_slots) ? day.time_slots : [];
            // Filter available only
            acc[day.availability_date] = slots.filter(slot => slot.available);
          }
          return acc;
        }, {});

        if (!isMountedRef.current) return;

        setAvailability((prev) => ({ ...prev, ...availabilityMap }));
        setHasFetched((prev) => ({ ...prev, [thisMonthKey]: true }));

      } catch (error) {
        logger.error('Availability fetch error:', error);
        if (!isMountedRef.current) return;
        toast({
          variant: 'destructive',
          title: 'Error de conexión',
          description: 'No se pudo cargar la disponibilidad.',
        });
      } finally {
        isFetchingRef.current = false;
        if (isMountedRef.current) setIsLoading(false);
      }
    },
    [therapistId, clinicId, hasFetched, toast, availability] 
  );

  useEffect(() => {
    fetchAvailability(currentMonth);
  }, [fetchAvailability, currentMonth]);

  const handleMonthChange = (newMonth) => {
    setCurrentMonth(newMonth);
  };

  const handleDateClick = (day) => {
    if (isBefore(day, startOfTodayLocal()) && !isToday(day)) return;
    
    const dateString = format(day, 'yyyy-MM-dd');
    const slots = availability[dateString] || [];
    
    if (slots.length === 0) {
       toast({
        variant: 'default',
        title: 'Sin cupos',
        description: 'No hay horas disponibles para este día.',
      });
      return;
    }

    setSelectedDate(day);
    setSelectedTime(null);
    setSelectedSlotData(null);
  };

  const handleTimeSelect = (slot) => {
    const timeValue = typeof slot === 'object' && slot !== null ? slot.time : slot;
    if (!timeValue) return;

    // Prepare data for the dialog
    const slotData = typeof slot === 'object' ? slot : { time: timeValue };
    
    // Add context info to slot data for the dialog
    const fullSlotData = {
      ...slotData,
      clinicId: clinicId,
      clinicName: clinicInfo?.name,
      isOnline: clinicInfo?.modality === 'online',
      serviceId: therapistService?.id,
      serviceName: therapistService?.service_name,
      duration: therapistService?.duration_minutes
    };

    setSelectedTime(timeValue);
    setSelectedSlotData(fullSlotData);
    setIsBookingDialogOpen(true);
  };

  const handleBookingSuccess = () => {
    // Reset selection
    setSelectedDate(null);
    setSelectedTime(null);
    
    // Force refresh availability
    setHasFetched({}); // Clear cache
    fetchAvailability(currentMonth); // Refetch
  };

  // Rendering Helpers
  const renderDays = () => {
    const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return (
      <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground">
        {daysOfWeek.map((day) => <div key={day} className="py-2">{day}</div>)}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateString = format(day, 'yyyy-MM-dd');
          const dayAvailability = availability[dateString] || [];
          const hasAvailableSlots = dayAvailability.length > 0;
          const inCurrentMonth = isSameMonth(day, currentMonth);
          const isSel = selectedDate && isSameDay(day, selectedDate);
          const isTod = isToday(day);
          const isPast = isBefore(day, startOfTodayLocal()) && !isTod;

          return (
            <motion.div
              key={dateString}
              whileHover={{ scale: inCurrentMonth && !isPast && hasAvailableSlots ? 1.05 : 1 }}
              whileTap={{ scale: inCurrentMonth && !isPast && hasAvailableSlots ? 0.95 : 1 }}
            >
              <Button
                variant={isSel ? 'default' : isTod ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full h-12 p-0 flex flex-col items-center justify-center rounded-md transition-all duration-150 ease-in-out relative',
                  !inCurrentMonth && 'text-muted-foreground/50 opacity-50 cursor-not-allowed',
                  isPast && 'text-muted-foreground/50 cursor-not-allowed bg-muted/30 line-through',
                  isSel && 'ring-2 ring-primary ring-offset-2',
                  isTod && !isSel && 'border border-primary/50',
                  !hasAvailableSlots && inCurrentMonth && !isPast && 'text-muted-foreground/70'
                )}
                onClick={() => inCurrentMonth && !isPast && handleDateClick(day)}
                disabled={!inCurrentMonth || isPast}
                aria-label={format(day, 'PPP', { locale: es })}
              >
                <span className="text-sm font-medium">{format(day, 'd')}</span>
                {hasAvailableSlots && !isPast && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 bg-green-500 rounded-full" />
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const availableSlotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    return availability[dateString] || [];
  }, [selectedDate, availability]);

  return (
    <Card className={cn('w-full mx-auto shadow-xl', isFullView ? 'max-w-4xl' : 'max-w-2xl')}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <CalendarDays className="h-7 w-7 text-primary" />
          Reserva de Horas
        </CardTitle>

        {loadingInfo ? (
          <Skeleton className="h-24 w-full mt-4" />
        ) : (clinicInfo || therapistService) && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            {clinicInfo && (
              <div className="flex items-start gap-3">
                {clinicInfo.modality === 'online' ? (
                  <Video className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900">{clinicInfo.name}</h4>
                  {clinicInfo.address && (
                    <p className="text-sm text-blue-700 mt-1">{clinicInfo.address}</p>
                  )}
                  <Badge variant="outline" className="mt-2 bg-white capitalize">
                    {clinicInfo.modality === 'online' ? '💻 Consulta Online' : `🏥 Consulta ${clinicInfo.modality}`}
                  </Badge>
                </div>
              </div>
            )}
            {therapistService && (
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-blue-200">
                <DollarSign className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{therapistService.service_name}</h4>
                  <p className="text-sm text-gray-600">
                    Duración: {therapistService.duration_minutes} min.
                    {' | '}
                    Precio: ${therapistService.price_clp?.toLocaleString('es-CL') || 'N/A'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center py-2 px-1">
            <Button variant="outline" size="icon" onClick={() => handleMonthChange(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold text-primary capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h2>
            <Button variant="outline" size="icon" onClick={() => handleMonthChange(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          
          {renderDays()}
          
          {isLoading && Object.keys(availability).length === 0 ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            renderCells()
          )}
        </div>

        <AnimatePresence>
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 p-4 border-t border-border"
            >
              <h3 className="text-lg font-semibold mb-3 text-center text-foreground">
                Horarios para {format(selectedDate, 'PPP', { locale: es })}:
              </h3>
              {availableSlotsForSelectedDate.length > 0 ? (
                <TimeSlotPicker
                  availableSlots={availableSlotsForSelectedDate}
                  onTimeSelect={handleTimeSelect}
                  selectedTime={selectedTime}
                />
              ) : (
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground font-medium">No hay horarios disponibles</p>
                  <p className="text-xs text-muted-foreground/80 mt-1">Intenta con otra fecha.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      <BookingDialog 
        isOpen={isBookingDialogOpen}
        onOpenChange={setIsBookingDialogOpen}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        selectedSlotData={selectedSlotData}
        professionalInfo={therapistProfile}
        onSuccess={handleBookingSuccess}
      />
    </Card>
  );
};

export default React.memo(BookingCalendar);