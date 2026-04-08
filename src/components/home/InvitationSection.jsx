import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Users, Star, ArrowRight, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

// ─── How the invitation model works ─────────────────────────────────────────
const steps = [
  {
    icon: <Lock className="w-6 h-6" />,
    title: 'Acceso solo por invitación',
    description:
      'DentalSpot no es una app que se instala y listo. El ingreso está reservado para odontólogos que ya cumplen un estándar de práctica clínica.',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Un fono de adentro te invita',
    description:
      'Solo un miembro activo de DentalSpot puede enviarte una invitación. Así mantenemos una comunidad de alto nivel donde todos se conocen y se respaldan.',
  },
  {
    icon: <Star className="w-6 h-6" />,
    title: 'Tú decides a quién invitas',
    description:
      'Una vez adentro, puedes invitar a colegas que compartan tu estándar. Tu reputación va ligada a quién recomiendas.',
  },
];

const InvitationSection = () => {
  return (
    <section className="relative bg-slate-900 py-24 overflow-hidden">

      {/* Background glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-3xl rounded-full" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section header ── */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-4 py-2 rounded-full mb-6"
          >
            <Lock className="w-3.5 h-3.5" />
            Comunidad cerrada · Solo por invitación
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-5 leading-tight"
          >
            DentalSpot no es para todos.
            <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Es para los mejores.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Como Clubhouse en sus inicios, la única forma de entrar es que un odontólogo
            ya miembro te invite. Esto no es un filtro arbitrario: es lo que garantiza
            que la comunidad mantenga su nivel.
          </motion.p>
        </div>

        {/* ── 3-step invitation model ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative bg-slate-800/60 backdrop-blur-sm border border-slate-700/60 rounded-2xl p-7 hover:border-primary/40 transition-all duration-300"
            >
              {/* Step number */}
              <div className="absolute -top-3.5 -left-3.5 w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                {i + 1}
              </div>

              {/* Icon */}
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-5">
                {step.icon}
              </div>

              <h3 className="text-white font-semibold text-lg mb-3">{step.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Featured professionals intro ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-4"
        >
          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Miembros activos de DentalSpot
          </div>

          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Estos son los mejores odontólogos del país.
            <br />
            <span className="text-slate-400 font-normal text-xl">
              ¿Quieres ser parte? Contáctalos.
            </span>
          </h3>

          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            Cada uno de ellos puede enviarte una invitación a DentalSpot.
            Escríbeles, cuéntales quién eres y por qué deberías estar adentro.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default InvitationSection;
