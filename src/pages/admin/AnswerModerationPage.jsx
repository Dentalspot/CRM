import React from 'react';
import ModerationCard from '@/components/qa/ModerationCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

const FAKE_QUEUE = [
  { id: 101, title: 'Respuesta en: ¿Cómo tratar la dislalia?', content_snippet: 'Te recomiendo que uses este remedio casero que vi en internet...', flags: ['Contenido médico no verificado'] },
  { id: 102, title: 'Pregunta nueva: ¿Consulta gratis?', content_snippet: 'Busco dentista gratis urgente...', flags: [] }
];

const AnswerModerationPage = () => {
  const handleApprove = (id) => {};
  const handleReject = (id) => {};

  return (
<div className="p-6 space-y-6">
          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Cola de Moderación</AlertTitle>
            <AlertDescription>
              Hay {FAKE_QUEUE.length} elementos pendientes de revisión.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FAKE_QUEUE.map(item => (
              <ModerationCard 
                key={item.id} 
                item={item} 
                type={item.flags.length > 0 ? "Reporte" : "Nuevo Contenido"}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
    </div>
  );
};

export default AnswerModerationPage;