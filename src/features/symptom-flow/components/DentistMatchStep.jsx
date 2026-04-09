import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Real dentists from Clinica Los Alamos with their specialties mapped
const ALL_DENTISTS = [
  {
    id: 'ceballos',
    name: 'Dr. Pablo Ceballos',
    specialties: ['ortodoncia', 'odontologia_general'],
    title: 'Ortodoncia y Ortopedia Dentomaxilar',
    rating: 4.9,
    reviews: 124,
    location: 'Temuco',
    price: '$30.000',
    avatar: '👨‍⚕️',
    available: 'Hoy 15:00',
  },
  {
    id: 'cartes',
    name: 'Dra. Catalina Cartes',
    specialties: ['estetica_dental', 'blanqueamiento', 'rehabilitacion_oral'],
    title: 'Estetica Dental y Armonizacion Facial',
    rating: 4.8,
    reviews: 89,
    location: 'Temuco',
    price: '$25.000',
    avatar: '👩‍⚕️',
    available: 'Manana 10:00',
  },
  {
    id: 'tagle',
    name: 'Dr. Cristobal Tagle',
    specialties: ['cirugia_maxilofacial', 'odontologia_general', 'endodoncia'],
    title: 'Cirugia Dental — Urgencias 24/7',
    rating: 5.0,
    reviews: 67,
    location: 'Temuco',
    price: '$35.000',
    avatar: '👨‍⚕️',
    available: 'Hoy 17:30',
  },
  {
    id: 'munoz',
    name: 'Dr. Jimmie Munoz',
    specialties: ['cirugia_maxilofacial', 'endodoncia', 'periodoncia'],
    title: 'Cirugia Dental Especializada',
    rating: 4.7,
    reviews: 156,
    location: 'Temuco',
    price: '$30.000',
    avatar: '👨‍⚕️',
    available: 'Jueves 09:00',
  },
];

const DentistMatchStep = ({ data, onBack }) => {
  const navigate = useNavigate();

  // Filter and sort dentists based on AI analysis specialties
  const matchedDentists = useMemo(() => {
    const neededSpecialties = data.analysis?.specialties || [];

    if (neededSpecialties.length === 0) return ALL_DENTISTS;

    // Score each dentist by how many specialties match
    const scored = ALL_DENTISTS.map(dentist => {
      const matchCount = dentist.specialties.filter(s =>
        neededSpecialties.includes(s)
      ).length;
      return { ...dentist, matchCount };
    });

    // Sort by match count descending, then by rating
    const sorted = scored.sort((a, b) => {
      if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
      return b.rating - a.rating;
    });

    // Only show dentists with at least 1 match, or all if none match
    const matched = sorted.filter(d => d.matchCount > 0);
    return matched.length > 0 ? matched : sorted;
  }, [data.analysis]);

  const handleAgendar = (dentist) => {
    sessionStorage.setItem('dentalspot_pending_consulta', JSON.stringify({
      symptoms: data.symptoms,
      description: data.description,
      analysis: data.analysis,
      dentistId: dentist.id,
      dentistName: dentist.name,
    }));
    navigate('/auth/register?redirect=/dashboard/calendar');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Dentistas recomendados para ti</h2>
        <p className="text-slate-500">
          Basado en tu analisis: {data.analysis?.categories?.join(', ')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {matchedDentists.map((dentist, i) => (
          <motion.div
            key={dentist.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-[0_0_30px_rgba(69,181,196,0.15)] hover:-translate-y-1 transition-all"
          >
            {/* Match badge */}
            {dentist.matchCount > 0 && (
              <div className="mb-3">
                <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                  Especialista recomendado
                </span>
              </div>
            )}

            <div className="flex items-start gap-4 mb-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                {dentist.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-sm">{dentist.name}</h3>
                <p className="text-xs text-primary font-medium">{dentist.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-semibold text-slate-700">{dentist.rating}</span>
                  <span className="text-xs text-slate-400">({dentist.reviews} resenas)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {dentist.location}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {dentist.available}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-slate-900">{dentist.price}</span>
              <Button
                onClick={() => handleAgendar(dentist)}
                size="sm"
                className="bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-xl hover:opacity-90"
              >
                Agendar <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        ))}
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
