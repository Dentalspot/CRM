import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook personalizado para manejar datos de ubicación y especialidades
 * @returns {Object} Estado y funciones para manejar datos
 */
const useLocationData = () => {
  // Estados de datos
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [specialties, setSpecialties] = useState([]);

  // Estados de carga
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingSpecialties, setLoadingSpecialties] = useState(true);
  const [loading, setLoading] = useState(true);

  // Estado de errores
  const [error, setError] = useState(null);

  // Cargar regiones y especialidades al montar
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setLoadingRegions(true);
      setLoadingSpecialties(true);
      setError(null);

      try {
        // Cargar en paralelo para mejor performance
        const [regionsRes, specialtiesRes] = await Promise.all([
          supabase
            .from('regions')
            .select('id, name')
            .order('ordinal', { ascending: true }),
          supabase
            .from('specialties')
            .select('id, name')
            .order('name', { ascending: true })
        ]);

        // Validar regiones
        if (regionsRes.error) {
          logger.error('❌ Error fetching regions:', regionsRes.error);
        } else {
          setRegions(regionsRes.data || []);
        }

        // Validar especialidades
        if (specialtiesRes.error) {
          logger.error('❌ Error fetching specialties:', specialtiesRes.error);
        } else {
          setSpecialties(specialtiesRes.data || []);
        }

      } catch (err) {
        logger.error('❌ Error loading initial data:', err);
        setError(err.message);
      } finally {
        setLoadingRegions(false);
        setLoadingSpecialties(false);
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  /**
   * Cargar ciudades de una región específica
   * @param {number|string|null} regionId - ID de la región
   */
  const fetchCities = useCallback(async (regionId) => {
    if (!regionId || regionId === 'all') {
      setCities([]);
      return;
    }

    setLoadingCities(true);

    try {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name')
        .eq('region_id', regionId)
        .order('name', { ascending: true });

      if (error) {
        logger.error('Error fetching cities:', error);
        setCities([]);
      } else {
        setCities(data || []);
      }
    } catch (err) {
      logger.error('Error loading cities:', err);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  }, []);

  return {
    // Datos
    regions,
    cities,
    specialties,

    // Estados de carga
    loadingRegions,
    loadingCities,
    loadingSpecialties,
    loading,

    // Errores
    error,

    // Funciones
    fetchCities
  };
};

export default useLocationData;