import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Video, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import BookingCalendar from '@/components/calendar/BookingCalendar';
import logger from '@/lib/utils/logger';

const TherapistBookingPage = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const preselectedClinicId = searchParams.get('clinicId');

  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClinicId, setSelectedClinicId] = useState(preselectedClinicId);

  useEffect(() => {
    const fetchTherapist = async () => {
      setLoading(true);
      try {
        let data = null;
        const { data: viewData, error: viewError } = await supabase
          .from('v_therapist_full_profile')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (!viewError && viewData) {
          data = viewData;
        } else {
          // Fallback: query therapist_details by slug
          const { data: details } = await supabase
            .from('therapist_details')
            .select('user_id, slug')
            .eq('slug', slug)
            .maybeSingle();
          if (details) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', details.user_id)
              .maybeSingle();
            data = profile ? { ...profile, slug } : null;
          }
        }

        if (!data) throw new Error('Dentista no encontrado');
        setTherapist(data);

        // Si hay clinicId en URL, usarlo
        if (preselectedClinicId && data.clinics) {
          const clinic = data.clinics.find(c => c.id === preselectedClinicId);
          if (clinic) {
            setSelectedClinicId(preselectedClinicId);
          }
        }
      } catch (err) {
        logger.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchTherapist();
  }, [slug, preselectedClinicId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !therapist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600">Error: {error || 'Dentista no encontrado'}</p>
            <Button asChild className="mt-4">
              <Link to="/buscar">Volver a buscar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const presencialClinics = therapist.clinics?.filter(c => c.modality === 'presencial') || [];
  const onlineClinics = therapist.clinics?.filter(c => c.modality === 'online') || [];

  return (
    <>
      <Helmet>
        <title>Agendar con {therapist.full_name} | DentalSpot</title>
        <meta name="description" content={`Agenda tu cita con ${therapist.full_name}`} />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary py-8 px-4">
          <div className="container mx-auto max-w-5xl">
            <Button variant="ghost" asChild className="text-white mb-4">
              <Link to={`/dentista/${slug}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al perfil
              </Link>
            </Button>

            <div className="flex items-center gap-4 text-white">
              <Avatar className="h-20 w-20 border-2 border-white">
                <AvatarImage src={therapist.avatar_url} />
                <AvatarFallback>{therapist.full_name?.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">{therapist.full_name}</h1>
                <p className="text-lg opacity-90">{therapist.headline_statement}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="container mx-auto max-w-5xl px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Selecciona tu modalidad de atención</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={presencialClinics.length > 0 ? 'presencial' : 'online'}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger
                      value="presencial"
                      disabled={presencialClinics.length === 0}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Presencial ({presencialClinics.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="online"
                      disabled={onlineClinics.length === 0}
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Online ({onlineClinics.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="presencial" className="space-y-6">
                    {presencialClinics.length > 0 ? (
                      presencialClinics.map(clinic => (
                        <div key={clinic.id} className="border-b pb-6 last:border-0">
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <MapPin className="h-5 w-5 text-primary" />
                              {clinic.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">{clinic.address}</p>
                            <Badge variant="outline" className="mt-2">Presencial</Badge>
                          </div>
                          <BookingCalendar
                            therapistId={therapist.id}
                            consultationType="presencial"
                            clinicId={clinic.id}
                            isFullView
                          />
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        No hay consultas presenciales disponibles
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="online" className="space-y-6">
                    {onlineClinics.length > 0 ? (
                      onlineClinics.map(clinic => (
                        <div key={clinic.id}>
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <Video className="h-5 w-5 text-primary" />
                              Consulta Online
                            </h3>
                            <Badge variant="outline" className="mt-2">Online</Badge>
                          </div>
                          <BookingCalendar
                            therapistId={therapist.id}
                            consultationType="online"
                            clinicId={clinic.id}
                            isFullView
                          />
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        No hay consultas online disponibles
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default TherapistBookingPage;