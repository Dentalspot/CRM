import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

const useProfessionalSearch = (initialFilters = {}) => {
  const [filters, setFilters] = useState({
    specialty: null,
    region: null,
    city: null,
    modality: null,
    term: null,
    ...initialFilters
  });

  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      ...initialFilters
    }));
  }, [initialFilters.specialty, initialFilters.region, initialFilters.city, initialFilters.modality, initialFilters.term]);

  const performSearch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // LEFT JOIN en vez de INNER — incluye terapeutas sin therapist_details
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          phone,
          region_id,
          city_id,
          role,
          therapist_details!therapist_details_user_id_fkey!left (
            user_id,
            is_public,
            public_email,
            years_experience,
            headline_statement,
            about_me,
            slug,
            professional_title
          ),
          therapist_branding (
            avatar_url
          ),
          therapist_specialties (
            specialty_id,
            specialties (id, name)
          ),
          clinics (
            id, name, address, modality, is_active, latitude, longitude
          )
        `)
        .eq('role', 'therapist');

      if (filters.region && filters.region !== 'all') {
        query = query.eq('region_id', filters.region);
      }
      if (filters.city && filters.city !== 'all') {
        query = query.eq('city_id', filters.city);
      }
      if (filters.term && filters.term.trim() !== '') {
        query = query.ilike('full_name', `%${filters.term.trim()}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(fetchError.message || 'Error desconocido al conectar con la base de datos');
      }

      if (!data || data.length === 0) {
        setSearchResults([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      // Todos los dentistas registrados son visibles en el buscador
      let processedData = data.map(prof => {
        const details = Array.isArray(prof.therapist_details) ? prof.therapist_details[0] : prof.therapist_details;
        const branding = Array.isArray(prof.therapist_branding) ? prof.therapist_branding[0] : prof.therapist_branding;

        const rawSpecialties = prof.therapist_specialties || [];
        const specialtiesNames = rawSpecialties.map(ts => ts.specialties?.name).filter(Boolean);
        const specialtyIds = rawSpecialties.map(ts => String(ts.specialty_id)).filter(Boolean);

        const activeClinics = (prof.clinics || []).filter(c => c.is_active);
        const offers_online = activeClinics.some(c =>
          c.modality === 'online' || c.modality === 'ambas' || c.modality === 'mixto'
        );
        const offers_presential = activeClinics.some(c =>
          c.modality === 'presencial' || c.modality === 'ambas' || c.modality === 'mixto'
        );

        return {
          id: prof.id,
          therapist_id: prof.id,
          full_name: prof.full_name || 'Terapeuta sin nombre',
          public_slug: details?.slug || prof.id,
          headline_statement: details?.headline_statement || details?.professional_title || 'Odontólogo/a',
          about_me: details?.about_me || 'Sin descripción disponible.',
          city_id: prof.city_id,
          region_id: prof.region_id,
          city_name: '',
          region_name: '',
          specialties: specialtiesNames.length > 0 ? specialtiesNames : ['Odontología General'],
          specialtyIds: specialtyIds,
          min_price: 0,
          offers_online,
          offers_presential,
          avg_rating: 0,
          total_reviews: 0,
          avatar_url: branding?.avatar_url || null,
          clinics: activeClinics,
          dentallevel_score: 50,
          dentallevel_badge: 'Profesional DentalSpot',
          insurances: []
        };
      });

      if (filters.specialty && filters.specialty !== 'all') {
        const specIdStr = String(filters.specialty);
        processedData = processedData.filter(prof => prof.specialtyIds.includes(specIdStr));
      }

      if (filters.modality && filters.modality !== 'all') {
        processedData = processedData.filter(prof => {
          if (filters.modality === 'online') return prof.offers_online;
          if (filters.modality === 'presencial') return prof.offers_presential;
          return true;
        });
      }

      setSearchResults(processedData);
      setTotalCount(processedData.length);

    } catch (err) {
      setError(err.message || 'Error inesperado al buscar profesionales');
      setSearchResults([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters.specialty, filters.region, filters.city, filters.modality, filters.term]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  return {
    searchResults,
    loading,
    error,
    totalCount,
    performSearch,
    filters,
    setFilters
  };
};

export default useProfessionalSearch;