import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getTherapistById } from '../api/therapistApi';
import { ArrowLeft, MapPin, Calendar, Globe, Award, CheckCircle2, Star, Shield, User } from 'lucide-react';
import logger from '@/lib/utils/logger';
import { Skeleton } from '@/components/ui/skeleton';

const TherapistProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTherapist();
  }, [id]);

  const loadTherapist = async () => {
    try {
      const data = await getTherapistById(id);
      setTherapist(data);
    } catch (error) {
      logger.error("Error loading therapist:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8"><Skeleton className="h-[400px] w-full rounded-xl" /></div>;
  }

  if (!therapist) {
    return <div className="container mx-auto py-8 text-center">Terapeuta no encontrado</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <Helmet>
        <title>{therapist.name} | Perfil Profesional</title>
      </Helmet>

      <Button variant="ghost" className="mb-6 pl-0 hover:pl-2 transition-all" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Dashboard
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8 border-t-4 border-t-primary shadow-lg">
            <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
              <Avatar className="h-32 w-32 border-4 border-slate-50 shadow-md">
                <AvatarImage src={therapist.photo_url} alt={therapist.name} className="object-cover" />
                <AvatarFallback className="text-2xl">{therapist.name.charAt(0)}</AvatarFallback>
              </Avatar>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{therapist.name}</h1>
                <p className="text-primary font-medium">{therapist.specialty}</p>
              </div>

              <div className="w-full border-t border-slate-100 my-2"></div>

              <div className="grid grid-cols-2 gap-4 w-full text-center">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <p className="text-2xl font-bold text-slate-700">{therapist.experience_years}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Años Exp.</p>
                </div>
                <div className="bg-green-50 p-2 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">{therapist.success_rate}%</p>
                  <p className="text-xs text-green-600/80 uppercase tracking-wider">Éxito</p>
                </div>
              </div>

              <div className="w-full space-y-3 pt-2">
                <Button className="w-full h-12 text-lg shadow-md hover:shadow-lg transition-all">
                  Agendar Cita
                </Button>
                <Button variant="outline" className="w-full border-primary/20 hover:bg-primary/5 text-primary">
                  Enviar Mensaje
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-md bg-white">
            <CardContent className="p-6 md:p-8 space-y-8">
              
              {/* About */}
              <section>
                <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-slate-800">
                  <User className="h-5 w-5 text-primary" />
                  Sobre mí
                </h2>
                <p className="text-slate-600 leading-relaxed text-lg">
                  {therapist.bio}
                </p>
              </section>

              {/* Languages & Status */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Idiomas</h3>
                  <div className="flex gap-2">
                    {therapist.languages && therapist.languages.map(lang => (
                      <Badge key={lang} variant="secondary" className="px-3 py-1 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100">
                        <Globe className="w-3 h-3 mr-1" /> {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Disponibilidad</h3>
                  <div className="flex items-center gap-2">
                    {therapist.availability_status === 'Available' ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 px-3 py-1">
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Disponible para nuevos pacientes
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Agenda llena</Badge>
                    )}
                  </div>
                </div>
              </section>

              {/* Certifications */}
              {therapist.certifications && (
                <section>
                  <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-slate-800">
                    <Shield className="h-5 w-5 text-primary" />
                    Certificaciones
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {therapist.certifications.map((cert, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50">
                        <div className="bg-white p-2 rounded-full shadow-sm">
                          <Award className="h-5 w-5 text-amber-500" />
                        </div>
                        <span className="font-medium text-slate-700">{cert}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TherapistProfilePage;