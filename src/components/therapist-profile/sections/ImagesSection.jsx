import React, { useState, useEffect, useRef } from 'react';
import ProfileSectionCard from '@/components/therapist-profile/ProfileSectionCard';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UploadCloud, Save, Image as ImageIcon, Loader2, ExternalLink, Copy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { useToast } from '@/components/ui/use-toast';

const ImagesSection = () => {
  const { user, loadingAuth } = useAuth();
  const { toast } = useToast();

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [landingUrl, setLandingUrl] = useState(null);
  const [landingPublished, setLandingPublished] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const avatarFileRef = useRef(null);
  const logoFileRef = useRef(null);

  // Base URL para las landing pages
  const BASE_URL = 'https://dentalspot.cl';

  // ============================================================
  // FETCH INITIAL DATA
  // ============================================================

  useEffect(() => {
    if (!loadingAuth && user) {
      const fetchImages = async () => {
        setLoading(true);
        try {
          // Fetch images from therapist_branding
          const { data: branding, error: brandingError } = await supabase
            .from('therapist_branding')
            .select('avatar_url, logo_url')
            .eq('therapist_id', user.id)
            .single();

          if (brandingError && brandingError.code !== 'PGRST116') {
            throw brandingError;
          }

          if (branding) {
            setAvatarUrl(branding.avatar_url);
            setAvatarPreview(branding.avatar_url);
            setLogoUrl(branding.logo_url);
            setLogoPreview(branding.logo_url);
          }

          // Fetch landing page URL
          const { data: landing, error: landingError } = await supabase
            .from('therapist_landing_pages')
            .select('custom_url, published')
            .eq('therapist_id', user.id)
            .single();

          if (!landingError && landing) {
            setLandingUrl(landing.custom_url);
            setLandingPublished(landing.published);
          }

        } catch (error) {
          logger.error("Error loading image or landing data:", error);
          toast({
            variant: 'destructive',
            title: "Error",
            description: "No se pudieron cargar tus imágenes o tu página pública."
          });
        } finally {
          setLoading(false);
        }
      };

      fetchImages();
    }
  }, [user, loadingAuth, toast]);

  // ============================================================
  // FILE HANDLERS
  // ============================================================

  const handleFileChange = (event, setPreview) => {
    const file = event.target.files[0];
    if (file) {
      const fileTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!fileTypes.includes(file.type)) {
        toast({
          title: "Formato inválido",
          description: "Sube JPG, PNG o WEBP.",
          variant: "destructive"
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Archivo muy grande",
          description: "Máximo permitido: 5MB.",
          variant: "destructive"
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // ============================================================
  // UPLOAD FUNCTION
  // ============================================================

  const handleUpload = async (type) => {
    if (!user) return;
    setSaving(true);

    const ref = type === 'avatar' ? avatarFileRef : logoFileRef;
    const file = ref.current?.files?.[0];

    if (!file) {
      toast({
        title: 'Sin archivo',
        description: 'Selecciona una imagen primero.',
        variant: 'destructive'
      });
      setSaving(false);
      return;
    }

    const bucket = type === 'avatar' ? 'avatars' : 'logos';
    const fileName = `${type}_${user.id}_${Date.now()}`;
    const filePath = `${user.id}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } =
        supabase.storage.from(bucket).getPublicUrl(filePath);

      const updateData =
        type === 'avatar'
          ? { avatar_url: publicUrl }
          : { logo_url: publicUrl };

      const { error: dbError } = await supabase
        .from('therapist_branding')
        .upsert(
          { therapist_id: user.id, ...updateData },
          { onConflict: 'therapist_id' }
        );

      if (dbError) throw dbError;

      if (type === 'avatar') {
        setAvatarUrl(publicUrl);
        setAvatarPreview(publicUrl);
      } else {
        setLogoUrl(publicUrl);
        setLogoPreview(publicUrl);
      }

      toast({
        title: 'Imagen guardada',
        description: `${type === 'avatar'
          ? 'Tu foto de perfil'
          : 'Tu logo'
          } se ha actualizado.`
      });

    } catch (error) {
      logger.error(`Error uploading ${type}:`, error);
      toast({
        title: `Error al subir ${type}`,
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // PUBLISH LANDING PAGE
  // ============================================================

  const handlePublishLanding = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('therapist_landing_pages')
        .update({ published: true, updated_at: new Date().toISOString() })
        .eq('therapist_id', user.id);

      if (error) throw error;

      setLandingPublished(true);
      toast({
        title: "¡Página publicada!",
        description: "Tu página ahora es visible en el buscador público."
      });
    } catch (error) {
      logger.error("Error publishing landing:", error);
      toast({
        variant: 'destructive',
        title: "Error",
        description: "No se pudo publicar tu página. Intenta nuevamente."
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <ProfileSectionCard id="images" title="Imágenes" description="Sube tu foto de perfil y logo de marca.">
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ProfileSectionCard>
    );
  }

  // URL pública del dentista (sin prefijo, directamente en root)
  const publicUrl = landingUrl ? `${BASE_URL}/${landingUrl}` : null;

  return (
    <ProfileSectionCard
      id="images"
      title="Imágenes"
      description="Sube tu foto de perfil y logo de marca."
    >

      {/* ============================================================
          IMÁGENES
      ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

        {/* Foto de Perfil */}
        <div className="flex flex-col items-center gap-4 p-4 rounded-lg border">
          <Label className="text-lg font-semibold block self-start">
            Foto de Perfil
          </Label>

          <Avatar className="h-40 w-40 border-4 border-primary/20 shadow-md">
            <AvatarImage src={avatarPreview || undefined} alt="Foto de perfil" />
            <AvatarFallback className="text-4xl bg-muted">
              <ImageIcon />
            </AvatarFallback>
          </Avatar>

          <Input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            ref={avatarFileRef}
            onChange={(e) => handleFileChange(e, setAvatarPreview)}
          />

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => avatarFileRef.current?.click()} disabled={saving}>
              <UploadCloud className="mr-2 h-4 w-4" /> Cambiar
            </Button>

            {avatarPreview && avatarPreview !== avatarUrl && (
              <Button onClick={() => handleUpload('avatar')} disabled={saving}>
                {saving
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Save className="mr-2 h-4 w-4" />}
                Guardar Foto
              </Button>
            )}
          </div>
        </div>

        {/* Logo */}
        <div className="flex flex-col items-center gap-4 p-4 rounded-lg border">
          <Label className="text-lg font-semibold block self-start">
            Logo de Marca (Opcional)
          </Label>

          <div className="w-40 h-40 border-2 border-dashed border-muted-foreground/50 rounded-md flex items-center justify-center bg-muted/20 overflow-hidden">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo de marca" className="max-w-full max-h-full object-contain" />
            ) : (
              <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
            )}
          </div>

          <Input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            ref={logoFileRef}
            onChange={(e) => handleFileChange(e, setLogoPreview)}
          />

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => logoFileRef.current?.click()} disabled={saving}>
              <UploadCloud className="mr-2 h-4 w-4" /> Cambiar
            </Button>

            {logoPreview && logoPreview !== logoUrl && (
              <Button onClick={() => handleUpload('logo')} disabled={saving}>
                {saving
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Save className="mr-2 h-4 w-4" />}
                Guardar Logo
              </Button>
            )}
          </div>
        </div>

      </div>

      {/* ============================================================
          PÁGINA PÚBLICA / LINK COMPARTIBLE
      ============================================================ */}
      <div className="mt-10 p-5 border rounded-xl bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Tu Página Pública</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Comparte este enlace con tus pacientes o en tus redes sociales.
        </p>

        {publicUrl ? (
          <div className="space-y-4">
            {/* Siempre mostrar la URL */}
            <div className="flex flex-col md:flex-row items-center gap-3">
              <Input
                value={publicUrl}
                readOnly
                className="font-mono text-sm flex-1"
              />

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(publicUrl);
                  toast({ title: "Enlace copiado", description: "Listo para compartir." });
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>

              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" /> Vista previa
                </Button>
              </a>
            </div>

            {/* Estado de publicación */}
            {landingPublished ? (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                Tu página está publicada y visible para el público.
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <p className="text-sm text-amber-800 font-medium mb-2">
                  ⚠️ Tu página aún no está publicada
                </p>
                <p className="text-sm text-amber-700 mb-3">
                  Puedes ver la vista previa, pero no aparecerá en el buscador público hasta que la actives.
                </p>
                <Button
                  size="sm"
                  onClick={handlePublishLanding}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Publicar mi página
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Aún no tienes una página pública configurada.
            </p>
            <p className="text-sm text-muted-foreground">
              Completa tu perfil profesional para generar tu página pública y que pacientes puedan encontrarte.
            </p>
          </div>
        )}
      </div>

    </ProfileSectionCard>
  );
};

export default ImagesSection;