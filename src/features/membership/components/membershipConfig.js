import {
  Gift, Zap, Users, ShieldCheck,
  Calendar, FileText, MessageSquare, BarChart3,
  Sparkles, Mic, Brain, Globe, Palette,
  Building2, Store,
} from 'lucide-react';
import { PLAN_NAMES } from '../api/membershipApi';

export const PLAN_UI_CONFIG = {
  [PLAN_NAMES.FREE]: {
    icon: Gift,
    color: 'gray',
    gradient: 'from-gray-400 to-gray-500',
    bgLight: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-600',
    badgeClass: 'bg-gray-100 text-gray-700',
  },
  [PLAN_NAMES.INDIVIDUAL]: {
    icon: Zap,
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-600',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
  [PLAN_NAMES.PROFESSIONAL]: {
    icon: Users,
    color: 'pink',
    gradient: 'from-pink-500 to-rose-500',
    bgLight: 'bg-pink-50',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-600',
    badgeClass: 'bg-pink-100 text-pink-700',
    popular: true,
  },
  [PLAN_NAMES.CENTER]: {
    icon: ShieldCheck,
    color: 'teal',
    gradient: 'from-teal-500 to-emerald-500',
    bgLight: 'bg-teal-50',
    borderColor: 'border-teal-200',
    textColor: 'text-teal-600',
    badgeClass: 'bg-teal-100 text-teal-700',
  },
};

export const FEATURE_DISPLAY_CONFIG = {
  scheduling: { icon: Calendar, label: 'Agendamiento' },
  clinicalHistory: { icon: FileText, label: 'Historial Clínico' },
  basicReports: { icon: FileText, label: 'Informes' },
  emailReminders: { icon: MessageSquare, label: 'Recordatorios Email' },
  whatsappReminders: { icon: MessageSquare, label: 'WhatsApp' },
  metricsPanel: { icon: BarChart3, label: 'Panel Métricas' },
  aiAssistant: { icon: Sparkles, label: 'Asistente IA' },
  aiReports: { icon: Mic, label: 'Notiz (IA)' },
  aiPlanGenerator: { icon: Brain, label: 'Generador Planes IA' },
  landingPage: { icon: Globe, label: 'Landing Page' },
  brandCustomization: { icon: Palette, label: 'Personalización' },
  customTemplates: { icon: FileText, label: 'Plantillas Custom' },
  multiClinic: { icon: Building2, label: 'Multiclínica' },
  marketplaceBuy: { icon: Store, label: 'Marketplace' },
  marketplaceSell: { icon: Store, label: 'Vender en Marketplace' },
};
