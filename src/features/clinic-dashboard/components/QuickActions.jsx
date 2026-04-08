import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CalendarPlus, 
  UserPlus, 
  Mail, 
  FileText 
} from 'lucide-react';
import { motion } from 'framer-motion';

const ACTIONS = [
  {
    key: 'schedule',
    label: 'Agendar cita',
    icon: CalendarPlus,
    className: 'bg-teal-600 hover:bg-teal-700 text-white',
  },
  {
    key: 'addPatient',
    label: 'Nuevo paciente',
    icon: UserPlus,
    className: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  {
    key: 'inviteTherapist',
    label: 'Invitar terapeuta',
    icon: Mail,
    className: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  },
  {
    key: 'report',
    label: 'Generar reporte',
    icon: FileText,
    className: 'bg-gray-700 hover:bg-gray-800 text-white',
  },
];

const QuickActions = ({ onAction, disabled = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card className="border border-gray-100">
        <CardContent className="p-4">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-3 block">
            Acciones rápidas
          </span>

          <div className="grid grid-cols-2 gap-2">
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.key}
                  size="sm"
                  className={`${action.className} text-xs font-medium justify-start h-9 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={disabled}
                  onClick={() => onAction?.(action.key)}
                >
                  <Icon className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default QuickActions;