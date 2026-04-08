import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import ProfileSectionCard from '@/components/therapist-profile/ProfileSectionCard';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, XCircle, Save, Loader2, Eye, EyeOff, Upload, FileText, ExternalLink, Trash2 } from 'lucide-react';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

const AcademicFormationSection = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const initialFormation = { title: '', institution: '', year: '', is_public: true, certificate_url: '' };
  const [formations, setFormations] = useState([initialFormation]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);

  useEffect(() => {
    const loadEducation = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('therapist_education')
          .select('*')
          .eq('therapist_id', user.id)
          .order('graduation_year', { ascending: false });

        if (error) {
          logger.error('Error loading education:', error);
          toast({
            title: 'Error al cargar',
            description: 'No se pudo cargar tu formación académica.',
            variant: 'destructive'
          });
        } else if (data && data.length > 0) {
          const formattedEducation = data.map(edu => ({
            id: edu.id,
            title: edu.title || '',
            institution: edu.institution || '',
            year: edu.graduation_year || '',
            is_public: edu.is_public ?? true,
            certificate_url: edu.certificate_url || '',
          }));
          setFormations(formattedEducation);
        }
      } catch (error) {
        logger.error('Error loading education:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEducation();
  }, [user?.id, toast]);

  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const newFormations = [...formations];
    newFormations[index][name] = value;
    setFormations(newFormations);
  };

  const togglePublic = (index) => {
    const newFormations = [...formations];
    newFormations[index].is_public = !newFormations[index].is_public;
    setFormations(newFormations);
  };

  const addFormation = () => {
    setFormations([...formations, { ...initialFormation, id: `new-${Date.now()}` }]);
  };

  const removeFormation = (index) => {
    const newFormations = formations.filter((_, i) => i !== index);
    if (newFormations.length === 0) {
      setFormations([initialFormation]);
    } else {
      setFormations(newFormations);
    }
  };

  // ============================================
  // UPLOAD DE CERTIFICADO
  // ============================================

  const handleCertificateUpload = async (index, file) => {
    if (!file) return;

    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: 'Formato no válido',
        description: 'Solo se permiten archivos PDF, JPG, PNG o WebP.',
        variant: 'destructive'
      });
      return;
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'Archivo muy grande',
        description: 'El archivo no puede superar los 5 MB.',
        variant: 'destructive'
      });
      return;
    }

    setUploadingIndex(index);

    try {
      // Generar nombre único
      const ext = file.name.split('.').pop().toLowerCase();
      const timestamp = Date.now();
      // Ensure path matches RLS policy: (storage.foldername(name))[1] = auth.uid()
      const fileName = `${user.id}/certificates/${timestamp}-${index}.${ext}`;

      // Subir a Supabase Storage
      // FIX: Changed bucket from 'therapist-documents' to 'therapist_documents' to match RLS policies
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('therapist_documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        if (uploadError.statusCode === '403' || uploadError.message.includes('row-level security')) {
           throw new Error('No tienes permisos para subir archivos a este directorio. Verifica tu sesión.');
        }
        throw uploadError;
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('therapist_documents')
        .getPublicUrl(fileName);

      const publicUrl = urlData?.publicUrl;

      if (!publicUrl) throw new Error('No se pudo obtener la URL del archivo.');

      // Actualizar estado local
      const newFormations = [...formations];
      newFormations[index].certificate_url = publicUrl;
      setFormations(newFormations);

      toast({
        title: 'Certificado subido',
        description: 'El archivo se subió correctamente. Recuerda guardar los cambios.',
      });
    } catch (error) {
      logger.error('Error uploading certificate:', error);
      toast({
        title: 'Error al subir',
        description: error.message || 'No se pudo subir el certificado.',
        variant: 'destructive'
      });
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleRemoveCertificate = (index) => {
    const newFormations = [...formations];
    newFormations[index].certificate_url = '';
    setFormations(newFormations);
  };

  // ============================================
  // GUARDAR
  // ============================================

  const handleSave = async () => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'No se puede guardar, usuario no encontrado.',
        variant: 'destructive'
      });
      return;
    }

    const validFormations = formations.filter(f => f.title || f.institution);

    if (validFormations.length === 0) {
      toast({
        title: 'Campos requeridos',
        description: 'Debes completar al menos un título o institución.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error: deleteError } = await supabase
        .from('therapist_education')
        .delete()
        .eq('therapist_id', user.id);

      if (deleteError) throw deleteError;

      const formationsToInsert = validFormations.map(formation => ({
        therapist_id: user.id,
        title: formation.title || null,
        institution: formation.institution || null,
        graduation_year: formation.year ? parseInt(formation.year) : null,
        is_public: formation.is_public !== false,
        certificate_url: formation.certificate_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('therapist_education')
        .insert(formationsToInsert);

      if (insertError) throw insertError;

      toast({
        title: '¡Éxito!',
        description: 'Tu formación académica ha sido guardada correctamente.'
      });

      // Recargar datos
      const { data } = await supabase
        .from('therapist_education')
        .select('*')
        .eq('therapist_id', user.id)
        .order('graduation_year', { ascending: false });

      if (data && data.length > 0) {
        const formattedEducation = data.map(edu => ({
          id: edu.id,
          title: edu.title || '',
          institution: edu.institution || '',
          year: edu.graduation_year || '',
          is_public: edu.is_public ?? true,
          certificate_url: edu.certificate_url || '',
        }));
        setFormations(formattedEducation);
      }
    } catch (error) {
      logger.error('Error saving education:', error);
      toast({
        title: 'Error al guardar',
        description: error.message || 'No se pudo guardar tu formación académica.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <ProfileSectionCard
        id="academic-formation"
        title="Formación Académica"
        description="Añade tus títulos, certificaciones y cursos relevantes para destacar tu experiencia."
        className="bg-muted/20"
      >
        <div className="flex justify-center items-center p-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ProfileSectionCard>
    );
  }

  return (
    <ProfileSectionCard
      id="academic-formation"
      title="Formación Académica"
      description="Añade tus títulos, certificaciones y cursos relevantes. Subir certificados mejora tu DentalLevel."
      className="bg-muted/20"
    >
      <div className="space-y-6">
        {formations.map((formation, index) => (
          <div
            key={formation.id || index}
            className={`p-6 bg-background rounded-xl border shadow-sm space-y-4 relative transition-opacity ${!formation.is_public ? 'opacity-60 border-dashed' : ''
              }`}
          >
            {formations.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFormation(index)}
                className="absolute top-3 right-3 text-destructive hover:text-destructive/80"
                aria-label="Eliminar formación"
              >
                <XCircle className="h-5 w-5" />
              </Button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-2">
                <Label htmlFor={`title-${index}`} className="font-semibold">
                  Título / Certificación
                </Label>
                <Input
                  id={`title-${index}`}
                  name="title"
                  value={formation.title}
                  onChange={(e) => handleChange(index, e)}
                  placeholder="Ej: Odontólogo/a"
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`institution-${index}`} className="font-semibold">
                  Institución Educativa
                </Label>
                <Input
                  id={`institution-${index}`}
                  name="institution"
                  value={formation.institution}
                  onChange={(e) => handleChange(index, e)}
                  placeholder="Ej: Universidad de Chile"
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`year-${index}`} className="font-semibold">
                  Año de Finalización
                </Label>
                <Input
                  id={`year-${index}`}
                  name="year"
                  type="number"
                  value={formation.year}
                  onChange={(e) => handleChange(index, e)}
                  placeholder="Ej: 2015"
                  className="bg-background"
                />
              </div>

              {/* Visibilidad pública */}
              <div className="space-y-2 flex items-end">
                <div
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors w-full"
                  onClick={() => togglePublic(index)}
                >
                  {formation.is_public ? (
                    <Eye className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {formation.is_public ? 'Visible en perfil público' : 'Oculto del perfil público'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formation.is_public
                        ? 'Los pacientes pueden ver esta formación'
                        : 'Solo tú puedes ver esta formación'}
                    </p>
                  </div>
                  <Switch
                    checked={formation.is_public}
                    onCheckedChange={() => togglePublic(index)}
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            </div>

            {/* Certificado */}
            <div className="pt-2 border-t border-gray-100">
              <Label className="font-semibold text-sm mb-2 block">
                Certificado / Diploma
              </Label>

              {formation.certificate_url ? (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <FileText className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-800 truncate">
                      Certificado subido
                    </p>
                    <p className="text-xs text-emerald-600">
                      Archivo adjunto correctamente
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100 h-8 px-2"
                      asChild
                    >
                      <a href={formation.certificate_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCertificate(index)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => handleCertificateUpload(index, e.target.files?.[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={uploadingIndex === index}
                  />
                  <div className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg transition-colors ${uploadingIndex === index
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                    }`}>
                    {uploadingIndex === index ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-sm text-primary font-medium">Subiendo certificado...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-gray-400" />
                        <div className="text-center">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium text-primary">Haz clic</span> o arrastra un archivo
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            PDF, JPG, PNG o WebP (máx. 5 MB)
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={addFormation}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Añadir Otra Formación
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Formación
            </>
          )}
        </Button>
      </div>
    </ProfileSectionCard>
  );
};

export default AcademicFormationSection;