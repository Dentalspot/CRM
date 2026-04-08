import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { 
  MessageCircle, 
  ChevronRight, 
  UserCheck,
  Search 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import SymptomForm from '@/features/recommendations/components/SymptomForm';

const MyTherapistCard = ({ therapist, lastSessionDate = null, onContact, onRecommend, isLoadingRecs = false }) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  // ========== SIN TERAPEUTA ==========
  if (!therapist) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <Card className="border border-gray-100">
          <CardContent className="py-6 text-center">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <UserCheck className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium text-sm">
              Aún no tienes un dentista asignado.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Puedes buscar un especialista que se ajuste a tus necesidades.
            </p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="mt-3">
                  <Search className="h-3.5 w-3.5 mr-1.5" />
                  Buscar especialista
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-transparent border-none shadow-none">
                <SymptomForm
                  onRecommend={() => {
                    setDialogOpen(false);
                    window.location.href = '/fonoaudiologos';
                  }}
                  isLoading={false}
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ========== DATOS ==========
  const therapistName = therapist.full_name || 'Tu dentista';
  const specialty = therapist.specialty || 'Odontólogo/a';

  const lastSessionLabel = lastSessionDate
    ? `Última sesión: ${format(
        typeof lastSessionDate === 'string' ? parseISO(lastSessionDate) : lastSessionDate,
        "d 'de' MMM",
        { locale: es }
      )}`
    : null;

  // ========== CON TERAPEUTA ==========
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      <Card className="border border-gray-100">
        <CardContent className="p-4">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-3 block">
            Mi dentista
          </span>

          {/* Avatar + Info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-teal-50 flex items-center justify-center overflow-hidden shrink-0">
              <ProfileAvatar
                profile={therapist}
                src={therapist.avatar_url}
                alt={therapistName}
                className="h-12 w-12"
              />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {therapistName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {specialty}
              </p>
              {lastSessionLabel && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {lastSessionLabel}
                </p>
              )}
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-2">
            <Button
              size="sm"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium"
              onClick={onContact}
            >
              <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
              Enviar mensaje
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-gray-400 hover:text-teal-600 text-xs"
              asChild
            >
              <Link to={`/${therapist.slug || therapist.id}`}>
                Ver perfil profesional
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MyTherapistCard;