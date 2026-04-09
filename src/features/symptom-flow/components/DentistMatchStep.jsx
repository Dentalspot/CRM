import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

// Mock dentists — in production, use getRecommendations() from therapistApi.js
const MOCK_DENTISTS = [
  { id: '1', name: 'Dr. Pablo Ceballos', specialty: 'Ortodoncia', rating: 4.9, reviews: 124, location: 'Temuco', price: '$30.000', avatar: '👨‍⚕️', available: 'Hoy 15:00' },
  { id: '2', name: 'Dra. Catalina Cartes', specialty: 'Estetica Dental', rating: 4.8, reviews: 89, location: 'Temuco', price: '$25.000', avatar: '👩‍⚕️', available: 'Manana 10:00' },
  { id: '3', name: 'Dr. Cristobal Tagle', specialty: 'Cirugia Dental', rating: 5.0, reviews: 67, location: 'Temuco', price: '$35.000', avatar: '👨‍⚕️', available: 'Hoy 17:30' },
  { id: '4', name: 'Dr. Jimmie Munoz', specialty: 'Endodoncia', rating: 4.7, reviews: 156, location: 'Temuco', price: '$30.000', avatar: '👨‍⚕️', available: 'Jueves 09:00' },
];

const DentistMatchStep = ({ data, onBack }) => {
  const navigate = useNavigate();

  const handleAgendar = (dentist) => {
    // Save consultation data for after login
    sessionStorage.setItem('dentalspot_pending_consulta', JSON.stringify({
      symptoms: data.symptoms,
      description: data.description,
      analysis: data.analysis,
      dentistId: dentist.id,
      dentistName: dentist.name,
    }));
    // Redirect to register with return path
    navigate('/auth/register?redirect=/dashboard/calendar');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Dentistas recomendados para ti</h2>
        <p className="text-slate-500">Basado en tu analisis: {data.analysis?.categories?.join(', ')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MOCK_DENTISTS.map((dentist, i) => (
          <motion.div
            key={dentist.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-[0_0_30px_rgba(69,181,196,0.15)] hover:-translate-y-1 transition-all"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                {dentist.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-sm">{dentist.name}</h3>
                <p className="text-xs text-primary font-medium">{dentist.specialty}</p>
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
