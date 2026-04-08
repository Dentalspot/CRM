import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle as MessageCircleQuestion,
  ChevronRight, 
  Plus 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const MyQuestionsBlock = ({ pendingCount = 0, answeredCount = 0 }) => {
  const totalCount = pendingCount + answeredCount;

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card className="border border-gray-100">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <MessageCircleQuestion className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <span className="text-sm font-semibold text-gray-700">
              Mis Preguntas
            </span>
            {pendingCount > 0 && (
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs ml-auto">
                {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
              </Badge>
            )}
            {pendingCount === 0 && answeredCount > 0 && (
              <Badge className="bg-green-50 text-green-600 border-green-200 text-xs ml-auto">
                {answeredCount} respondida{answeredCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <p className="text-xs text-gray-500 mb-3">
            {totalCount === 0
              ? '¿Tienes dudas sobre tu tratamiento? Envía una pregunta y tu terapeuta te responderá.'
              : `Tienes ${totalCount} pregunta${totalCount > 1 ? 's' : ''} registrada${totalCount > 1 ? 's' : ''}.`
            }
          </p>

          <div className="space-y-2">
            <Button
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
              asChild
            >
              <Link to="/dashboard/questions">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Hacer una pregunta
              </Link>
            </Button>

            {totalCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-gray-400 hover:text-blue-600 text-xs"
                asChild
              >
                <Link to="/dashboard/questions">
                  Ver mis preguntas
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MyQuestionsBlock;