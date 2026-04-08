import {
  Stethoscope, FileText, Target, Calendar, Shield, UserPlus,
} from 'lucide-react';

export const EVENT_TYPES = {
  session: {
    key: 'session',
    label: 'Sesión',
    icon: Calendar,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    dot: 'bg-teal-500',
  },
  diagnosis: {
    key: 'diagnosis',
    label: 'Diagnóstico',
    icon: Stethoscope,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  plan: {
    key: 'plan',
    label: 'Plan terapéutico',
    icon: Target,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  document: {
    key: 'document',
    label: 'Documentos',
    icon: FileText,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    dot: 'bg-cyan-500',
  },
  referral: {
    key: 'referral',
    label: 'Derivación',
    icon: UserPlus,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  professional_note: {
    key: 'professional_note',
    label: 'Nota inter-profesional',
    icon: Shield,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
};

export const VISIBILITY_LABELS = {
  all: { label: 'Visible para todos', className: 'bg-green-50 text-green-700' },
  professional_only: { label: 'Solo profesionales', className: 'bg-red-50 text-red-700' },
  author_only: { label: 'Solo autor', className: 'bg-gray-50 text-gray-600' },
};

export const ACCESS_LEVELS = {
  full: { label: 'Acceso completo', description: 'Ve toda la historia incluyendo notas profesionales' },
  read_only: { label: 'Solo lectura', description: 'Ve la historia pero no notas profesionales' },
  professional_notes: { label: 'Solo notas profesionales', description: 'Ve únicamente notas inter-profesionales' },
  revoked: { label: 'Revocado', description: 'Sin acceso' },
};