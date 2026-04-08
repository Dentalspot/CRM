import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import logger from '@/lib/utils/logger';

/**
 * Button to generate an AI image for a marketplace item using HuggingFace.
 * Only shows for items without images.
 */
const AiImageButton = ({ item, onImageGenerated, size = 'sm', className = '' }) => {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('marketplace-ai-image', {
        body: {
          item_id: item.id,
          title: item.title,
          description: item.description,
          category: item.category,
          item_type: item.item_type,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Error al generar imagen');

      toast({ title: 'Imagen generada con IA', description: 'La imagen se ha agregado al producto.' });
      if (onImageGenerated) onImageGenerated(data.image_url, data.gallery_urls);
    } catch (err) {
      logger.error('AI image generation error:', err);
      toast({
        variant: 'destructive',
        title: 'Error al generar imagen',
        description: err.message || 'Intenta nuevamente más tarde.',
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleGenerate}
      disabled={generating}
      className={`gap-1.5 ${className}`}
    >
      {generating ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <Sparkles className="h-3.5 w-3.5" />
          Generar imagen IA
        </>
      )}
    </Button>
  );
};

export default AiImageButton;
