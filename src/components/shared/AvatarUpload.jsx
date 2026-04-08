import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, Camera } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import logger from '@/lib/utils/logger';

const AvatarUpload = ({ currentAvatarUrl, onUploadComplete, className }) => {
  const { user, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleFileSelect = async (event) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      setUploading(true);

      // 1. Upload image to 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update therapist_branding table (Source of Truth for therapists)
      // Only upsert to therapist_branding if user is a therapist or has branding entry
      const { error: updateError } = await supabase
        .from('therapist_branding')
        .upsert({ 
          therapist_id: user.id, 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        }, { onConflict: 'therapist_id' });

      if (updateError) {
        // Fallback for non-therapists or if branding fails (optional, but good for stability)
        logger.warn('Could not update therapist_branding, attempting profile update fallback...', updateError);
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);
          
        if (profileError) throw updateError; // Throw original error if both fail
      }

      toast({
        title: "Avatar actualizado",
        description: "Tu foto de perfil se ha guardado correctamente.",
      });

      // 4. Refresh context and callback
      await refreshProfile();
      if (onUploadComplete) onUploadComplete(publicUrl);

    } catch (error) {
      logger.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el avatar. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative group">
        <ProfileAvatar 
          profile={user} // Pass full user to use logic in ProfileAvatar
          src={currentAvatarUrl} // Optional override
          alt={user?.full_name || "Avatar"} 
          className="h-32 w-32 md:h-40 md:w-40 border-4 border-white shadow-xl"
        />
        
        <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
             onClick={() => fileInputRef.current?.click()}>
          <Camera className="h-8 w-8 text-white" />
        </div>

        {uploading && (
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/60 z-10">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          Cambiar Foto
        </Button>
        <input
          type="file"
          id="avatar"
          name="avatar"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          ref={fileInputRef}
          disabled={uploading}
        />
      </div>
      <p className="text-xs text-muted-foreground text-center max-w-[200px]">
        Recomendado: JPG, PNG. Máx 2MB.
      </p>
    </div>
  );
};

export default AvatarUpload;