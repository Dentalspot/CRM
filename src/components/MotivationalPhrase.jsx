import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

const MotivationalPhrase = ({ type = 'therapist' }) => {
  const [phrase, setPhrase] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhrase();
  }, [type]);

  const fetchPhrase = async () => {
    try {
      // Always fetch from the main phrases table which contains the content columns.
      // The 'motivational_patient' table is a log table and doesn't contain 'content' or 'author'.
      const { data, error } = await supabase
        .from('motivational_phrases')
        .select('content, author')
        .eq('is_active', true);

      if (error) throw error;

      if (data && data.length > 0) {
        const randomPhrase = data[Math.floor(Math.random() * data.length)];
        setPhrase(randomPhrase);
      }
    } catch (error) {
      logger.error('Error fetching phrase:', error);
      // Default phrase fallback
      setPhrase({
        content: "Cada día es una nueva oportunidad para hacer la diferencia.",
        author: "FonoKit"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !phrase) return null;

  return (
    <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-pink-500 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm italic text-gray-700">
              "{phrase.content}"
            </p>
            {phrase.author && (
              <p className="text-xs text-gray-500 mt-1">
                — {phrase.author}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MotivationalPhrase;