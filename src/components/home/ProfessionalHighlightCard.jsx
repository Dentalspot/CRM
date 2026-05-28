import React from 'react';
import { motion } from 'framer-motion';
import { User, Star, MapPin, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ProfessionalHighlightCard = ({
  name,
  specialty,
  rating,
  location,
  imageUrl,
  profileUrl = '/buscar-fonoaudiologo',
  whatsapp,          // optional: phone number for WhatsApp
  showInviteCTA = false,  // true inside the invitation section
}) => {
  const renderStars = () =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
        }`}
        aria-hidden="true"
      />
    ));

  // ── CTA button logic ──────────────────────────────────────────────────
  const InviteButton = () => {
    if (whatsapp) {
      return (
        <Button
          asChild
          size="sm"
          className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white transition-all"
        >
          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
              'Hola, me interesa unirme a DentalSpot. ¿Podrías enviarme una invitación?'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
            Pedir invitación
          </a>
        </Button>
      );
    }
    return (
      <Button
        asChild
        variant="outline"
        size="sm"
        className="w-full rounded-full border-primary/30 text-primary hover:bg-primary hover:text-white transition-all"
      >
        <Link to={profileUrl} className="flex items-center justify-center gap-2">
          <MessageCircle className="w-4 h-4" aria-hidden="true" />
          Ver perfil
        </Link>
      </Button>
    );
  };

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      className={`group rounded-2xl p-6 border transition-all duration-300 ${
        showInviteCTA
          ? 'bg-slate-800/60 border-slate-700/60 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10'
          : 'bg-white border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5'
      }`}
    >
      {/* Avatar */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg group-hover:shadow-primary/20 transition-shadow">
            {imageUrl ? (
              <img src={imageUrl} alt={`Foto de ${name}`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-primary" aria-hidden="true" />
            )}
          </div>
          <div
            className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"
            aria-label="Disponible"
          />
        </div>
      </div>

      {/* Info */}
      <div className="text-center space-y-2">
        <h3
          className={`font-semibold group-hover:text-primary transition-colors ${
            showInviteCTA ? 'text-white' : 'text-slate-900'
          }`}
        >
          {name}
        </h3>
        <p className="text-sm text-primary font-medium">{specialty}</p>

        {location && (
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3" aria-hidden="true" />
            {location}
          </p>
        )}

        <div
          className="flex items-center justify-center gap-0.5"
          role="img"
          aria-label={`Valoración: ${rating} de 5 estrellas`}
        >
          {renderStars()}
          <span className={`ml-2 text-sm font-medium ${showInviteCTA ? 'text-slate-300' : 'text-slate-600'}`}>
            {rating.toFixed(1)}
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-5">
        <InviteButton />
      </div>

      {/* Invite badge */}
      {showInviteCTA && (
        <p className="text-center text-xs text-slate-500 mt-3">
          Puede enviarte una invitación
        </p>
      )}
    </motion.article>
  );
};

export default ProfessionalHighlightCard;
