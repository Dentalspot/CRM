import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { format, subMonths, isSameMonth, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import logger from '@/lib/utils/logger';
import { getClinicDiscount, calculateDiscountedPrice, CLINIC_DISCOUNT_TIERS, PLAN_PRICING, PLAN_NAMES } from '@/constants/planFeatures';

const useClinicDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // Data states
  const [metrics, setMetrics] = useState({
    totalTherapists: 0,
    activePatients: 0,
    totalSessions: 0,
    revenue: 0,
    revenueChange: 0
  });
  const [therapists, setTherapists] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [clinicInfo, setClinicInfo] = useState(null);
  const [appointments, setAppointments] = useState([]);

  const { weekStart, weekEnd } = useMemo(() => {
    const now = new Date();
    return {
      weekStart: startOfWeek(now, { weekStartsOn: 1 }),
      weekEnd: endOfWeek(now, { weekStartsOn: 1 })
    };
  }, []);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal States
  const [isTherapistModalOpen, setIsTherapistModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateClinicModalOpen, setIsCreateClinicModalOpen] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [therapistToRemove, setTherapistToRemove] = useState(null);

  // Main Tabs State
  const [activeTab, setActiveTab] = useState('team');

  const fetchClinicData = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) return;

      // 1. Get Clinic owned by user
      const { data: myClinic, error: clinicError } = await supabase
        .from('clinics')
        .select('id, name')
        .eq('therapist_id', user.id)
        .limit(1)
        .maybeSingle();

      if (clinicError) throw clinicError;

      setClinicInfo(myClinic || null);

      let clinicTherapists = [];
      let appointments = [];
      let marketplaceItems = [];

      if (myClinic) {
        // 2. Get Therapists associated with this clinic
        try {
          const { data: ctData, error: ctError } = await supabase
            .from('clinic_therapists')
            .select(`
              id,
              therapist_id,
              is_active,
              joined_at,
              profiles:therapist_id (
                id,
                full_name,
                email,
                phone,
                rut
              )
            `)
            .eq('clinic_id', myClinic.id);

          if (ctError) logger.warn('Clinic therapists query error:', ctError);
          clinicTherapists = ctData || [];
        } catch (ctErr) {
          logger.warn('Clinic therapists fetch failed:', ctErr);
        }

        // 3. Get Appointments (Sessions) for this clinic
        try {
          const { data: appData, error: appError } = await supabase
            .from('appointments')
            .select('id, date, status, patient_id, therapist_id, service_id, created_at')
            .eq('clinic_id', myClinic.id)
            .order('date', { ascending: false });

          if (appError) logger.warn('Appointments query error:', appError);
          appointments = appData || [];

          // Fetch service prices separately to avoid FK ambiguity
          const serviceIds = [...new Set(appointments.filter(a => a.service_id).map(a => a.service_id))];
          if (serviceIds.length > 0) {
            const { data: servicesData } = await supabase
              .from('therapist_services')
              .select('id, price_clp')
              .in('id', serviceIds);
            if (servicesData) {
              const priceMap = Object.fromEntries(servicesData.map(s => [s.id, s.price_clp]));
              appointments = appointments.map(a => ({
                ...a,
                services: a.service_id ? { price_clp: priceMap[a.service_id] || 0 } : null
              }));
            }
          }
        } catch (appErr) {
          logger.warn('Appointments fetch failed:', appErr);
        }

        // 4. Get Marketplace Items
        const therapistIds = clinicTherapists.map(ct => ct.therapist_id);
        if (therapistIds.length > 0) {
          const { data: items, error: mpError } = await supabase
            .from('marketplace_items')
            .select('id, title, created_at, seller_id, is_active')
            .in('seller_id', therapistIds)
            .order('created_at', { ascending: false })
            .limit(10);

          if (!mpError) marketplaceItems = items || [];
        }
      }

      // --- PROCESSING DATA ---
      const totalTherapists = clinicTherapists.length;
      const uniquePatients = new Set(appointments.map(a => a.patient_id));
      const activePatients = uniquePatients.size;
      const completedAppointments = appointments.filter(a => a.status === 'completed');
      const totalSessions = completedAppointments.length;

      let totalRevenue = 0;
      let lastMonthRevenue = 0;
      const prevMonth = subMonths(new Date(), 1);

      appointments.forEach(app => {
        if (app.status === 'completed') {
          const price = app.services?.price_clp || 0;
          totalRevenue += Number(price);

          const appDate = new Date(app.date);
          if (isSameMonth(appDate, prevMonth)) {
            lastMonthRevenue += Number(price);
          }
        }
      });

      const revenueChange = lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      // Week calculations
      const thisWeekApps = appointments.filter(a => {
        const d = new Date(a.date);
        return d >= weekStart && d <= weekEnd && a.status !== 'cancelled';
      });
      const completedThisWeek = thisWeekApps.filter(a => a.status === 'completed').length;
      const scheduledThisWeek = thisWeekApps.filter(a => a.status === 'scheduled').length;
      const cancelledThisWeek = appointments.filter(a => {
        const d = new Date(a.date);
        return d >= weekStart && d <= weekEnd && a.status === 'cancelled';
      }).length;
      const noShowThisWeek = appointments.filter(a => {
        const d = new Date(a.date);
        return d >= weekStart && d <= weekEnd && a.status === 'no_show';
      }).length;

      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      const recentApps = appointments.filter(a => new Date(a.date) >= last30Days);
      const noShowRate = recentApps.length > 0
        ? ((recentApps.filter(a => a.status === 'no_show').length / recentApps.length) * 100).toFixed(1)
        : 0;

      setAppointments(appointments);
      setMetrics({
        totalTherapists,
        activePatients,
        totalSessions,
        revenue: totalRevenue,
        revenueChange: revenueChange.toFixed(1),
        completedThisWeek,
        scheduledThisWeek,
        cancelledThisWeek,
        noShowThisWeek,
        noShowRate,
      });

      const therapistsWithStats = clinicTherapists.map(ct => {
        const therapistApps = appointments.filter(a => a.therapist_id === ct.therapist_id);
        const therapistCompleted = therapistApps.filter(a => a.status === 'completed');
        const tRevenue = therapistCompleted.reduce((sum, a) => {
          const p = a.services?.price_clp || 0;
          return sum + Number(p);
        }, 0);
        const tPatients = new Set(therapistApps.map(a => a.patient_id)).size;

        return {
          ...ct,
          stats: {
            sessions: therapistCompleted.length,
            revenue: tRevenue,
            patients: tPatients,
            rating: 0
          }
        };
      });
      setTherapists(therapistsWithStats);

      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = subMonths(new Date(), 5 - i);
        return {
          label: format(d, 'MMM', { locale: es }),
          monthKey: format(d, 'yyyy-MM'),
          value: 0
        };
      });

      appointments.forEach(app => {
        if (app.status === 'completed') {
          const key = format(new Date(app.date), 'yyyy-MM');
          const monthData = last6Months.find(m => m.monthKey === key);
          if (monthData) monthData.value += 1;
        }
      });
      setPerformanceData(last6Months);

      const combinedActivity = [
        ...appointments.slice(0, 5).map(a => ({
          type: 'appointment',
          date: new Date(a.created_at || a.date),
          details: a,
          description: `Nueva cita agendada`
        })),
        ...marketplaceItems.map(i => ({
          type: 'marketplace',
          date: new Date(i.created_at),
          details: i,
          description: `Nuevo recurso publicado: ${i.title}`
        }))
      ].sort((a, b) => b.date - a.date).slice(0, 10);

      setRecentActivity(combinedActivity);

    } catch (error) {
      logger.error("Error fetching clinic dashboard data:", error);
      // Only show toast for critical errors (clinic fetch), not for secondary query failures
      if (!clinicInfo) {
        toast({
          variant: "destructive",
          title: "Error de carga",
          description: error?.message || "No se pudieron cargar los datos del panel de la clínica."
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchClinicData();
  }, [fetchClinicData]);

  const filteredTherapists = useMemo(() => {
    return therapists.filter(t => {
      const nameMatch = t.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        t.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const statusMatch = statusFilter === 'all'
        ? true
        : statusFilter === 'active'
          ? t.is_active
          : !t.is_active;

      return nameMatch && statusMatch;
    });
  }, [therapists, searchTerm, statusFilter]);

  // Discount computed data
  const discountData = useMemo(() => {
    if (!clinicInfo) return null;
    const therapistCount = therapists?.length || 0;
    const currentDiscount = getClinicDiscount(therapistCount);
    const basePrice = PLAN_PRICING[PLAN_NAMES.INDIVIDUAL]?.priceCLP || 25778;
    const discountedPrice = calculateDiscountedPrice(basePrice, therapistCount);
    const monthlySavings = (basePrice - discountedPrice) * therapistCount;
    const nextTier = CLINIC_DISCOUNT_TIERS.find(t => t.minTherapists > therapistCount);

    return {
      therapistCount,
      currentDiscount,
      basePrice,
      discountedPrice,
      monthlySavings,
      nextTier
    };
  }, [clinicInfo, therapists]);

  // Handlers
  const handleOpenInvite = () => {
    if (!clinicInfo) {
      setIsCreateClinicModalOpen(true);
      return;
    }
    setIsInviteModalOpen(true);
  };

  const handleOpenAddTherapist = () => {
    if (!clinicInfo) {
      setIsCreateClinicModalOpen(true);
      return;
    }
    setSelectedTherapist(null);
    setIsTherapistModalOpen(true);
  };

  const handleEditTherapist = (therapist) => {
    setSelectedTherapist(therapist);
    setIsTherapistModalOpen(true);
  };

  const handleRemoveTherapist = (therapist) => {
    setTherapistToRemove(therapist);
    setIsRemoveDialogOpen(true);
  };

  const confirmRemoveTherapist = async () => {
    if (!therapistToRemove) return;
    try {
      const { error } = await supabase
        .from('clinic_therapists')
        .update({ is_active: false })
        .eq('id', therapistToRemove.id);

      if (error) throw error;
      toast({ title: "Terapeuta desactivado", description: "El terapeuta ha sido marcado como inactivo." });
      setIsRemoveDialogOpen(false);
      setTherapistToRemove(null);
      fetchClinicData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleViewProfile = (therapist) => {
    toast({ title: "Perfil de Terapeuta", description: `Viendo perfil de ${therapist.profiles?.full_name}` });
  };

  const handleClinicCreated = () => {
    fetchClinicData();
  };

  return {
    // Data
    loading,
    metrics,
    therapists,
    recentActivity,
    performanceData,
    clinicInfo,
    appointments,
    weekStart,
    weekEnd,
    filteredTherapists,
    discountData,
    // Filter state
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    // Modal state
    isTherapistModalOpen, setIsTherapistModalOpen,
    isInviteModalOpen, setIsInviteModalOpen,
    isCreateClinicModalOpen, setIsCreateClinicModalOpen,
    selectedTherapist,
    isRemoveDialogOpen, setIsRemoveDialogOpen,
    therapistToRemove,
    // Tab state
    activeTab, setActiveTab,
    // Handlers
    fetchClinicData,
    handleOpenInvite,
    handleOpenAddTherapist,
    handleEditTherapist,
    handleRemoveTherapist,
    confirmRemoveTherapist,
    handleViewProfile,
    handleClinicCreated,
  };
};

export default useClinicDashboard;
