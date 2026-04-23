import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { useState, useEffect, useCallback } from 'react';

const defaultPhrases = [
  { content: "Tu dedicación transforma vidas, una sesión a la vez.", author: "DentalSpot" },
  { content: "La comunicación es el corazón de la conexión humana. Gracias por construir puentes.", author: "DentalSpot" },
  { content: "Cada pequeño progreso es un gran logro. ¡Sigue adelante!", author: "DentalSpot" }
];

let phrasesCache = [];
let lastFetchTime = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hora

const getRandomPhraseFromCache = () => {
    const source = phrasesCache.length > 0 ? phrasesCache : defaultPhrases;
    return source[Math.floor(Math.random() * source.length)];
};

export const useMotivationalPhrase = () => {
  const [phrase, setPhrase] = useState(getRandomPhraseFromCache());
  const [loading, setLoading] = useState(true);

  const fetchPhrases = useCallback(async () => {
    setLoading(true);
    const now = new Date();

    if (!lastFetchTime || now - lastFetchTime > CACHE_DURATION) {
        try {
            const { data, error } = await supabase.from('motivational_phrases').select('content, author').eq('is_active', true);
            if (error) throw error;
            
            if (data && data.length > 0) {
                phrasesCache = data;
                lastFetchTime = now;
            }
        } catch(e) {
            logger.warn("Could not fetch motivational phrases, using defaults.", e.message);
        }
    }
    
    setPhrase(getRandomPhraseFromCache());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPhrases();
  }, [fetchPhrases]);

  const refetch = useCallback(() => {
    setPhrase(getRandomPhraseFromCache());
  }, []);

  return { phrase, loading, refetch };
};