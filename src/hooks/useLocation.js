import { useState, useEffect, useCallback } from 'react';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook simplificado para manejar datos de ubicación (regiones y ciudades)
 * @returns {Object} Estado y funciones para manejar datos de ubicación
 */
const useLocation = () => {
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    const fetchRegions = async () => {
      setLoadingRegions(true);
      const { data, error } = await supabase
        .from('regions')
        .select('id, name')
        .order('ordinal', { ascending: true });
      
      if (error) {
        logger.error('Error fetching regions:', error);
      } else {
        setRegions(data || []);
      }
      setLoadingRegions(false);
    };

    fetchRegions();
  }, []);

  const fetchCities = useCallback(async (regionId) => {
    if (!regionId) {
      setCities([]);
      return;
    }
    setLoadingCities(true);
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
    setLoadingCities(false);
  }, []);

  return { regions, cities, loadingRegions, loadingCities, fetchCities };
};

export default useLocation;