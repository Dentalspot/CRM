import React, { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Activity,
  Award,
  BarChart,
  BookOpen,
  Brain,
  Briefcase,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  DollarSign,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MessageCircle as MessageCircleQuestion,
  MessageSquare,
  Mic,
  Scale,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  Users,
  Wallet,
  X,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/shared/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { USER_ROLES } from '@/constants/roles';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import SupportTicketModal from '@/components/shared/SupportTicketModal';
import useCurrentOrganization from '@/hooks/useCurrentOrganization';
import logger from '@/lib/utils/logger';

const SidebarItem = ({ item, isSubItem = false, onClick, onAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubItems = item.subItems && item.subItems.length > 0;

  const toggleOpen = (e) => {
    if (item.isAction) {
      e.preventDefault();
      if (onAction) onAction(item);
      return;
    }
    if (hasSubItems) {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (onClick) {
      onClick();
    }
  };

  if (item.isAction) {
    return (
      <button
        onClick={toggleOpen}
        className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-muted-foreground hover:bg-red-50 hover:text-red-600 w-full font-medium"
      >
        <item.icon className="h-5 w-5" />
        <span>{item.name}</span>
      </button>
    );
  }

  return (
    <div>
      <NavLink
        to={item.path}
        end={!hasSubItems}
        onClick={toggleOpen}
        className={({ isActive: linkActive }) => {
          const isActive = linkActive;
          
          return cn(
            'flex items-center justify-between gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer',
            isSubItem ? 'text-sm' : 'font-medium',
            isActive && !hasSubItems
              ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          );
        }}
      >
        <div className="flex items-center gap-3">
          <item.icon className={cn("h-5 w-5", isSubItem && "h-4 w-4")} />
          <span className={cn(isSubItem && "text-sm")}>{item.name}</span>
        </div>
        {hasSubItems && (
          isOpen ? <ChevronDown className="h-4 w-4 opacity-50" /> : <ChevronRight className="h-4 w-4 opacity-50" />
        )}
      </NavLink>

      <AnimatePresence>
        {hasSubItems && isOpen && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-4 pl-2 mt-1 space-y-1 border-l border-border/40 overflow-hidden"
          >
            {item.subItems.map((subItem, subItemIndex) => (
              <li key={subItemIndex}>
                <SidebarItem item={subItem} isSubItem={true} onClick={onClick} />
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { effectiveRole: effectiveOrgRole } = useCurrentOrganization();

  const userRole = effectiveOrgRole || profile?.role || user?.role || 'patient';

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth/login');
    } catch (error) {
      logger.error('Error al cerrar sesión:', error);
      localStorage.clear();
      window.location.href = '/auth/login';
    }
  };

  const getNavigationItems = (role) => {
    switch (role) {
      case USER_ROLES.THERAPIST:
        return [
          {
            section: 'General',
            items: [
              { name: 'Dashboard', icon: Home, path: '/dashboard/therapist' },
              { name: 'Mi Perfil', icon: Briefcase, path: '/dashboard/profile' },
              { name: 'Calendario', icon: Calendar, path: '/dashboard/calendar' },
              { name: 'Mis Pacientes', icon: Users, path: '/dashboard/patients' },
              ...(FEATURE_FLAGS.MARKETPLACE
                ? [{ name: 'Tienda', icon: Store, path: '/dashboard/marketplace' }]
                : []),
              { name: 'Blog & Preguntas', icon: BookOpen, path: '/dashboard/therapist/questions' },
            ],
          },
          {
            section: 'Evaluaciones Clínicas',
            items: [
              { name: 'Odontograma', icon: ClipboardCheck, path: '/dashboard/therapist/odontograma' },
            ],
          },
          {
            section: 'Herramientas IA',
            items: [
              ...(FEATURE_FLAGS.NOTIZ
                ? [{ name: 'Notiz - Notas Auto.', icon: Mic, path: '/dashboard/therapist/notiz' }]
                : []),
              { name: 'Crear Plantilla', icon: Sparkles, path: '/dashboard/therapist/create-template' },
              { name: 'Evidencia Científica', icon: BookOpen, path: '/dashboard/therapist/evidence-search' },
              { name: 'Asistente Virtual', icon: MessageSquare, path: '/dashboard/chatbot' },
            ],
          },
        ];
      case USER_ROLES.PATIENT:
        return [
          {
            section: 'General',
            items: [
              { name: 'Dashboard', icon: Home, path: '/dashboard/patient' },
              { name: 'Mi Agenda', icon: Calendar, path: '/dashboard/my-agenda' },
              { name: 'Mi Progreso', icon: TrendingUp, path: '/dashboard/patient/my-progress' },
              { name: 'Mis Preguntas', icon: MessageCircleQuestion, path: '/dashboard/questions' },
              { name: 'Mi Ficha Clínica', icon: FileText, path: '/dashboard/patient/clinical-file' },
              { name: 'Historial de Accesos', icon: ShieldCheck, path: '/dashboard/patient/access-history' },
              { name: 'Asistente Virtual', icon: MessageSquare, path: '/dashboard/chatbot' },
            ],
          },
          {
            section: 'Cuenta',
            items: [
              { name: 'Mi Perfil', icon: Settings, path: '/dashboard/profile' },
            ],
          },
        ];
      case USER_ROLES.ADMIN:
        // Admin uses AdminShell exclusively — no DentalSpot sidebar
        return [];
      case USER_ROLES.CLINIC:
        return [
          {
            section: 'General',
            items: [
              { name: 'Dashboard', icon: Home, path: '/dashboard/clinic' },
              { name: 'Mi Perfil Clínica', icon: Building2, path: '/dashboard/profile' },
              { name: 'Gestión de Dentistas', icon: Users, path: '/dashboard/clinic/therapists' },
              { name: 'Reportes', icon: BarChart, path: '/dashboard/clinic/reports' },
              { name: 'Membresía', icon: DollarSign, path: '/dashboard/membership' },
              { name: 'Asistente Virtual', icon: MessageSquare, path: '/dashboard/chatbot' },
              { name: 'Reportar problema', icon: AlertCircle, path: '#support', isAction: true },
            ],
          },
        ];
      case USER_ROLES.ASSISTANT:
        return [
          {
            section: 'Recepción',
            items: [
              { name: 'Panel', icon: Home, path: '/dashboard/assistant' },
              { name: 'Agenda', icon: Calendar, path: '/dashboard/assistant/agenda' },
              { name: 'Pacientes', icon: Users, path: '/dashboard/assistant/patients' },
            ],
          },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavigationItems(userRole);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  const handleItemClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform duration-300 ease-in-out md:static md:translate-x-0",
        isOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
      )}
    >
      <div className="flex items-center justify-between px-4 pt-6 pb-4 md:mb-2 md:pt-6 md:pb-4 border-b md:border-none">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <Logo />
        </Link>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 px-4 overflow-y-auto scrollbar-thin scrollbar-thumb-muted py-4 md:py-0">
        {navItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2 px-3">
              {section.section}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <SidebarItem item={item} onClick={handleItemClick} onAction={() => setSupportModalOpen(true)} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-4 mt-auto pt-4 pb-6 border-t bg-background space-y-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Cerrar Sesión</span>
        </button>

        <div className="flex items-center gap-3 px-3 py-2 text-muted-foreground text-xs">
          <span>© 2026 DentalSpot</span>
        </div>
      </div>
      <SupportTicketModal open={supportModalOpen} onOpenChange={setSupportModalOpen} />
    </aside>
  );
};

export default Sidebar;