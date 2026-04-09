import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Search, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Map AI specialties to search URL specialty slugs
const SPECIALTY_SLUGS = {
  endodoncia: 'endodoncia',
  odontologia_general: 'odontologia-general',
  rehabilitacion_oral: 'rehabilitacion-oral',
  estetica_dental: 'estetica-dental',
  blanqueamiento: 'estetica-dental',
  periodoncia: 'periodoncia',
  cirugia_maxilofacial: 'cirugia-maxilofacial',
  ortodoncia: 'ortodoncia',
};

const DentistMatchStep = ({ data, onBack }) => {
  const navigate = useNavigate();

  // Build search URL with filters from analysis
  const buildSearchUrl = () => {
    const params = new URLSearchParams();

    // Map first specialty to URL param
    const firstSpecialty = data.analysis?.specialties?.[0];
    if (firstSpecialty && SPECIALTY_SLUGS[firstSpecialty]) {
      params.set('especialidad', SPECIALTY_SLUGS[firstSpecialty]);
    }

    // Region and city from symptom step
    if (data.region) params.set('region', data.region);
    if (data.city) params.set('ciudad', data.city);

    return `/dentistas?${params.toString()}`;
  };

  const handleBuscarDentistas = () => {
    // Save consultation data for context after login
    sessionStorage.setItem('dentalspot_pending_consulta', JSON.stringify({
      symptoms: data.symptoms,
      description: data.description,
      analysis: data.analysis,
      region: data.region,
      city: data.city,
    }));
    navigate(buildSearchUrl());
  };

  const categories = data.analysis?.categories || [];
  const specialties = data.analysis?.specialties || [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Encuentra tu dentista</h2>
        <p className="text-slate-500">
          Buscaremos especialistas en {categories.join(', ').toLowerCase() || 'odontologia general'} cerca de ti
        </p>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Especialidades recomendadas</p>
          <div className="flex flex-wrap gap-2">
            {specialties.map((spec, i) => (
              <span key={i} className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-sm font-medium capitalize">
                {spec.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {categories.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Diagnostico preliminar</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat, i) => (
                <span key={i} className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium">{cat}</span>
              ))}
            </div>
          </div>
        )}

        {(data.region || data.city) && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-primary" />
            <span>Buscando en tu zona</span>
          </div>
        )}
      </div>

      {/* CTA principal */}
      <div className="flex flex-col items-center gap-4">
        <Button
          onClick={handleBuscarDentistas}
          size="lg"
          className="h-14 px-10 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold rounded-2xl shadow-lg shadow-primary/25 text-base w-full sm:w-auto"
        >
          <Search className="w-5 h-5 mr-2" />
          Ver dentistas disponibles
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        <p className="text-xs text-slate-400 text-center max-w-sm">
          Te llevaremos al buscador con los filtros aplicados segun tu analisis.
          Podras ver perfiles, disponibilidad, mapa y agendar directamente.
        </p>
      </div>

      {/* WhatsApp alternative */}
      <div className="text-center">
        <a
          href="https://wa.me/56961003242?text=Hola%2C%20use%20DentalSpot%20y%20necesito%20agendar%20una%20cita"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors"
        >
          💬 Prefiero agendar por WhatsApp
        </a>
      </div>

      <div className="flex justify-center">
        <Button variant="outline" onClick={onBack} className="rounded-2xl">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al analisis
        </Button>
      </div>
    </motion.div>
  );
};

export default DentistMatchStep;
