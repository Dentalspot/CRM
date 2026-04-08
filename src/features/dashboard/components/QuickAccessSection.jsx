import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  User,
  FileText,
  Award,
  AlertCircle,
  Gift,
  ShoppingBag,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import SupportTicketModal from '@/components/shared/SupportTicketModal';

const getQuickLinks = (publicSlug) => [
  {
    title: 'Mi Agenda',
    icon: Calendar,
    href: '/dashboard/calendar',
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
    description: 'Gestionar citas'
  },
  {
    title: 'Mis Pacientes',
    icon: Users,
    href: '/dashboard/patients',
    color: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
    description: 'Ver expedientes'
  },
  {
    title: 'Perfil Público',
    icon: User,
    href: publicSlug ? `/${publicSlug}` : '/dashboard/profile',
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
    description: 'Ver mi landing',
    external: !!publicSlug
  },
  {
    title: 'Reportes',
    icon: FileText,
    href: '/dashboard/reports',
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400',
    description: 'Generar informes'
  },
  {
    title: 'Materiales',
    icon: ShoppingBag,
    href: '/dashboard/profile?tab=docs',
    color: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
    description: 'Mis recursos'
  },
  {
    title: 'DentalLevel',
    icon: Award,
    href: '/dashboard/profile?tab=dentallevel',
    color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400',
    description: 'Mi reputación'
  },
  {
    title: 'Invitaciones',
    icon: Gift,
    href: '/dashboard/profile?tab=invitations',
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
    description: 'Invitar colegas'
  },
  {
    title: 'Reportar problema',
    icon: AlertCircle,
    href: '#support',
    color: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
    description: 'Soporte técnico',
    isAction: true
  },
];

const QuickAccessSection = ({ publicSlug }) => {
  const quickLinks = getQuickLinks(publicSlug);
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Acceso Rápido</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickLinks.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            {item.isAction ? (
              <button
                onClick={() => setSupportOpen(true)}
                className="flex flex-col items-center justify-center p-4 bg-card hover:bg-accent/50 border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-center h-full group w-full"
              >
                <div className={cn("p-3 rounded-full mb-3 transition-transform group-hover:scale-110", item.color)}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className="font-medium text-sm text-foreground">{item.title}</span>
                <span className="text-xs text-muted-foreground mt-1 hidden sm:block">{item.description}</span>
              </button>
            ) : item.external ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-4 bg-card hover:bg-accent/50 border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-center h-full group"
              >
                <div className={cn("p-3 rounded-full mb-3 transition-transform group-hover:scale-110", item.color)}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className="font-medium text-sm text-foreground">{item.title}</span>
                <span className="text-xs text-muted-foreground mt-1 hidden sm:block">{item.description}</span>
              </a>
            ) : (
              <Link
                to={item.href}
                className="flex flex-col items-center justify-center p-4 bg-card hover:bg-accent/50 border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 text-center h-full group"
              >
                <div className={cn("p-3 rounded-full mb-3 transition-transform group-hover:scale-110", item.color)}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className="font-medium text-sm text-foreground">{item.title}</span>
                <span className="text-xs text-muted-foreground mt-1 hidden sm:block">{item.description}</span>
              </Link>
            )}
          </motion.div>
        ))}
      </div>
      <SupportTicketModal open={supportOpen} onOpenChange={setSupportOpen} />
    </section>
  );
};

export default QuickAccessSection;