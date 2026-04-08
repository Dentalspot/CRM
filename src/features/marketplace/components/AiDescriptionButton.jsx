import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AiDescriptionButton = ({
  title,
  description,
  itemType,
  category,
  targetAgeMin,
  targetAgeMax,
  onResult,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'marketplace-ai-description',
        {
          body: {
            title,
            description,
            item_type: itemType,
            category,
            target_age_min: targetAgeMin,
            target_age_max: targetAgeMax,
          },
        }
      );

      if (error) throw error;

      onResult({
        description: data.description,
        benefits: data.benefits,
        target_audience: data.target_audience,
        use_cases: data.use_cases,
      });
    } catch (err) {
      console.error('AI description error:', err);
      toast({
        variant: 'destructive',
        title: 'Error al generar con IA',
        description:
          err?.message || 'No se pudo generar la descripción. Intenta de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || !title || loading}
      onClick={handleClick}
      className="border-teal-300 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="mr-2 h-4 w-4" />
      )}
      {loading ? 'Generando...' : '✨ Mejorar con IA'}
    </Button>
  );
};

export default AiDescriptionButton;
