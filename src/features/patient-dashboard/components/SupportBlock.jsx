import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  HelpCircle,
  Headphones,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SupportTicketModal from '@/components/shared/SupportTicketModal';

const SupportBlock = ({ onOpenChat }) => {
  const [ticketModalOpen, setTicketModalOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card className="border border-gray-100 bg-gray-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Headphones className="h-3.5 w-3.5 text-indigo-500" />
            </div>
            <span className="text-sm font-semibold text-gray-700">
              ¿Necesitas ayuda?
            </span>
          </div>

          <p className="text-xs text-gray-500 mb-3">
            Si tienes dudas sobre tu tratamiento, tus citas o el uso de la plataforma, estamos aquí.
          </p>

          <div className="space-y-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-medium"
              onClick={onOpenChat}
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              Abrir chat de ayuda
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium"
              onClick={() => setTicketModalOpen(true)}
            >
              <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
              Reportar un problema
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="w-full text-gray-400 hover:text-indigo-600 text-xs"
              asChild
            >
              <Link to="/ayuda">
                <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
                Preguntas frecuentes
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <SupportTicketModal open={ticketModalOpen} onOpenChange={setTicketModalOpen} />
    </motion.div>
  );
};

export default SupportBlock;